import express from 'express';
import { signup, login, demoSession, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/demo-session', demoSession);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
