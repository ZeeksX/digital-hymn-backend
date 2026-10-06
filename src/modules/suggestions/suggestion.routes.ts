import { Router } from 'express';
import { SuggestionController } from './suggestion.controller';
import { validate } from '../../middleware/validate.middleware';
import { optionalAuth } from '../../middleware/auth.middleware';
import { suggestionLimiter } from '../../middleware/rate-limiter';
import { hymnSuggestionSchema } from './suggestion.schema';

const router = Router();

router.post(
  '/',
  suggestionLimiter,
  optionalAuth,
  validate({ body: hymnSuggestionSchema }),
  SuggestionController.submitSuggestion
);

export default router;
