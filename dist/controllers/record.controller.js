"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecordController = createRecordController;
exports.listRecordsController = listRecordsController;
exports.updateRecordController = updateRecordController;
exports.updateRecordImageController = updateRecordImageController;
exports.deleteRecordController = deleteRecordController;
exports.toggleRecordStatusController = toggleRecordStatusController;
const Record_1 = require("../models/Record");
const user_service_1 = require("../services/user.service");
const cloudinary_service_1 = require("../services/cloudinary.service");
const validate_1 = require("../utils/validate");
function normalizeStatus(value) {
    return value === 'Completed' ? 'Completed' : 'Pending';
}
async function createRecordController(request, reply) {
    const payload = request.user;
    const user = await (0, user_service_1.ensureUserDailyGoldReset)(payload.userId);
    if (!user) {
        return reply.status(404).send({ message: 'User not found.' });
    }
    if (!request.isMultipart()) {
        return reply.status(400).send({ message: 'Use multipart/form-data.' });
    }
    const fields = {};
    let itemImageBuffer = null;
    for await (const part of request.parts()) {
        if (part.type === 'file') {
            const buffer = await part.toBuffer();
            if (part.fieldname === 'itemImage' && buffer.length > 0) {
                itemImageBuffer = buffer;
            }
            continue;
        }
        fields[part.fieldname] = String(part.value ?? '');
    }
    const customerName = (0, validate_1.sanitizeText)(fields.customerName, 100);
    const itemName = (0, validate_1.sanitizeText)(fields.itemName, 100);
    const weight = Number(fields.weight || 0);
    const stoneSize = (0, validate_1.sanitizeText)(fields.stoneSize, 80);
    const status = normalizeStatus(fields.status);
    const other = (0, validate_1.sanitizeText)(fields.other, 500);
    const givenDate = fields.givenDate;
    const deliveryDate = fields.deliveryDate;
    if (!customerName || !itemName || !Number.isFinite(weight) || weight <= 0 || !givenDate || !deliveryDate) {
        return reply.status(400).send({ message: 'Missing required record fields.' });
    }
    if (user.todayGoldRate <= 0) {
        return reply.status(400).send({ message: 'Set today gold rate first.' });
    }
    let itemImageUrl = '';
    if (itemImageBuffer) {
        itemImageUrl = await (0, cloudinary_service_1.uploadImageBuffer)(itemImageBuffer);
    }
    const totalAmount = Number((user.todayGoldRate * weight).toFixed(2));
    const record = await Record_1.RecordModel.create({
        userId: user._id,
        goldRate: user.todayGoldRate,
        customerName,
        itemName,
        weight,
        stoneSize,
        status,
        other,
        itemImageUrl,
        totalAmount,
        givenDate: new Date(givenDate),
        deliveryDate: new Date(deliveryDate)
    });
    return reply.status(201).send({ record });
}
async function listRecordsController(request, reply) {
    const payload = request.user;
    const records = await Record_1.RecordModel.find({ userId: payload.userId }).sort({ createdAt: -1 });
    return reply.send({ records });
}
async function updateRecordController(request, reply) {
    const payload = request.user;
    const { id } = (request.params || {});
    const existing = await Record_1.RecordModel.findOne({ _id: id, userId: payload.userId });
    if (!existing) {
        return reply.status(404).send({ message: 'Record not found.' });
    }
    const body = (request.body || {});
    if (body.customerName !== undefined)
        existing.customerName = (0, validate_1.sanitizeText)(body.customerName, 100);
    if (body.itemName !== undefined)
        existing.itemName = (0, validate_1.sanitizeText)(body.itemName, 100);
    if (body.weight !== undefined && Number.isFinite(body.weight) && body.weight > 0)
        existing.weight = body.weight;
    if (body.stoneSize !== undefined)
        existing.stoneSize = (0, validate_1.sanitizeText)(body.stoneSize, 80);
    if (body.status !== undefined)
        existing.status = normalizeStatus(body.status);
    if (body.other !== undefined)
        existing.other = (0, validate_1.sanitizeText)(body.other, 500);
    if (body.givenDate !== undefined)
        existing.givenDate = new Date(body.givenDate);
    if (body.deliveryDate !== undefined)
        existing.deliveryDate = new Date(body.deliveryDate);
    existing.totalAmount = Number((existing.goldRate * existing.weight).toFixed(2));
    await existing.save();
    return reply.send({ record: existing });
}
async function updateRecordImageController(request, reply) {
    const payload = request.user;
    if (!request.isMultipart()) {
        return reply.status(400).send({ message: 'Use multipart/form-data.' });
    }
    const { id } = (request.params || {});
    const existing = await Record_1.RecordModel.findOne({ _id: id, userId: payload.userId });
    if (!existing) {
        return reply.status(404).send({ message: 'Record not found.' });
    }
    const fileData = await request.file();
    if (!fileData) {
        return reply.status(400).send({ message: 'Image file is required.' });
    }
    const buffer = await fileData.toBuffer();
    const itemImageUrl = await (0, cloudinary_service_1.uploadImageBuffer)(buffer);
    existing.itemImageUrl = itemImageUrl;
    await existing.save();
    return reply.send({ record: existing });
}
async function deleteRecordController(request, reply) {
    const payload = request.user;
    const { id } = (request.params || {});
    const deleted = await Record_1.RecordModel.findOneAndDelete({ _id: id, userId: payload.userId });
    if (!deleted) {
        return reply.status(404).send({ message: 'Record not found.' });
    }
    return reply.send({ message: 'Record deleted.' });
}
async function toggleRecordStatusController(request, reply) {
    const payload = request.user;
    const { id } = (request.params || {});
    const record = await Record_1.RecordModel.findOne({ _id: id, userId: payload.userId });
    if (!record) {
        return reply.status(404).send({ message: 'Record not found.' });
    }
    record.status = record.status === 'Pending' ? 'Completed' : 'Pending';
    await record.save();
    return reply.send({ record });
}
