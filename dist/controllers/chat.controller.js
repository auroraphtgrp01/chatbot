"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamChat = void 0;
const server_1 = require("../server");
const expense_tracker_prompt_1 = require("../prompts/expense-tracker.prompt");
const transaction_type_service_1 = require("../services/transaction-type.service");
const generative_ai_1 = require("@google/generative-ai");
const wallet_service_1 = require("../services/wallet.service");
const streamChat = async (req, res) => {
    try {
        const { message, fundId } = req.body;
        const user = req.user;
        const token = req.headers.authorization?.split(' ')[1] || '';
        // Lấy danh sách ví
        const wallets = await (0, wallet_service_1.getWallets)(fundId, token);
        if (!message) {
            res.status(400).json({ error: 'Tin nhắn không được để trống' });
            return;
        }
        if (!fundId) {
            res.status(400).json({ error: 'FundId không được để trống' });
            return;
        }
        const model = server_1.genAI.getGenerativeModel({
            model: 'gemini-1.5-flash-latest',
            safetySettings: [
                {
                    category: generative_ai_1.HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE
                },
                {
                    category: generative_ai_1.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE
                },
                {
                    category: generative_ai_1.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE
                },
                {
                    category: generative_ai_1.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: generative_ai_1.HarmBlockThreshold.BLOCK_NONE
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
        await chat.sendMessage(expense_tracker_prompt_1.EXPENSE_TRACKER_PROMPT);
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
                            const category = await (0, transaction_type_service_1.findMatchingCategory)(trans.description, trans.type, token, fundId);
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
                            }
                            else if (wallets.length > 0) {
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
                }
                else {
                    res.json({
                        message: text,
                        data: null
                    });
                }
            }
            else {
                // Nếu không phải response có HTML/JSON
                res.json({
                    message: text,
                    data: null
                });
            }
        }
        catch (error) {
            console.error('Parse error:', error);
            res.json({
                message: text,
                data: null
            });
        }
    }
    catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
};
exports.streamChat = streamChat;
const findWallet = (wallets, walletName) => {
    if (!walletName)
        return wallets[0]; // Trả về ví đầu tiên nếu không có tên ví
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
