import { Request, Response, NextFunction } from 'express';
import { SuggestionService } from './suggestion.service';
import { sendCreated } from '../../shared/utils/api-response';

export class SuggestionController {
  static async submitSuggestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const result = await SuggestionService.createSuggestion(req.body, userId);
      sendCreated(res, result, 'Hymn suggestion submitted successfully. Thank you for your contribution!');
    } catch (error) {
      next(error);
    }
  }
}
