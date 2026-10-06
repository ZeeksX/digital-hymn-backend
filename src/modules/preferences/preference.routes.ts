import { Router } from 'express';
import { PreferenceController } from './preference.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { updatePreferencesSchema } from './preference.schema';

const router = Router();

router.use(requireAuth);

router.get('/', PreferenceController.getPreferences);
router.patch('/', validate({ body: updatePreferencesSchema }), PreferenceController.updatePreferences);

export default router;
