import { Router } from 'express';
import { HistoryController } from './history.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { hymnIdParamSchema } from './history.schema';

const router = Router();

router.use(requireAuth);

router.get('/', HistoryController.listRecentlyViewed);
router.post('/:hymnId', validate({ params: hymnIdParamSchema }), HistoryController.recordRecentlyViewed);

export default router;
