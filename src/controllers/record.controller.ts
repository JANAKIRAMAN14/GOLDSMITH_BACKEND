import { FastifyReply, FastifyRequest } from 'fastify';
import { RecordModel } from '../models/Record';
import { ensureUserDailyGoldReset } from '../services/user.service';
import { uploadImageBuffer } from '../services/cloudinary.service';
import { sanitizeText } from '../utils/validate';

function normalizeStatus(value: unknown): 'Pending' | 'Completed' {
  return value === 'Completed' ? 'Completed' : 'Pending';
}

export async function createRecordController(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.user as { userId: string; email: string };
  const user = await ensureUserDailyGoldReset(payload.userId);
  if (!user) {
    return reply.status(404).send({ message: 'User not found.' });
  }

  if (!request.isMultipart()) {
    return reply.status(400).send({ message: 'Use multipart/form-data.' });
  }

  const fields: Record<string, string> = {};
  let itemImageBuffer: Buffer | null = null;

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

  const customerName = sanitizeText(fields.customerName, 100);
  const itemName = sanitizeText(fields.itemName, 100);
  const weight = Number(fields.weight || 0);
  const stoneSize = sanitizeText(fields.stoneSize, 80);
  const status = normalizeStatus(fields.status);
  const other = sanitizeText(fields.other, 500);
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
    itemImageUrl = await uploadImageBuffer(itemImageBuffer);
  }

  const totalAmount = Number((user.todayGoldRate * weight).toFixed(2));

  const record = await RecordModel.create({
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

export async function listRecordsController(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.user as { userId: string; email: string };
  const records = await RecordModel.find({ userId: payload.userId }).sort({ createdAt: -1 });
  return reply.send({ records });
}

export async function updateRecordController(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.user as { userId: string; email: string };
  const { id } = (request.params || {}) as { id: string };
  const existing = await RecordModel.findOne({ _id: id, userId: payload.userId });
  if (!existing) {
    return reply.status(404).send({ message: 'Record not found.' });
  }

  const body = (request.body || {}) as {
    customerName?: string;
    itemName?: string;
    weight?: number;
    stoneSize?: string;
    status?: 'Pending' | 'Completed';
    other?: string;
    givenDate?: string;
    deliveryDate?: string;
  };

  if (body.customerName !== undefined) existing.customerName = sanitizeText(body.customerName, 100);
  if (body.itemName !== undefined) existing.itemName = sanitizeText(body.itemName, 100);
  if (body.weight !== undefined && Number.isFinite(body.weight) && body.weight > 0) existing.weight = body.weight;
  if (body.stoneSize !== undefined) existing.stoneSize = sanitizeText(body.stoneSize, 80);
  if (body.status !== undefined) existing.status = normalizeStatus(body.status);
  if (body.other !== undefined) existing.other = sanitizeText(body.other, 500);
  if (body.givenDate !== undefined) existing.givenDate = new Date(body.givenDate);
  if (body.deliveryDate !== undefined) existing.deliveryDate = new Date(body.deliveryDate);

  existing.totalAmount = Number((existing.goldRate * existing.weight).toFixed(2));
  await existing.save();

  return reply.send({ record: existing });
}

export async function updateRecordImageController(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.user as { userId: string; email: string };
  if (!request.isMultipart()) {
    return reply.status(400).send({ message: 'Use multipart/form-data.' });
  }

  const { id } = (request.params || {}) as { id: string };
  const existing = await RecordModel.findOne({ _id: id, userId: payload.userId });
  if (!existing) {
    return reply.status(404).send({ message: 'Record not found.' });
  }

  const fileData = await request.file();
  if (!fileData) {
    return reply.status(400).send({ message: 'Image file is required.' });
  }

  const buffer = await fileData.toBuffer();
  const itemImageUrl = await uploadImageBuffer(buffer);
  existing.itemImageUrl = itemImageUrl;
  await existing.save();

  return reply.send({ record: existing });
}

export async function deleteRecordController(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.user as { userId: string; email: string };
  const { id } = (request.params || {}) as { id: string };
  const deleted = await RecordModel.findOneAndDelete({ _id: id, userId: payload.userId });
  if (!deleted) {
    return reply.status(404).send({ message: 'Record not found.' });
  }

  return reply.send({ message: 'Record deleted.' });
}

export async function toggleRecordStatusController(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.user as { userId: string; email: string };
  const { id } = (request.params || {}) as { id: string };
  const record = await RecordModel.findOne({ _id: id, userId: payload.userId });
  if (!record) {
    return reply.status(404).send({ message: 'Record not found.' });
  }

  record.status = record.status === 'Pending' ? 'Completed' : 'Pending';
  await record.save();

  return reply.send({ record });
}
