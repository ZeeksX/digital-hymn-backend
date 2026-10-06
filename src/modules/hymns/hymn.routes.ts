import { Router } from 'express';
import { HymnController } from './hymn.controller';
import { validate } from '../../middleware/validate.middleware';
import { hymnQuerySchema, hymnIdParamSchema } from './hymn.schema';
import { searchLimiter } from '../../middleware/rate-limiter';

const router = Router();

router.get('/', searchLimiter, validate({ query: hymnQuerySchema }), HymnController.listHymns);
router.get('/:id', validate({ params: hymnIdParamSchema }), HymnController.getHymnById);

export default router;
