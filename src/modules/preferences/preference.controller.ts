import { Request, Response, NextFunction } from 'express';
import { PreferenceService } from './preference.service';
import { sendSuccess } from '../../shared/utils/api-response';

export class PreferenceController {
  static async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const preferences = await PreferenceService.getPreferences(req.user!.id);
      sendSuccess(res, preferences);
    } catch (error) {
      next(error);
    }
  }

  static async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await PreferenceService.updatePreferences(req.user!.id, req.body);
      sendSuccess(res, updated, 200, 'Preferences updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}
