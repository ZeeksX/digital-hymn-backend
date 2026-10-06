import { Schema, model, Document, Types } from 'mongoose';

export type ThemeMode = 'light' | 'dark' | 'system';
export type TextSize = 'sm' | 'md' | 'lg' | 'xl';

export interface IUserPreference extends Document {
  userId: Types.ObjectId;
  theme: ThemeMode;
  defaultTextSize: TextSize;
  rememberRecentlyViewed: boolean;
  keepScreenAwake: boolean;
  serifLyrics: boolean;
  showVerseNumbers: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferenceSchema = new Schema<IUserPreference>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
      required: true,
    },
    defaultTextSize: {
      type: String,
      enum: ['sm', 'md', 'lg', 'xl'],
      default: 'md',
      required: true,
    },
    rememberRecentlyViewed: {
      type: Boolean,
      default: true,
      required: true,
    },
    keepScreenAwake: {
      type: Boolean,
      default: false,
      required: true,
    },
    serifLyrics: {
      type: Boolean,
      default: false,
      required: true,
    },
    showVerseNumbers: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret._id;
        delete ret.__v;
        delete ret.userId;
        return ret;
      },
    },
  }
);

export const UserPreferenceModel = model<IUserPreference>('UserPreference', UserPreferenceSchema);
