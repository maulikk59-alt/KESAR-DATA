export enum UserRole {
  OWNER = 'OWNER',
  SUPERVISOR = 'SUPERVISOR'
}

export type Language = 'en' | 'hi' | 'gu';

export interface User {
  id: string;
  loginId: string;
  displayName: string;
  role: UserRole;
  passwordHash: string;
  employeeCode?: string;
  email?: string;
  phone?: string;
  isFirstLogin: boolean;
  isDisabled: boolean;
  createdAt: number;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  dateStr: string;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE_USER' | 'DISABLE_USER' | 'RESET_PASSWORD' | 'PASSWORD_CHANGE' | 'ENTRY_CREATE' | 'ENTRY_VOID' | 'SALE_CREATE' | 'SALE_CANCEL' | 'ADJUSTMENT_REQUEST' | 'ADJUSTMENT_ACTION';
  actorId: string;
  actorName: string;
  details: string;
}

export interface InwardEntry {
  id: string;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  supplier: string;
  vehicleNo: string;
  weightKg: number;
  enteredBy: string;
  enteredById: string;
}

export interface StockState {
  currentGroundnutStock: number;
  lastUpdated: number;
}

export interface ProductionEntry {
  id: string;
  timestamp: number;
  dateStr: string;
  shift: 'Day' | 'Night';
  lineId: string;
  supervisorName: string;
  helperName?: string;
  startTime: string;
  endTime: string;
  breakdownMinutes: number;
  breakdownReason: string;
  openingStock: number;
  groundnutConsumed: number;
  oilProduced: number; // Changed to Kg contextually, field name remains same
  cakeProduced: number;
  runtimeMinutes: number;
  oilYieldPercent: number;
  cakeYieldPercent: number;
  totalAccountedPercent: number;
  processLossPercent: number;
  oilPerHour: number;
  isVoided: boolean;
  enteredBy: string;
  enteredById: string;
}

export type ProductType = 'oil' | 'cake';
export type BuyerType = 'retailer' | 'wholesaler' | 'factory' | 'other';
export type SaleStatus = 'draft' | 'confirmed' | 'cancelled';

export interface FinishedStockState {
  oilStockKg: number; // Changed from Liters to Kg
  cakeStockKg: number;
  lastUpdated: number;
}

export interface SalesEntry {
  id: string;
  timestamp: number;
  dateStr: string;
  productType: ProductType;
  quantity: number; // Kg for both now
  buyerName: string;
  buyerType: BuyerType;
  vehicleNo?: string;
  ratePerUnit?: number; 
  totalValue?: number;
  status: SaleStatus;
  enteredBy: string;
  enteredById: string;
  salesmanName?: string;
  salesmanId?: string;
  cancellationReason?: string;
}

export interface InventoryLedgerItem {
  id: string;
  timestamp: number;
  dateStr: string;
  productType: ProductType;
  changeType: 'production' | 'sale' | 'adjustment' | 'cancellation';
  referenceId: string;
  quantityChange: number;
  balanceAfter: number;
  performedBy: string;
}

export interface InventoryAdjustment {
  id: string;
  timestamp: number;
  productType: ProductType;
  requestedChange: number; // +/- amount
  reason: string;
  requestedBy: string;
  requestedById: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  actionedBy?: string;
  actionedAt?: number;
}

export const THRESHOLDS = {
  MIN_OIL_YIELD: 38.0,
  MAX_PROCESS_LOSS: 7.0,
  MAX_BREAKDOWN_MINS: 45,
  MIN_RUNTIME_MINS: 300,
};