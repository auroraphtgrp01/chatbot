import express from 'express';
import { streamChat } from '../controllers/chat.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/', verifyToken, streamChat);

export default router; 