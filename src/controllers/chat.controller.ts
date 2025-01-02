// src/controllers/chat.controller.ts
import { RequestHandler } from 'express';
import { genAI } from '../server';
import { EXPENSE_TRACKER_PROMPT } from '../prompts/expense-tracker.prompt';
import { findMatchingCategory } from '../services/transaction-type.service';
import { HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

export const streamChat: RequestHandler<{}, {}, { message: string }> = async (
    req,
    res
) => {
    try {
        const { message } = req.body;

        if (!message) {
            res.status(400).json({ error: 'Tin nhắn không được để trống' });
            return;
        }

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-pro',
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE
                }
            ]
        });

        const chat = model.startChat({
            history: [],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 1000,
            }
        });

        await chat.sendMessage(EXPENSE_TRACKER_PROMPT);
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();
        
        try {
            // Tách message và JSON
            const parts = text.split('\n\n');
            const messageText = parts[0];
            const jsonText = parts[parts.length - 1];
            
            // Kiểm tra xem phần cuối có phải JSON không
            if (jsonText.trim().startsWith('{')) {
                // Parse phần JSON
                const data = JSON.parse(jsonText);
                
                // Thêm category ID cho mỗi transaction
                if (data.transactions) {
                    for (const trans of data.transactions) {
                        const category = await findMatchingCategory(trans.description, trans.type);
                        if (category) {
                            trans.categoryId = category.id;
                            trans.categoryName = category.name;
                        }
                    }
                }
                
                res.json({
                    message: messageText,
                    data: data
                });
            } else {
                // Nếu không có JSON, trả về toàn bộ text là message
                res.json({
                    message: text,
                    data: null
                });
            }

        } catch (error) {
            console.error('Parse error:', error);
            res.json({
                message: text,
                data: null
            });
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
};