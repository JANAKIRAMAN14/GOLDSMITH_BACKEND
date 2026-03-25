import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserModel } from '../models/User';
import { env } from '../config/env';
import { isStrongPassword, isValidEmail, sanitizeText } from '../utils/validate';

function hashToken(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function refreshExpiryDate(): Date {
  const now = Date.now();
  return new Date(now + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function getRefreshCookieOptions(includeMaxAge = true) {
  const secure = env.NODE_ENV === 'production' || env.COOKIE_SECURE;
  const sameSite = secure ? 'none' : 'lax';

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/api/auth',
    ...(includeMaxAge ? { maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 } : {})
  } as const;
}

async function issueSession(reply: FastifyReply, user: { _id: unknown; email: string }) {
  const accessToken = await reply.jwtSign(
    { userId: String(user._id), email: user.email, tokenType: 'access' },
    { expiresIn: env.ACCESS_TOKEN_TTL }
  );

  const refreshToken = await reply.jwtSign(
    { userId: String(user._id), email: user.email, tokenType: 'refresh' },
    { expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` }
  );

  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenExpiresAt = refreshExpiryDate();

  await UserModel.findByIdAndUpdate(user._id, {
    refreshTokenHash,
    refreshTokenExpiresAt
  });

  reply.setCookie('refreshToken', refreshToken, getRefreshCookieOptions(true));

  return accessToken;
}

export async function signupController(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password } = (request.body || {}) as {
    name?: string;
    email?: string;
    password?: string;
  };

  const safeName = sanitizeText(name, 60);
  const safeEmail = sanitizeText(email, 100).toLowerCase();

  if (!safeName || !safeEmail || !password) {
    return reply.status(400).send({ message: 'Name, email and password are required.' });
  }

  if (!isValidEmail(safeEmail)) {
    return reply.status(400).send({ message: 'Invalid email format.' });
  }

  if (!isStrongPassword(password)) {
    return reply.status(400).send({ message: 'Password must be 8+ chars with letters and numbers.' });
  }

  const existing = await UserModel.findOne({ email: safeEmail });
  if (existing) {
    return reply.status(409).send({ message: 'Email already registered.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await UserModel.create({
    name: safeName,
    email: safeEmail,
    passwordHash,
    todayGoldRate: 0,
    goldRateDate: new Date(),
    refreshTokenHash: null,
    refreshTokenExpiresAt: null
  });

  const accessToken = await issueSession(reply, user);

  return reply.status(201).send({
    accessToken,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      todayGoldRate: user.todayGoldRate
    }
  });
}

export async function loginController(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = (request.body || {}) as {
    email?: string;
    password?: string;
  };

  const safeEmail = sanitizeText(email, 100).toLowerCase();

  if (!safeEmail || !password) {
    return reply.status(400).send({ message: 'Email and password are required.' });
  }

  if (!isValidEmail(safeEmail)) {
    return reply.status(400).send({ message: 'Invalid email format.' });
  }

  const user = await UserModel.findOne({ email: safeEmail });
  if (!user) {
    return reply.status(401).send({ message: 'Invalid email or password.' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return reply.status(401).send({ message: 'Invalid email or password.' });
  }

  const accessToken = await issueSession(reply, user);

  return reply.send({
    accessToken,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      todayGoldRate: user.todayGoldRate
    }
  });
}

export async function refreshController(request: FastifyRequest, reply: FastifyReply) {
  const refreshToken = request.cookies?.refreshToken;
  if (!refreshToken) {
    return reply.status(401).send({ message: 'Missing refresh token.' });
  }

  let payload: { userId: string; email: string; tokenType: string };
  try {
    payload = request.server.jwt.verify(refreshToken) as { userId: string; email: string; tokenType: string };
  } catch (error) {
    return reply.status(401).send({ message: 'Invalid refresh token.' });
  }

  if (payload.tokenType !== 'refresh') {
    return reply.status(401).send({ message: 'Invalid refresh token.' });
  }

  const user = await UserModel.findById(payload.userId);
  if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
    return reply.status(401).send({ message: 'Session expired.' });
  }

  const validHash = hashToken(refreshToken) === user.refreshTokenHash;
  const notExpired = user.refreshTokenExpiresAt.getTime() > Date.now();
  if (!validHash || !notExpired) {
    return reply.status(401).send({ message: 'Session expired.' });
  }

  const accessToken = await issueSession(reply, user);

  return reply.send({
    accessToken,
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      todayGoldRate: user.todayGoldRate
    }
  });
}

export async function logoutController(request: FastifyRequest, reply: FastifyReply) {
  const refreshToken = request.cookies?.refreshToken;

  if (refreshToken) {
    try {
      const payload = request.server.jwt.verify(refreshToken) as { userId: string };
      await UserModel.findByIdAndUpdate(payload.userId, {
        refreshTokenHash: null,
        refreshTokenExpiresAt: null
      });
    } catch (error) {
      // Intentionally ignore invalid token during logout.
    }
  }

  reply.clearCookie('refreshToken', getRefreshCookieOptions(false));
  return reply.send({ message: 'Logged out.' });
}

export async function meController(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.user as { userId: string; email: string };
  const user = await UserModel.findById(payload.userId).select('-passwordHash -refreshTokenHash');
  if (!user) {
    return reply.status(404).send({ message: 'User not found.' });
  }

  return reply.send({
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      todayGoldRate: user.todayGoldRate,
      goldRateDate: user.goldRateDate
    }
  });
}
