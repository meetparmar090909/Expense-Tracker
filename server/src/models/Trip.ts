import mongoose, { Document, Schema } from 'mongoose';

export interface ITripParticipant {
  name: string;
  contributedAmount: number;
}

export interface ITripExpense {
  title: string;
  amount: number;
  paidBy: string;
  date: Date;
  note?: string;
}

export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  destination?: string;
  currency: string;
  startDate?: Date;
  endDate?: Date;
  note?: string;
  participants: ITripParticipant[];
  expenses: ITripExpense[];
  createdAt: Date;
  updatedAt: Date;
}

const TripParticipantSchema = new Schema<ITripParticipant>(
  {
    name: {
      type: String,
      required: [true, 'Participant name is required'],
      trim: true,
      maxlength: [60, 'Participant name cannot exceed 60 characters'],
    },
    contributedAmount: {
      type: Number,
      default: 0,
      min: [0, 'Contribution cannot be negative'],
    },
  },
  { _id: false },
);

const TripExpenseSchema = new Schema<ITripExpense>(
  {
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [100, 'Expense title cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Expense amount must be greater than 0'],
    },
    paidBy: {
      type: String,
      required: [true, 'Paid by is required'],
      trim: true,
      maxlength: [60, 'Paid by cannot exceed 60 characters'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [300, 'Expense note cannot exceed 300 characters'],
    },
  },
  { _id: false },
);

const TripSchema = new Schema<ITrip>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Trip title is required'],
      trim: true,
      maxlength: [100, 'Trip title cannot exceed 100 characters'],
    },
    destination: {
      type: String,
      trim: true,
      maxlength: [100, 'Destination cannot exceed 100 characters'],
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'AED', 'INR', 'EUR', 'GBP'],
    },
    startDate: Date,
    endDate: Date,
    note: {
      type: String,
      trim: true,
      maxlength: [300, 'Trip note cannot exceed 300 characters'],
    },
    participants: {
      type: [TripParticipantSchema],
      default: [],
      validate: {
        validator: (value: ITripParticipant[]) => value.length > 0,
        message: 'At least one participant is required.',
      },
    },
    expenses: {
      type: [TripExpenseSchema],
      default: [],
    },
  },
  { timestamps: true },
);

TripSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<ITrip>('Trip', TripSchema);
