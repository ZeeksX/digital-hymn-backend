import { Router } from 'express';
import { FavoriteController } from './favorite.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { hymnIdParamSchema } from './favorite.schema';

const router = Router();

router.use(requireAuth);

router.get('/', FavoriteController.listFavorites);
router.post('/:hymnId', validate({ params: hymnIdParamSchema }), FavoriteController.addFavorite);
router.delete('/:hymnId', validate({ params: hymnIdParamSchema }), FavoriteController.removeFavorite);

export default router;
