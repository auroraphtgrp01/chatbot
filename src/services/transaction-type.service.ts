import axios from 'axios';

const API_URL = 'https://api.uniko.id.vn/api';
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmODY4OTJjNC01NjIxLTRmOTEtYmRiZi1lOWQyMzUzMWY3NWIiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImZ1bGxOYW1lIjpudWxsLCJyb2xlSWQiOiJiOGI1ZjM2ZS0xYzRmLTRmMzItYWE1Ni0zZTFjNTkyOTJkNDUiLCJzdGF0dXMiOiJBQ1RJVkUiLCJpYXQiOjE3MzU3NTE2MzgsImV4cCI6MTczNjYxNTYzOH0.Pjp7p7SVpTY-QZW_bn1W6ox-6Vth7tj9zXlSh7W4Qgk';

export interface TransactionType {
  id: string;
  name: string;
  type: 'INCOMING' | 'EXPENSE';
  description: string;
  trackerType: string;
}

export async function getTransactionTypes(): Promise<TransactionType[]> {
  try {
    const response = await axios.get(
      `${API_URL}/tracker-transaction-types/all/b376bb8d-c5ff-476d-b4f3-8f840a12c060`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching transaction types:', error);
    return [];
  }
}

export async function findMatchingCategory(description: string, type: 'EXPENSE' | 'INCOMING'): Promise<TransactionType | null> {
  const types = await getTransactionTypes();
  if (!types.length) return null;
  
  const normalizedDesc = description.toLowerCase();
  
  // Nếu là INCOMING
  if (type === 'INCOMING') {
    const incomeMaps: Record<string, string> = {
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
  const expenseMaps: Record<string, string> = {
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