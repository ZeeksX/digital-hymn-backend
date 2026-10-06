import { Schema, model, Document } from 'mongoose';

export interface IHymnVerse {
  number: number;
  lines: string[];
  englishLines?: string[];
}

export interface IHymn extends Document {
  number: number;
  title: string;
  alternateTitle?: string;
  category: string;
  author?: string;
  verses: IHymnVerse[];
  chorus?: string[];
  englishChorus?: string[];
  scripture?: {
    text: string;
    reference: string;
  };
  tags: string[];
  meter?: string;
  tune?: string;
  key?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VerseSchema = new Schema<IHymnVerse>(
  {
    number: { type: Number, required: true },
    lines: { type: [String], required: true },
    englishLines: { type: [String], default: undefined },
  },
  { _id: false }
);

const HymnSchema = new Schema<IHymn>(
  {
    number: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    alternateTitle: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    author: {
      type: String,
      trim: true,
      default: 'Unknown',
      index: true,
    },
    verses: {
      type: [VerseSchema],
      required: true,
      validate: [(val: IHymnVerse[]) => val.length > 0, 'Hymn must have at least one verse.'],
    },
    chorus: {
      type: [String],
      default: undefined,
    },
    englishChorus: {
      type: [String],
      default: undefined,
    },
    scripture: {
      text: { type: String },
      reference: { type: String },
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    meter: { type: String },
    tune: { type: String },
    key: { type: String },
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

// Compound text index for robust searching
HymnSchema.index({
  title: 'text',
  alternateTitle: 'text',
  author: 'text',
  category: 'text',
  'verses.lines': 'text',
});

export const HymnModel = model<IHymn>('Hymn', HymnSchema);
