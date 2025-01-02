"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactionTypes = getTransactionTypes;
exports.findMatchingCategory = findMatchingCategory;
const axios_1 = __importDefault(require("axios"));
const API_URL = 'https://api.uniko.id.vn/api';
async function getTransactionTypes(token, fundId) {
    try {
        const response = await axios_1.default.get(`${API_URL}/tracker-transaction-types/all/${fundId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data?.data || [];
    }
    catch (error) {
        console.error('Error fetching transaction types:', error);
        return [];
    }
}
async function findMatchingCategory(description, type, token, fundId) {
    const types = await getTransactionTypes(token, fundId);
    if (!types.length)
        return null;
    const normalizedDesc = description.toLowerCase();
    // Nếu là INCOMING
    if (type === 'INCOMING') {
        const incomeMaps = {
            'lương': '💼',
            'thưởng': '🎉',
            'làm thêm': '⏰',
            'phụ cấp': '🏢',
            'bán': '🏠',
            'quỹ': '💸'
        };
        for (const [keyword, emoji] of Object.entries(incomeMaps)) {
            if (normalizedDesc.includes(keyword)) {
                return types.find(t => t.name.includes(emoji) && t.type === 'INCOMING') || null;
            }
        }
        // Mặc định là lương nếu không match được
        return types.find(t => t.name.includes('💼') && t.type === 'INCOMING') || null;
    }
    // Nếu là EXPENSE
    const expenseMaps = {
        'ăn': '🍲',
        'đồ ăn': '🍲',
        'cafe': '🍲',
        'cà phê': '🍲',
        'quà': '💖',
        'shopping': '🛍️',
        'mua sắm': '🛍️',
        'xe': '🚕',
        'grab': '🚕',
        'taxi': '🚕',
        'tiền nhà': '🏠',
        'điện': '💡',
        'nước': '🚰',
        'internet': '📱',
        'điện thoại': '📱',
        'giải trí': '🎬',
        'xem phim': '🎬',
        'du lịch': '🎬',
        'sức khỏe': '💊',
        'thuốc': '💊',
        'học': '📚',
        'sách': '📚',
        'xăng': '⛽',
        'người yêu': '💖',
        'hẹn hò': '💖'
    };
    for (const [keyword, emoji] of Object.entries(expenseMaps)) {
        if (normalizedDesc.includes(keyword)) {
            return types.find(t => t.name.includes(emoji) && t.type === 'EXPENSE') || null;
        }
    }
    return null;
}
