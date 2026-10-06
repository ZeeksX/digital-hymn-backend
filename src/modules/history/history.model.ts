import { Schema, model, Document, Types } from 'mongoose';

export interface IRecentlyViewed extends Document {
  userId: Types.ObjectId;
  hymnId: Types.ObjectId;
  viewedAt: Date;
}

const RecentlyViewedSchema = new Schema<IRecentlyViewed>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hymnId: {
      type: Schema.Types.ObjectId,
      ref: 'Hymn',
      required: true,
      index: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
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

RecentlyViewedSchema.index({ userId: 1, hymnId: 1 }, { unique: true });
RecentlyViewedSchema.index({ userId: 1, viewedAt: -1 });

export const RecentlyViewedModel = model<IRecentlyViewed>('RecentlyViewed', RecentlyViewedSchema);
