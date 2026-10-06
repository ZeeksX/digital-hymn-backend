import { Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { sendPaginated, sendSuccess } from '../../shared/utils/api-response';

export class CategoryController {
  static async listCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CategoryService.getCategories();
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  }

  static async getCategoryHymns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slug = req.params.slug as string;
      const { page, limit, sort } = req.query as any;
      const result = await CategoryService.getCategoryHymns(slug, { page, limit, sort });
      sendPaginated(res, result.hymns, result.pagination);
    } catch (error) {
      next(error);
    }
  }
}
