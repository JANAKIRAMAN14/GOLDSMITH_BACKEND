import { Schema, model, Document, Types } from 'mongoose';

export type RecordStatus = 'Pending' | 'Completed';

export interface IRecord extends Document {
  userId: Types.ObjectId;
  goldRate: number;
  customerName: string;
  weight: number;
  itemName: string;
  stoneSize?: string;
  status: RecordStatus;
  other?: string;
  itemImageUrl?: string;
  totalAmount: number;
  givenDate: Date;
  deliveryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecordSchema = new Schema<IRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
  },
  {
    timestamps: true
  }
);

export const RecordModel = model<IRecord>('Record', RecordSchema);
