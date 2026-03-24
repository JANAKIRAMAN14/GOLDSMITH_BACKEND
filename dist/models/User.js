"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    todayGoldRate: { type: Number, default: 0 },
    goldRateDate: { type: Date, default: null },
    refreshTokenHash: { type: String, default: null },
    refreshTokenExpiresAt: { type: Date, default: null }
}, {
    timestamps: true
});
exports.UserModel = (0, mongoose_1.model)('User', UserSchema);
