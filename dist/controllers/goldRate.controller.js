"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayGoldRateController = getTodayGoldRateController;
exports.setTodayGoldRateController = setTodayGoldRateController;
const user_service_1 = require("../services/user.service");
async function getTodayGoldRateController(request, reply) {
    const payload = request.user;
    const user = await (0, user_service_1.ensureUserDailyGoldReset)(payload.userId);
    if (!user) {
        return reply.status(404).send({ message: 'User not found.' });
    }
    return reply.send({
        price: user.todayGoldRate,
        date: user.goldRateDate
    });
}
async function setTodayGoldRateController(request, reply) {
    const payload = request.user;
    const { price } = (request.body || {});
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0 || parsedPrice > 1000000) {
        return reply.status(400).send({ message: 'Price must be a valid number between 1 and 1000000.' });
    }
    const user = await (0, user_service_1.ensureUserDailyGoldReset)(payload.userId);
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
