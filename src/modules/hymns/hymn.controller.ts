import { Request, Response, NextFunction } from 'express';
import { HymnService } from './hymn.service';
import { sendPaginated, sendSuccess } from '../../shared/utils/api-response';

export class HymnController {
  static async listHymns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await HymnService.getHymns(req.query as any);
      sendPaginated(res, result.hymns, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  static async getHymnById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const hymn = await HymnService.getHymnById(id);
      sendSuccess(res, hymn);
    } catch (error) {
      next(error);
    }
  }
}
