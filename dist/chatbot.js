"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// chatbot.ts
const generative_ai_1 = require("@google/generative-ai");
const dotenv = __importStar(require("dotenv"));
const readline = __importStar(require("readline"));
// Load environment variables
dotenv.config();
class ChatBot {
    constructor() {
        // Kiểm tra API key
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error('GOOGLE_API_KEY không được tìm thấy trong file .env');
        }
        // Khởi tạo Google AI
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        this.chat = this.model.startChat();
        // Khởi tạo readline interface
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    async start() {
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
            }
            catch (error) {
                console.error('Bot: Xin lỗi, có lỗi xảy ra:', error);
            }
        }
    }
    askQuestion(question) {
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
    }
    catch (error) {
        console.error('Lỗi khởi tạo chatbot:', error);
    }
}
main();
