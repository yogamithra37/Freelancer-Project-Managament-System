import express from 'express';
import { getProfile, updateProfile, changePassword, updateSettings } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.put('/settings', updateSettings);

export default router;
