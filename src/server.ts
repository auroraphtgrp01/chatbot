// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import router from './routes/chat.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Khởi tạo Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/chat', router);

app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});

export { genAI };