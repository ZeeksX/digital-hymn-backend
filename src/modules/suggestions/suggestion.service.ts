import { Types } from 'mongoose';
import { HymnSuggestionModel } from './suggestion.model';
import { HymnSuggestionInput } from './suggestion.schema';
import { normalizeEmail } from '../../shared/utils/sanitize';

export class SuggestionService {
  static async createSuggestion(input: HymnSuggestionInput, userId?: string) {
    const suggestion = await HymnSuggestionModel.create({
      title: input.title.trim(),
      author: input.author.trim(),
      category: input.category.trim(),
      lyrics: input.lyrics.trim(),
      submittedBy: input.submittedBy.trim(),
      email: normalizeEmail(input.email),
      userId: userId ? new Types.ObjectId(userId) : undefined,
      status: 'pending',
    });

    return {
      id: suggestion._id.toString(),
      title: suggestion.title,
      author: suggestion.author,
      category: suggestion.category,
      status: suggestion.status,
      submittedBy: suggestion.submittedBy,
      createdAt: suggestion.createdAt,
    };
  }
}
