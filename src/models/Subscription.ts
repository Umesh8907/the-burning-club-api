import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  amount: number;
  status: 'active' | 'expired' | 'canceled' | 'pending';
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

const SubscriptionSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'Plan', required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['active', 'expired', 'canceled', 'pending'],
      default: 'pending',
    },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
