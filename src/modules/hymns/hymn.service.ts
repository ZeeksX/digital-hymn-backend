import mongoose from 'mongoose';
import { HymnModel } from './hymn.model';
import { HymnQueryInput } from './hymn.schema';
import { escapeRegex } from '../../shared/utils/sanitize';
import { AppError } from '../../shared/utils/api-error';
import { PaginationMeta } from '../../shared/utils/api-response';

type HymnFilter = Record<string, any>;

export class HymnService {
  static async getHymns(params: HymnQueryInput) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const filter: HymnFilter = {};

    // Category filter
    if (params.category && params.category.trim() !== '') {
      filter.category = new RegExp(`^${escapeRegex(params.category.trim())}$`, 'i');
    }

    // Search filter across title, number, alternateTitle, author, lyrics/verses
    if (params.search && params.search.trim() !== '') {
      const searchTerm = params.search.trim();
      const escaped = escapeRegex(searchTerm);
      const regex = new RegExp(escaped, 'i');

      const isNumeric = /^\d+$/.test(searchTerm);
      const orConditions: HymnFilter[] = [
        { title: regex },
        { alternateTitle: regex },
        { author: regex },
        { 'verses.lines': regex },
        { tags: regex },
      ];

      if (isNumeric) {
        orConditions.unshift({ number: parseInt(searchTerm, 10) });
      }

      filter.$or = orConditions;
    }

    // Sort mapping
    const sortField = params.sort || 'number';
    const isDesc = sortField.startsWith('-');
    const cleanField = isDesc ? sortField.substring(1) : sortField;
    const sortOrder: Record<string, 1 | -1> = {
      [cleanField]: isDesc ? -1 : 1,
    };

    const [total, hymns] = await Promise.all([
      HymnModel.countDocuments(filter),
      HymnModel.find(filter)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    const transformedHymns = hymns.map((hymn) => ({
      id: hymn._id.toString(),
      number: hymn.number,
      title: hymn.title,
      alternateTitle: hymn.alternateTitle,
      category: hymn.category,
      author: hymn.author,
      verses: hymn.verses,
      chorus: hymn.chorus,
      englishChorus: hymn.englishChorus,
      scripture: hymn.scripture,
      tags: hymn.tags,
      meter: hymn.meter,
      tune: hymn.tune,
      key: hymn.key,
      createdAt: hymn.createdAt,
      updatedAt: hymn.updatedAt,
    }));

    return {
      hymns: transformedHymns,
      pagination,
    };
  }

  static async getHymnById(identifier: string) {
    let hymn;

    // Check if it's a valid 24-character MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier) && identifier.length === 24) {
      hymn = await HymnModel.findById(identifier).lean();
    }

    // If not found by ObjectId and identifier is numeric, find by hymn number
    if (!hymn && /^\d+$/.test(identifier)) {
      hymn = await HymnModel.findOne({ number: parseInt(identifier, 10) }).lean();
    }

    if (!hymn) {
      throw AppError.notFound(`Hymn with ID or number '${identifier}' was not found.`);
    }

    return {
      id: hymn._id.toString(),
      number: hymn.number,
      title: hymn.title,
      alternateTitle: hymn.alternateTitle,
      category: hymn.category,
      author: hymn.author,
      verses: hymn.verses,
      chorus: hymn.chorus,
      englishChorus: hymn.englishChorus,
      scripture: hymn.scripture,
      tags: hymn.tags,
      meter: hymn.meter,
      tune: hymn.tune,
      key: hymn.key,
      createdAt: hymn.createdAt,
      updatedAt: hymn.updatedAt,
    };
  }
}
