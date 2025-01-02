import axios from 'axios';

const API_URL = 'https://api.uniko.id.vn/api';

export interface TransactionType {
  id: string;
  name: string;
  type: 'INCOMING' | 'EXPENSE';
  description: string;
  trackerType: string;
}

export async function getTransactionTypes(
    token: string,
    fundId: string
): Promise<TransactionType[]> {
  try {
    const response = await axios.get(
      `${API_URL}/tracker-transaction-types/all/${fundId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching transaction types:', error);
    return [];
  }
}

export async function findMatchingCategory(description: string, type: 'EXPENSE' | 'INCOMING', token: string,
    fundId: string): Promise<TransactionType | null> {
  const types = await getTransactionTypes(token, fundId);
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