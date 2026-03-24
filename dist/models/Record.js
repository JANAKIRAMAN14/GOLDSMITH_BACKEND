"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordModel = void 0;
const mongoose_1 = require("mongoose");
const RecordSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goldRate: { type: Number, required: true },
    customerName: { type: String, required: true, trim: true },
    weight: { type: Number, required: true },
    itemName: { type: String, required: true, trim: true },
    stoneSize: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
    other: { type: String, trim: true, default: '' },
    itemImageUrl: { type: String, default: '' },
    totalAmount: { type: Number, required: true },
    givenDate: { type: Date, required: true },
    deliveryDate: { type: Date, required: true }
}, {
    timestamps: true
});
exports.RecordModel = (0, mongoose_1.model)('Record', RecordSchema);
