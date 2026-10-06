import mongoose, { Types } from 'mongoose';
import { FavoriteModel } from './favorite.model';
import { HymnModel } from '../hymns/hymn.model';
import { AppError } from '../../shared/utils/api-error';

export class FavoriteService {
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

  static async getUserFavorites(userId: string) {
    const favorites = await FavoriteModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate({
        path: 'hymnId',
        select: 'number title alternateTitle category author verses meter tune key tags createdAt',
      })
      .lean();

    // Filter out any potential orphaned records where hymn was deleted
    return favorites
      .filter((fav) => fav.hymnId !== null)
      .map((fav: any) => ({
        id: fav._id.toString(),
        hymn: {
          id: fav.hymnId._id.toString(),
          number: fav.hymnId.number,
          title: fav.hymnId.title,
          alternateTitle: fav.hymnId.alternateTitle,
          category: fav.hymnId.category,
          author: fav.hymnId.author,
          verses: fav.hymnId.verses,
          meter: fav.hymnId.meter,
          tune: fav.hymnId.tune,
          key: fav.hymnId.key,
          tags: fav.hymnId.tags,
        },
        createdAt: fav.createdAt,
      }));
  }

  static async addFavorite(userId: string, identifier: string) {
    const hymnObjectId = await this.resolveHymnId(identifier);

    const existing = await FavoriteModel.findOne({
      userId: new Types.ObjectId(userId),
      hymnId: hymnObjectId,
    });

    if (existing) {
      throw AppError.conflict('This hymn is already in your favorites.');
    }

    const created = await FavoriteModel.create({
      userId: new Types.ObjectId(userId),
      hymnId: hymnObjectId,
    });

    const populated = await FavoriteModel.findById(created._id).populate('hymnId').lean();

    return {
      id: created._id.toString(),
      hymnId: hymnObjectId.toString(),
      hymn: (populated as any)?.hymnId,
      createdAt: created.createdAt,
    };
  }

  static async removeFavorite(userId: string, identifier: string) {
    const hymnObjectId = await this.resolveHymnId(identifier);

    const result = await FavoriteModel.findOneAndDelete({
      userId: new Types.ObjectId(userId),
      hymnId: hymnObjectId,
    });

    if (!result) {
      throw AppError.notFound('Favorite record not found.');
    }

    return {
      removed: true,
      hymnId: hymnObjectId.toString(),
    };
  }
}
