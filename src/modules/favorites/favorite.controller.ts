import { Request, Response, NextFunction } from 'express';
import { FavoriteService } from './favorite.service';
import { sendCreated, sendSuccess } from '../../shared/utils/api-response';

export class FavoriteController {
  static async listFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const favorites = await FavoriteService.getUserFavorites(req.user!.id);
      sendSuccess(res, favorites);
    } catch (error) {
      next(error);
    }
  }

  static async addFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hymnId = req.params.hymnId as string;
      const result = await FavoriteService.addFavorite(req.user!.id, hymnId);
      sendCreated(res, result, 'Hymn added to favorites.');
    } catch (error) {
      next(error);
    }
  }

  static async removeFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const hymnId = req.params.hymnId as string;
      const result = await FavoriteService.removeFavorite(req.user!.id, hymnId);
      sendSuccess(res, result, 200, 'Hymn removed from favorites.');
    } catch (error) {
      next(error);
    }
  }
}
