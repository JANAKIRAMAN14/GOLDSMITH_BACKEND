"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureUserDailyGoldReset = ensureUserDailyGoldReset;
const User_1 = require("../models/User");
const date_1 = require("../utils/date");
async function ensureUserDailyGoldReset(userId) {
    const user = await User_1.UserModel.findById(userId);
    if (!user)
        return null;
    const today = (0, date_1.todayString)();
    if (!(0, date_1.isSameDay)(user.goldRateDate, today)) {
        user.todayGoldRate = 0;
        user.goldRateDate = new Date();
        await user.save();
    }
    return user;
}
