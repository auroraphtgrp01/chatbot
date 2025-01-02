// src/routes/chat.routes.ts
import { Router } from 'express';
import { streamChat } from '../controllers/chat.controller';

const router = Router();

router.post('/stream', streamChat);

export { router as ChatRouter };