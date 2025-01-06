// src/controllers/chat.controller.ts
import { RequestHandler } from 'express';
import { genAI } from '../server';
import { EXPENSE_TRACKER_PROMPT } from '../prompts/expense-tracker.prompt';
import { findMatchingCategory, getTransactionTypes } from '../services/transaction-type.service';
import { HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { AuthRequest, ChatRequest } from '../middlewares/auth.middleware';
import { getWallets, Wallet } from '../services/wallet.service';

export const streamChat: RequestHandler<{}, {}, ChatRequest> = async (
    req,
    res
) => {
    try {
        const { message, fundId } = req.body;
        const user = (req as AuthRequest).user;
        const token = req.headers.authorization?.split(' ')[1] || '';

        // Lấy danh sách ví và loại giao dịch
        const [wallets, transactionTypes] = await Promise.all([
            getWallets(fundId, token),
            getTransactionTypes(token, fundId)
        ]);

        if (!message) {
            res.status(400).json({ error: 'Tin nhắn không được để trống' });
            return;
        }

        if (!fundId) {
            res.status(400).json({ error: 'FundId không được để trống' });
            return;
        }

        const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash-latest',
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

        console.debug('wallets', wallets);
        // Thêm thông tin về wallets, categories và transaction types vào prompt
        const promptWithContext = `${EXPENSE_TRACKER_PROMPT}

Danh sách ví trong hệ thống:
${JSON.stringify(wallets.map(w => ({
    id: w.id,
    name: w.name
})), null, 2)}

Danh sách categories và transaction types:
${JSON.stringify(transactionTypes, null, 2)}

Hãy sử dụng CHÍNH XÁC:
1. ID và tên ví từ danh sách wallets ở trên
2. Categories từ danh sách transaction types
3. Luôn thêm accountSourceId vào mỗi transaction dựa theo walletName`;
        
        await chat.sendMessage(promptWithContext);
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();
        
        try {
            // Kiểm tra xem có phải response dạng HTML không
            if (text.includes('```html') && text.includes('```json')) {
                console.log('text', text);
                
                // Tách HTML và JSON bằng markers
                const htmlMatch = text.match(/```html(.*?)```/s);
                const jsonMatch = text.match(/```json(.*?)```/s);
                
                if (htmlMatch && jsonMatch) {
                    // Bỏ markdown wrapper và xử lý HTML content
                    const messageText = htmlMatch[1]
                        .trim()
                        .replace(/```html|```/g, '')
                        .replace(/\\"/g, '"')
                        .replace(/\\n/g, '')
                        .replace(/\n/g, '')
                        .replace(/<div class=\\"message\\">|<div class=\\"content\\">|<div class=\\"note\\">/g, '')
                        .replace(/<\/div>/g, '')
                    
                    const jsonText = jsonMatch[1].trim();
                    
                    // Parse JSON
                    const data = JSON.parse(jsonText);
                    
                    // Thêm category ID và xử lý transactions như cũ
                    if (data.transactions) {
                        for (const trans of data.transactions) {
                            const category = await findMatchingCategory(trans.description, trans.type, token as any, fundId);
                            if (category) {
                                trans.categoryId = category.id;
                                trans.categoryName = category.name;
                            }

                            // Thêm thông tin cơ bản
                            trans.fundId = fundId;
                            trans.userId = user?.userId;

                            // Tìm và thêm accountSourceId
                            if (trans.walletName) {
                                const wallet = findWallet(wallets, trans.walletName);
                                if (wallet) {
                                    trans.accountSourceId = wallet.id;
                                    trans.accountSourceName = wallet.name;
                                }
                            } else if (wallets.length > 0) {
                                // Mặc định lấy ví đầu tiên
                                trans.accountSourceId = wallets[0].id;
                                trans.accountSourceName = wallets[0].name;
                            }
                        }
                    }
                    
                    res.json({
                        message: messageText,
                        data: data
                    });
                } else {
                    // Bỏ markdown wrapper, escaped quotes và cả \n và \\n
                    const cleanText = text
                        .replace(/```html\n|\n```/g, '')
                        .replace(/\\"/g, '"')
                        .replace(/\\n/g, '')
                        .replace(/\n/g, '');
                    res.json({
                        message: cleanText,
                        data: null
                    });
                }
            } else {
                // Xử lý text thông thường
                // Bỏ tất cả markdown JSON nếu có
                const cleanText = text
                    .replace(/```json.*?```/gs, '')
                    .replace(/```html|```/g, '')
                    .trim()
                    .replace(/\\"/g, '"')
                    .replace(/\\n/g, '')
                    .replace(/\n/g, '')
                    .replace(/<div class=\\"message\\">|<div class=\\"content\\">|<div class=\\"note\\">/g, '')
                    .replace(/<\/div>/g, '')
                    .replace(/<br>/g, '\n');
                res.json({
                    message: cleanText,
                    data: null
                });
            }
        } catch (error) {
            // Nếu có lỗi parse, trả về text gốc
            const cleanText = text
                .replace(/```json.*?```/gs, '')
                .trim()
                .replace(/\\n/g, '')
                .replace(/\n/g, '');
            console.error('Parse error:', error);
            res.json({
                message: cleanText,
                data: null
            });
        }

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
};

const findWallet = (wallets: Wallet[], walletName: string) => {
    if (!walletName) return wallets[0]; // Trả về ví đầu tiên nếu không có tên ví

    const normalizedName = walletName.toLowerCase();
    const foundWallet = wallets.find(w => {
        const name = w.name.toLowerCase();
        return name === normalizedName || 
               name.includes(normalizedName) ||
               name.replace('ví ', '').includes(normalizedName);
    });

    // Nếu không tìm thấy ví, trả về ví đầu tiên
    return foundWallet || wallets[0];
};