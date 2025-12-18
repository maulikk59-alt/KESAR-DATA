import { InwardEntry, ProductionEntry, StockState, User, UserRole, AuditLog, FinishedStockState, SalesEntry, InventoryLedgerItem, ProductType, InventoryAdjustment } from '../types';

const KEYS = {
  USERS: 'gn_users',
  LOGS: 'gn_audit_logs',
  INWARD: 'gn_inward',
  PRODUCTION: 'gn_production',
  STOCK: 'gn_stock',
  FINISHED_STOCK: 'gn_finished_stock',
  SALES: 'gn_sales',
  LEDGER: 'gn_inventory_ledger',
  ADJUSTMENTS: 'gn_adjustments',
  SESSION: 'gn_session'
};

const hashPassword = (pwd: string) => `HASH_${btoa(pwd)}`;

export const StorageService = {
  
  // --- Initialization ---
  isSystemInitialized: (): boolean => {
    return !!localStorage.getItem(KEYS.USERS);
  },

  initializeSystem: (ownerDetails: { name: string, loginId: string, password: string }) => {
    if (StorageService.isSystemInitialized()) throw new Error("System already initialized");
    
    const owner: User = {
      id: crypto.randomUUID(),
      loginId: ownerDetails.loginId.toLowerCase(),
      displayName: ownerDetails.name,
      role: UserRole.OWNER,
      passwordHash: hashPassword(ownerDetails.password),
      isFirstLogin: false,
      isDisabled: false,
      createdAt: Date.now()
    };
    
    localStorage.setItem(KEYS.USERS, JSON.stringify([owner]));
    StorageService.logAudit(owner.id, owner.displayName, 'CREATE_USER', 'System Initialized');
    
    localStorage.setItem(KEYS.STOCK, JSON.stringify({ currentGroundnutStock: 0, lastUpdated: Date.now() }));
    localStorage.setItem(KEYS.FINISHED_STOCK, JSON.stringify({ oilStockKg: 0, cakeStockKg: 0, lastUpdated: Date.now() }));

    return owner;
  },

  // --- Auth ---
  login: (loginId: string, password: string): User => {
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const user = users.find((u: User) => u.loginId === loginId.toLowerCase());

    if (!user) throw new Error("User not found");
    if (user.isDisabled) throw new Error("Account disabled");
    if (user.passwordHash !== hashPassword(password)) throw new Error("Invalid credentials");

    localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
    StorageService.logAudit(user.id, user.displayName, 'LOGIN', 'Successful Login');
    return user;
  },

  logout: () => {
    const u = StorageService.getCurrentUser();
    if (u) StorageService.logAudit(u.id, u.displayName, 'LOGOUT', 'User logged out');
    localStorage.removeItem(KEYS.SESSION);
  },

  getCurrentUser: (): User | null => {
    const s = localStorage.getItem(KEYS.SESSION);
    return s ? JSON.parse(s) : null;
  },

  findUserByLoginId: (loginId: string): User | null => {
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    return users.find((u: User) => u.loginId === loginId.toLowerCase()) || null;
  },

  updatePassword: (userId: string, newPass: string) => {
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const idx = users.findIndex((u: User) => u.id === userId);
    if (idx === -1) throw new Error("User not found");

    users[idx].passwordHash = hashPassword(newPass);
    users[idx].isFirstLogin = false;
    
    // Save updated user to master list
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));

    // Update active session if the current user is the one being updated
    const sessionUser = StorageService.getCurrentUser();
    if (sessionUser && sessionUser.id === userId) {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(users[idx]));
    }
  },
  
  changePassword: (userId: string, oldPass: string, newPass: string) => {
    const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    const idx = users.findIndex((u: User) => u.id === userId);
    if (idx === -1) throw new Error("User not found");

    const user = users[idx];
    if (user.passwordHash !== hashPassword(oldPass)) {
      throw new Error("Incorrect current password.");
    }
    if (newPass.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }

    users[idx].passwordHash = hashPassword(newPass);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    StorageService.logAudit(user.id, user.displayName, 'PASSWORD_CHANGE', 'User changed their own password.');
  },

  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  },

  createSupervisor: (actor: User, details: { name: string, loginId: string, employeeCode?: string, email?: string, phone?: string }) => {
    if (actor.role !== UserRole.OWNER) throw new Error("Access Denied");
    const users = StorageService.getUsers();
    
    if (!details.name || !details.loginId) throw new Error("Name and Login ID are required.");
    if (users.find(u => u.loginId === details.loginId.toLowerCase())) throw new Error("Login ID already exists. Please choose a unique one.");

    const tempPassword = Math.random().toString(36).slice(-8);
    const newUser: User = {
      id: crypto.randomUUID(),
      loginId: details.loginId.toLowerCase(),
      displayName: details.name,
      employeeCode: details.employeeCode,
      email: details.email,
      phone: details.phone,
      role: UserRole.SUPERVISOR,
      passwordHash: hashPassword(tempPassword),
      isFirstLogin: true,
      isDisabled: false,
      createdAt: Date.now()
    };

    users.push(newUser);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
    StorageService.logAudit(actor.id, actor.displayName, 'CREATE_USER', `Created supervisor ${newUser.loginId}`);
    return tempPassword;
  },

  toggleUserStatus: (actor: User, targetUserId: string) => {
    if (actor.role !== UserRole.OWNER) throw new Error("Access Denied");
    const users = StorageService.getUsers();
    const idx = users.findIndex(u => u.id === targetUserId);
    if (idx !== -1 && users[idx].role !== UserRole.OWNER) {
      users[idx].isDisabled = !users[idx].isDisabled;
      localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      StorageService.logAudit(actor.id, actor.displayName, 'DISABLE_USER', `Toggled ${users[idx].loginId}`);
    }
  },

  // --- Inventory & Ledger Internals (Simulated Atomic Transaction) ---
  
  _getFinishedStock: (): FinishedStockState => {
    const s = localStorage.getItem(KEYS.FINISHED_STOCK);
    return s ? JSON.parse(s) : { oilStockKg: 0, cakeStockKg: 0, lastUpdated: Date.now() };
  },

  _commitStockChange: (product: ProductType, delta: number, refId: string, type: InventoryLedgerItem['changeType'], user: User) => {
    // 1. Read Current State
    const s = StorageService._getFinishedStock();
    
    // 2. Calculate New State
    let newOil = s.oilStockKg;
    let newCake = s.cakeStockKg;
    let balanceAfter = 0;

    if (product === 'oil') {
      newOil += delta;
      balanceAfter = Number(newOil.toFixed(2));
      s.oilStockKg = balanceAfter;
    } else {
      newCake += delta;
      balanceAfter = Number(newCake.toFixed(2));
      s.cakeStockKg = balanceAfter;
    }
    s.lastUpdated = Date.now();

    // 3. Validation
    if (balanceAfter < 0) throw new Error(`Transaction Failed: Insufficient ${product} stock. Result would be negative.`);

    // 4. Create Ledger Entry
    const ledgerEntry: InventoryLedgerItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      dateStr: new Date().toISOString(),
      productType: product,
      changeType: type,
      referenceId: refId,
      quantityChange: delta,
      balanceAfter: balanceAfter,
      performedBy: user.displayName
    };

    // 5. Commit Writes (Simulating Atomicity)
    localStorage.setItem(KEYS.FINISHED_STOCK, JSON.stringify(s));
    
    const ledger = JSON.parse(localStorage.getItem(KEYS.LEDGER) || '[]');
    ledger.unshift(ledgerEntry);
    localStorage.setItem(KEYS.LEDGER, JSON.stringify(ledger));

    return s;
  },

  // --- Exposed Inventory Methods ---

  getFinishedStock: () => StorageService._getFinishedStock(),
  
  getLedger: (): InventoryLedgerItem[] => {
    return JSON.parse(localStorage.getItem(KEYS.LEDGER) || '[]');
  },

  // --- Production (Impacts Inventory) ---

  addProduction: (user: User, entry: any) => {
    const rawStock = StorageService.getStock();
    if (entry.groundnutConsumed > rawStock) throw new Error(`Insufficient Raw Stock. Available: ${rawStock}`);

    const now = new Date();
    const newEntry: ProductionEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: now.getTime(),
      dateStr: now.toISOString().split('T')[0],
      openingStock: rawStock,
      isVoided: false,
      enteredBy: user.displayName,
      enteredById: user.id
    };

    try {
      localStorage.setItem(KEYS.STOCK, JSON.stringify({ currentGroundnutStock: rawStock - entry.groundnutConsumed, lastUpdated: now.getTime() }));
      StorageService._commitStockChange('oil', entry.oilProduced, newEntry.id, 'production', user);
      StorageService._commitStockChange('cake', entry.cakeProduced, newEntry.id, 'production', user);
      
      const logs = JSON.parse(localStorage.getItem(KEYS.PRODUCTION) || '[]');
      logs.push(newEntry);
      localStorage.setItem(KEYS.PRODUCTION, JSON.stringify(logs));
      
      StorageService.logAudit(user.id, user.displayName, 'ENTRY_CREATE', `Production: ${entry.oilProduced}kg Oil, ${entry.cakeProduced}kg Cake`);
      return newEntry;

    } catch (e) {
      console.error("Transaction failed", e);
      throw e;
    }
  },

  getProductionLogs: (): ProductionEntry[] => {
    return JSON.parse(localStorage.getItem(KEYS.PRODUCTION) || '[]');
  },

  // --- Sales (Impacts Inventory) ---

  createSale: (user: User, saleData: Omit<SalesEntry, 'id' | 'timestamp' | 'dateStr' | 'status' | 'enteredBy' | 'enteredById'>) => {
    const now = new Date();
    const newSale: SalesEntry = {
      ...saleData,
      id: crypto.randomUUID(),
      timestamp: now.getTime(),
      dateStr: now.toISOString().split('T')[0],
      status: 'confirmed',
      enteredBy: user.displayName,
      enteredById: user.id,
      salesmanName: saleData.salesmanName || user.displayName,
      salesmanId: saleData.salesmanId || user.id,
    };

    StorageService._commitStockChange(saleData.productType, -saleData.quantity, newSale.id, 'sale', user);

    const sales = JSON.parse(localStorage.getItem(KEYS.SALES) || '[]');
    sales.push(newSale);
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));

    StorageService.logAudit(user.id, user.displayName, 'SALE_CREATE', `Sold ${saleData.quantity}kg ${saleData.productType}`);
    return newSale;
  },

  getSales: (actor: User): SalesEntry[] => {
    let sales = JSON.parse(localStorage.getItem(KEYS.SALES) || '[]');
    if (actor.role === UserRole.SUPERVISOR) {
      sales = sales.filter((s: SalesEntry) => s.enteredById === actor.id);
      return sales.map(({ ratePerUnit, totalValue, ...rest }: any) => rest);
    }
    return sales;
  },
  
  cancelSale: (actor: User, saleId: string, reason: string) => {
    if (actor.role !== UserRole.OWNER) throw new Error("Only owners can cancel sales.");
    
    const sales: SalesEntry[] = JSON.parse(localStorage.getItem(KEYS.SALES) || '[]');
    const saleIndex = sales.findIndex(s => s.id === saleId);
    
    if (saleIndex === -1) throw new Error("Sale not found.");
    
    const sale = sales[saleIndex];
    if (sale.status === 'cancelled') throw new Error("Sale is already cancelled.");

    StorageService._commitStockChange(sale.productType, sale.quantity, sale.id, 'cancellation', actor);

    sale.status = 'cancelled';
    sale.cancellationReason = reason;
    sales[saleIndex] = sale;
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));

    StorageService.logAudit(actor.id, actor.displayName, 'SALE_CANCEL', `Cancelled sale ${sale.id}. Reason: ${reason}`);
  },

  // --- Adjustment Workflow ---

  getAdjustments: (): InventoryAdjustment[] => {
    return JSON.parse(localStorage.getItem(KEYS.ADJUSTMENTS) || '[]');
  },

  requestAdjustment: (user: User, productType: ProductType, quantity: number, reason: string) => {
    const adj: InventoryAdjustment = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      productType,
      requestedChange: quantity,
      reason,
      requestedBy: user.displayName,
      requestedById: user.id,
      status: 'PENDING'
    };

    const list = StorageService.getAdjustments();
    list.unshift(adj); // Newest top
    localStorage.setItem(KEYS.ADJUSTMENTS, JSON.stringify(list));
    StorageService.logAudit(user.id, user.displayName, 'ADJUSTMENT_REQUEST', `Requested ${quantity}kg on ${productType}`);
  },

  approveAdjustment: (approver: User, adjustmentId: string) => {
    if (approver.role !== UserRole.OWNER) throw new Error("Only Owner can approve adjustments");

    const list = StorageService.getAdjustments();
    const idx = list.findIndex(a => a.id === adjustmentId);
    if (idx === -1) throw new Error("Adjustment not found");
    const adj = list[idx];

    if (adj.status !== 'PENDING') throw new Error("Adjustment already processed");

    StorageService._commitStockChange(adj.productType, adj.requestedChange, adj.id, 'adjustment', approver);

    adj.status = 'APPROVED';
    adj.actionedBy = approver.displayName;
    adj.actionedAt = Date.now();
    localStorage.setItem(KEYS.ADJUSTMENTS, JSON.stringify(list));

    StorageService.logAudit(approver.id, approver.displayName, 'ADJUSTMENT_ACTION', `Approved adjustment ${adj.id}`);
  },

  rejectAdjustment: (approver: User, adjustmentId: string) => {
    if (approver.role !== UserRole.OWNER) throw new Error("Only Owner can reject adjustments");

    const list = StorageService.getAdjustments();
    const idx = list.findIndex(a => a.id === adjustmentId);
    if (idx === -1) throw new Error("Adjustment not found");
    
    list[idx].status = 'REJECTED';
    list[idx].actionedBy = approver.displayName;
    list[idx].actionedAt = Date.now();
    localStorage.setItem(KEYS.ADJUSTMENTS, JSON.stringify(list));

    StorageService.logAudit(approver.id, approver.displayName, 'ADJUSTMENT_ACTION', `Rejected adjustment ${list[idx].id}`);
  },

  // --- Other Methods ---

  logAudit: (actorId: string, actorName: string, action: AuditLog['action'], details: string) => {
    const logs = JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      dateStr: new Date().toISOString(),
      action,
      actorId,
      actorName,
      details
    };
    logs.unshift(newLog);
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  },

  getAuditLogs: (): AuditLog[] => {
    return JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
  },

  getStock: (): number => {
    const s = localStorage.getItem(KEYS.STOCK);
    return s ? JSON.parse(s).currentGroundnutStock : 0;
  },

  addInward: (user: User, entry: any) => {
    const now = new Date();
    const newEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: now.getTime(),
      dateStr: now.toISOString().split('T')[0],
      timeStr: now.toLocaleTimeString(),
      enteredBy: user.displayName,
      enteredById: user.id
    };
    const logs = JSON.parse(localStorage.getItem(KEYS.INWARD) || '[]');
    logs.push(newEntry);
    localStorage.setItem(KEYS.INWARD, JSON.stringify(logs));
    
    const stock = StorageService.getStock();
    localStorage.setItem(KEYS.STOCK, JSON.stringify({ currentGroundnutStock: stock + entry.weightKg, lastUpdated: now.getTime() }));
    StorageService.logAudit(user.id, user.displayName, 'ENTRY_CREATE', `Inward: ${entry.weightKg}kg`);
  },
  
  getInwardLogs: () => JSON.parse(localStorage.getItem(KEYS.INWARD) || '[]'),

  getDashboardStats: (user: User) => {
    let logs = StorageService.getProductionLogs().filter(l => !l.isVoided);
    const inward = StorageService.getInwardLogs();
    const finishedStock = StorageService._getFinishedStock();
    const sales = StorageService.getSales(user);

    if (user.role === UserRole.SUPERVISOR) {
      logs = logs.filter(l => l.enteredById === user.id);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todaysLogs = logs.filter(l => l.dateStr === todayStr);

    const todayStats = todaysLogs.reduce((acc, log) => ({
      consumed: acc.consumed + log.groundnutConsumed,
      oil: acc.oil + log.oilProduced,
      cake: acc.cake + log.cakeProduced,
      runtime: acc.runtime + log.runtimeMinutes,
    }), { consumed: 0, oil: 0, cake: 0, runtime: 0 });

    const avgYield = todaysLogs.length > 0 ? todaysLogs.reduce((acc, l) => acc + l.oilYieldPercent, 0) / todaysLogs.length : 0;
    const avgLoss = todaysLogs.length > 0 ? todaysLogs.reduce((acc, l) => acc + l.processLossPercent, 0) / todaysLogs.length : 0;
    const oilPerHour = todayStats.runtime > 0 ? (todayStats.oil / todayStats.runtime) * 60 : 0;

    return {
      today: { ...todayStats, avgYield, avgLoss, oilPerHour },
      history: logs,
      inwardHistory: inward,
      finishedStock,
      salesHistory: sales,
    };
  }
};