export interface ActiveOrderSummary {
  orderId: number;
  groupName: string;
  numberOfPeople: number;
  totalAmount: number;
  totalItems: number;
  createdAt: string;
}

export interface TableData {
  id: number;
  tableNumber: number;
  tableType: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'WAITING_FOR_BILL';
  reservedBy?: string;
  occupiedSince?: string;
  activeOrderId?: number;
  totalAmount?: number;
  totalItems?: number;
  orderCreatedAt?: string;
  groupCount?: number;
  activeOrders?: ActiveOrderSummary[];
}

export interface MenuItemType {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  available: boolean;
  imageEmoji: string;
}

export interface OrderItemType {
  id: number;
  itemName: string;
  category: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED';
  orderedAt: string;
}

export interface OrderType {
  id: number;
  tableNumber: number;
  tableType: string;
  tableId: number;
  groupName: string;
  numberOfPeople: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  waiterName?: string;
  createdAt: string;
  completedAt?: string;
  totalAmount: number;
  totalItems: number;
  items: OrderItemType[];
}

export interface KitchenOrder {
  orderId: number;
  tableNumber: number;
  tableType: string;
  groupName?: string;
  waiterName?: string;
  createdAt: string;
  items: KitchenItem[];
}

export interface KitchenItem {
  id: number;
  itemName: string;
  category: string;
  quantity: number;
  specialInstructions?: string;
  status: 'NEW' | 'PREPARING' | 'READY';
  orderedAt: string;
}

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  specialInstructions: string;
  emoji: string;
}

export interface RestaurantConfigType {
  id: number;
  restaurantName: string;
  subtitle: string;
  logoEmoji: string;
  ownerName: string;
  address: string;
  city: string;
  phone: string;
  gstin: string;
  currencySymbol: string;
  tax1Rate: number;
  tax1Label: string;
  tax2Rate: number;
  tax2Label: string;
  thankYouMessage: string;
  receiptFooter: string;
  setupComplete: boolean;
}

export interface CategoryType {
  id: number;
  name: string;
  emoji: string;
  displayOrder: number;
}

export interface TableTypeConfig {
  id: number;
  name: string;
  labelPrefix: string;
  defaultCapacity: number;
}

export interface AuthUser {
  token: string;
  username: string;
  role: 'ADMIN' | 'STAFF';
  displayName: string;
  restaurantId: number;
}
