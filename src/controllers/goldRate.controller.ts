import { FastifyReply, FastifyRequest } from 'fastify';
import { ensureUserDailyGoldReset } from '../services/user.service';

export async function getTodayGoldRateController(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.user as { userId: string; email: string };
  const user = await ensureUserDailyGoldReset(payload.userId);
  if (!user) {
    return reply.status(404).send({ message: 'User not found.' });
  }

  return reply.send({
    price: user.todayGoldRate,
    date: user.goldRateDate
  });
}

export async function setTodayGoldRateController(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.user as { userId: string; email: string };
  const { price } = (request.body || {}) as { price?: number };
  const parsedPrice = Number(price);

  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0 || parsedPrice > 1_000_000) {
    return reply.status(400).send({ message: 'Price must be a valid number between 1 and 1000000.' });
  }

  const user = await ensureUserDailyGoldReset(payload.userId);
  if (!user) {
    return reply.status(404).send({ message: 'User not found.' });
  }

  user.todayGoldRate = parsedPrice;
  user.goldRateDate = new Date();
  await user.save();

  return reply.send({
    message: 'Gold rate updated.',
    price: user.todayGoldRate,
    date: user.goldRateDate
  });
}
