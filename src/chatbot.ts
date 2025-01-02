// chatbot.ts
import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

// Load environment variables
dotenv.config();

// Định nghĩa interfaces
interface ChatMessage {
    role: 'user' | 'bot';
    content: string;
}

class ChatBot {
    private model: GenerativeModel;
    private chat: ChatSession;
    private rl: readline.Interface;

    constructor() {
        // Kiểm tra API key
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_API_KEY không được tìm thấy trong file .env');
        }

        // Khởi tạo Google AI
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        this.chat = this.model.startChat();

        // Khởi tạo readline interface
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    public async start(): Promise<void> {
        console.log('Bot: Xin chào! Tôi là chatbot. Gõ "tạm biệt" để kết thúc.');

        while (true) {
            const userInput = await this.askQuestion('Bạn: ');

            if (userInput.toLowerCase() === 'tạm biệt') {
                console.log('Bot: Tạm biệt! Hẹn gặp lại!');
                this.rl.close();
                break;
            }

            try {
                const result = await this.chat.sendMessage(userInput);
                const response = await result.response;
                console.log('Bot:', response.text());
            } catch (error) {
                console.error('Bot: Xin lỗi, có lỗi xảy ra:', error);
            }
        }
    }

    private askQuestion(question: string): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }
}

// Khởi chạy chatbot
async function main() {
    try {
        const chatbot = new ChatBot();
        await chatbot.start();
    } catch (error) {
        console.error('Lỗi khởi tạo chatbot:', error);
    }
}

main();