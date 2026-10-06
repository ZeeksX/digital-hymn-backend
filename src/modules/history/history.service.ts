import mongoose, { Types } from 'mongoose';
import { RecentlyViewedModel } from './history.model';
import { HymnModel } from '../hymns/hymn.model';
import { UserPreferenceModel } from '../preferences/preference.model';
import { AppError } from '../../shared/utils/api-error';
import { MAX_RECENTLY_VIEWED } from '../../config/constants';

export class HistoryService {
  private static async resolveHymnId(identifier: string): Promise<Types.ObjectId> {
    if (mongoose.Types.ObjectId.isValid(identifier) && identifier.length === 24) {
      const hymn = await HymnModel.findById(identifier).select('_id').lean();
      if (hymn) return hymn._id as Types.ObjectId;
    }

    if (/^\d+$/.test(identifier)) {
      const hymn = await HymnModel.findOne({ number: parseInt(identifier, 10) }).select('_id').lean();
      if (hymn) return hymn._id as Types.ObjectId;
    }

    throw AppError.notFound(`Hymn with ID or number '${identifier}' was not found.`);
  }

  static async getRecentlyViewed(userId: string) {
    const list = await RecentlyViewedModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ viewedAt: -1 })
      .limit(MAX_RECENTLY_VIEWED)
      .populate({
        path: 'hymnId',
        select: 'number title alternateTitle category author verses meter tune key tags createdAt',
      })
      .lean();

    return list
      .filter((entry) => entry.hymnId !== null)
      .map((entry: any) => ({
        id: entry._id.toString(),
        hymn: {
          id: entry.hymnId._id.toString(),
          number: entry.hymnId.number,
          title: entry.hymnId.title,
          alternateTitle: entry.hymnId.alternateTitle,
          category: entry.hymnId.category,
          author: entry.hymnId.author,
          verses: entry.hymnId.verses,
          meter: entry.hymnId.meter,
          tune: entry.hymnId.tune,
          key: entry.hymnId.key,
          tags: entry.hymnId.tags,
        },
        viewedAt: entry.viewedAt,
      }));
  }

  static async recordRecentlyViewed(userId: string, identifier: string) {
    const userObjectId = new Types.ObjectId(userId);

    // Check user preferences
    const preferences = await UserPreferenceModel.findOne({ userId: userObjectId }).lean();
    if (preferences && preferences.rememberRecentlyViewed === false) {
      return { skipped: true, reason: 'Recently viewed tracking is disabled in user preferences.' };
    }

    const hymnObjectId = await this.resolveHymnId(identifier);

    // Upsert record so that revisiting updates viewedAt
    const record = await RecentlyViewedModel.findOneAndUpdate(
      { userId: userObjectId, hymnId: hymnObjectId },
      { $set: { viewedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Keep history bounded to MAX_RECENTLY_VIEWED (e.g., 30)
    const excessRecords = await RecentlyViewedModel.find({ userId: userObjectId })
      .sort({ viewedAt: -1 })
      .skip(MAX_RECENTLY_VIEWED)
      .select('_id')
      .lean();

    if (excessRecords.length > 0) {
      const idsToDelete = excessRecords.map((r) => r._id);
      await RecentlyViewedModel.deleteMany({ _id: { $in: idsToDelete } });
    }

    const populated = await RecentlyViewedModel.findById(record._id).populate('hymnId').lean();

    return {
      id: record._id.toString(),
      hymnId: hymnObjectId.toString(),
      hymn: (populated as any)?.hymnId,
      viewedAt: record.viewedAt,
    };
  }
}
