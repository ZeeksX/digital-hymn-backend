import { Request, Response, NextFunction } from 'express';
import { HistoryService } from './history.service';
import { sendCreated, sendSuccess } from '../../shared/utils/api-response';

export class HistoryController {
  static async listRecentlyViewed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await HistoryService.getRecentlyViewed(req.user!.id);
      sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  }

  static async recordRecentlyViewed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hymnId = req.params.hymnId as string;
      const result = await HistoryService.recordRecentlyViewed(req.user!.id, hymnId);
      sendCreated(res, result, 'Hymn recorded in recently viewed.');
    } catch (error) {
      next(error);
    }
  }
}
