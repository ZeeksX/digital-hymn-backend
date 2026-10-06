import { Router } from 'express';
import { CategoryController } from './category.controller';
import { validate } from '../../middleware/validate.middleware';
import { categorySlugParamSchema, categoryHymnsQuerySchema } from './category.schema';

const router = Router();

router.get('/', CategoryController.listCategories);
router.get(
  '/:slug/hymns',
  validate({ params: categorySlugParamSchema, query: categoryHymnsQuerySchema }),
  CategoryController.getCategoryHymns
);

export default router;
