import express from 'express';
import { login, logout, getMe, signup, updateProfileHandler, changePasswordHandler } from './auth.controller.js';
import { protect } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);

router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);
router.patch('/me', protect, updateProfileHandler);
router.patch('/me/password', protect, changePasswordHandler);

export default router;
