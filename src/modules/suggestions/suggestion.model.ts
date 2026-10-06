import { Schema, model, Document, Types } from 'mongoose';

export interface IHymnSuggestion extends Document {
  title: string;
  author: string;
  category: string;
  lyrics: string;
  submittedBy: string;
  email: string;
  userId?: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const HymnSuggestionSchema = new Schema<IHymnSuggestion>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    author: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    lyrics: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    submittedBy: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const HymnSuggestionModel = model<IHymnSuggestion>('HymnSuggestion', HymnSuggestionSchema);
