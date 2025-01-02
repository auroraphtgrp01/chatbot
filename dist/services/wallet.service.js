"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWallets = getWallets;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const API_URL = process.env.API_URL || 'https://api.uniko.id.vn/api';
async function getWallets(fundId, token) {
    try {
        const response = await axios_1.default.get(`${API_URL}/account-sources/advanced/${fundId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.warn(response.data.data);
        return response.data.data || [];
    }
    catch (error) {
        console.error('Error fetching wallets:', error);
        return [];
    }
}
