"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signupController = signupController;
exports.loginController = loginController;
exports.refreshController = refreshController;
exports.logoutController = logoutController;
exports.meController = meController;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../models/User");
const env_1 = require("../config/env");
const validate_1 = require("../utils/validate");
function hashToken(value) {
    return crypto_1.default.createHash('sha256').update(value).digest('hex');
}
function refreshExpiryDate() {
    const now = Date.now();
    return new Date(now + env_1.env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}
async function issueSession(reply, user) {
    const accessToken = await reply.jwtSign({ userId: String(user._id), email: user.email, tokenType: 'access' }, { expiresIn: env_1.env.ACCESS_TOKEN_TTL });
    const refreshToken = await reply.jwtSign({ userId: String(user._id), email: user.email, tokenType: 'refresh' }, { expiresIn: `${env_1.env.REFRESH_TOKEN_TTL_DAYS}d` });
    const refreshTokenHash = hashToken(refreshToken);
    const refreshTokenExpiresAt = refreshExpiryDate();
    await User_1.UserModel.findByIdAndUpdate(user._id, {
        refreshTokenHash,
        refreshTokenExpiresAt
    });
    reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env_1.env.COOKIE_SECURE,
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: env_1.env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60
    });
    return accessToken;
}
async function signupController(request, reply) {
    const { name, email, password } = (request.body || {});
    const safeName = (0, validate_1.sanitizeText)(name, 60);
    const safeEmail = (0, validate_1.sanitizeText)(email, 100).toLowerCase();
    if (!safeName || !safeEmail || !password) {
        return reply.status(400).send({ message: 'Name, email and password are required.' });
    }
    if (!(0, validate_1.isValidEmail)(safeEmail)) {
        return reply.status(400).send({ message: 'Invalid email format.' });
    }
    if (!(0, validate_1.isStrongPassword)(password)) {
        return reply.status(400).send({ message: 'Password must be 8+ chars with letters and numbers.' });
    }
    const existing = await User_1.UserModel.findOne({ email: safeEmail });
    if (existing) {
        return reply.status(409).send({ message: 'Email already registered.' });
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const user = await User_1.UserModel.create({
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
async function loginController(request, reply) {
    const { email, password } = (request.body || {});
    const safeEmail = (0, validate_1.sanitizeText)(email, 100).toLowerCase();
    if (!safeEmail || !password) {
        return reply.status(400).send({ message: 'Email and password are required.' });
    }
    if (!(0, validate_1.isValidEmail)(safeEmail)) {
        return reply.status(400).send({ message: 'Invalid email format.' });
    }
    const user = await User_1.UserModel.findOne({ email: safeEmail });
    if (!user) {
        return reply.status(401).send({ message: 'Invalid email or password.' });
    }
    const match = await bcryptjs_1.default.compare(password, user.passwordHash);
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
async function refreshController(request, reply) {
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
        return reply.status(401).send({ message: 'Missing refresh token.' });
    }
    let payload;
    try {
        payload = request.server.jwt.verify(refreshToken);
    }
    catch (error) {
        return reply.status(401).send({ message: 'Invalid refresh token.' });
    }
    if (payload.tokenType !== 'refresh') {
        return reply.status(401).send({ message: 'Invalid refresh token.' });
    }
    const user = await User_1.UserModel.findById(payload.userId);
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
async function logoutController(request, reply) {
    const refreshToken = request.cookies?.refreshToken;
    if (refreshToken) {
        try {
            const payload = request.server.jwt.verify(refreshToken);
            await User_1.UserModel.findByIdAndUpdate(payload.userId, {
                refreshTokenHash: null,
                refreshTokenExpiresAt: null
            });
        }
        catch (error) {
            // Intentionally ignore invalid token during logout.
        }
    }
    reply.clearCookie('refreshToken', { path: '/api/auth' });
    return reply.send({ message: 'Logged out.' });
}
async function meController(request, reply) {
    const payload = request.user;
    const user = await User_1.UserModel.findById(payload.userId).select('-passwordHash -refreshTokenHash');
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
