// src/controllers/chat.controller.ts
import { RequestHandler } from 'express';
import { genAI } from '../server';
import { EXPENSE_TRACKER_PROMPT } from '../prompts/expense-tracker.prompt';
import { findMatchingCategory } from '../services/transaction-type.service';
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

        // Lấy danh sách ví
        const wallets = await getWallets(fundId, token);

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

        await chat.sendMessage(EXPENSE_TRACKER_PROMPT);
        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();
        
        try {
            // Kiểm tra xem có phải response dạng HTML không
            if (text.includes('```html') && text.includes('```json')) {
                // Tách HTML và JSON bằng markers
                const htmlMatch = text.match(/```html(.*?)```/s);
                const jsonMatch = text.match(/```json(.*?)```/s);
                
                if (htmlMatch && jsonMatch) {
                    const messageText = htmlMatch[1].trim();
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
                    res.json({
                        message: text,
                        data: null
                    });
                }
            } else {
                // Nếu không phải response có HTML/JSON
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