import { Types } from 'mongoose';
import { UserPreferenceModel } from './preference.model';
import { UpdatePreferencesInput } from './preference.schema';

export class PreferenceService {
  static async getPreferences(userId: string) {
    let preferences = await UserPreferenceModel.findOne({ userId: new Types.ObjectId(userId) });

    if (!preferences) {
      preferences = await UserPreferenceModel.create({
        userId: new Types.ObjectId(userId),
        theme: 'system',
        defaultTextSize: 'md',
        rememberRecentlyViewed: true,
        keepScreenAwake: false,
        serifLyrics: false,
        showVerseNumbers: true,
      });
    }

    return preferences.toJSON();
  }

  static async updatePreferences(userId: string, patch: UpdatePreferencesInput) {
    const preferences = await UserPreferenceModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: patch },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return preferences.toJSON();
  }
}
