import * as types from './types'

export interface Order {
    id: number;
    userId: number;
    item: types.Item;
    originalQuantity: number;
    remainingQuantity: number;
    pricePerItem: number;
    orderType: 'buy' | 'sell';
    status: 'open' | 'completed' | 'canceled';
    createdAt: Date;
    matchedAt?: Date;
}

