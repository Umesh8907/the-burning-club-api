import mongoose, { Schema, Document } from 'mongoose';

export interface IMeasurement extends Document {
  userId: mongoose.Types.ObjectId;
  weight: number;
  height?: number;
  bodyFat?: number;
  muscleMass?: number;
  bmi?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  date: Date;
}

const MeasurementSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weight: { type: Number, required: true },
    height: { type: Number },
    bodyFat: { type: Number },
    muscleMass: { type: Number },
    bmi: { type: Number },
    chest: { type: Number },
    waist: { type: Number },
    hips: { type: Number },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Auto-calculate BMI if height is available
MeasurementSchema.pre('save', async function () {
  const doc = this as any;
  if (doc.weight && doc.height) {
    const heightInMeters = doc.height / 100;
    doc.bmi = parseFloat((doc.weight / (heightInMeters * heightInMeters)).toFixed(2));
  }
});

export default mongoose.model<IMeasurement>('Measurement', MeasurementSchema);
