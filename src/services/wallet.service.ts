import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'https://api.uniko.id.vn/api';

export interface Wallet {
    id: string;
    name: string;
    type: string;
    initAmount: number;
    accountBankId: string | null;
    currency: string;
    currentAmount: number;
    userId: string;
    fundId: string;
    participantId: string | null;
    accountBank: any | null;
}

export interface WalletResponse {
    pagination: {
        totalPage: number;
        currentPage: number;
        limit: number;
        skip: number;
    };
    data: Wallet[];
    statusCode: number;
}

export async function getWallets(fundId: string, token: string): Promise<Wallet[]> {
    try {
        const response = await axios.get<WalletResponse>(
            `${API_URL}/account-sources/advanced/${fundId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        console.warn(response.data.data);
        return response.data.data || [];
    } catch (error) {
        console.error('Error fetching wallets:', error);
        return [];
    }
}
