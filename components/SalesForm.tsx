import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User, FinishedStockState, ProductType, BuyerType, UserRole } from '../types';
import { CheckCircle, AlertTriangle, Droplet, Layers, Coins, User as UserIcon } from 'lucide-react';

interface SalesFormProps {
  currentUser: User;
  onComplete: () => void;
}

const inputStyles = "w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition";
const disabledInputStyles = "w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 font-bold";

export const SalesForm: React.FC<SalesFormProps> = ({ currentUser, onComplete }) => {
  const [stock, setStock] = useState<FinishedStockState | null>(null);
  const [salesmen, setSalesmen] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    productType: 'oil' as ProductType,
    quantity: '' as any,
    buyerName: '',
    buyerType: 'retailer' as BuyerType,
    vehicleNo: '',
    ratePerUnit: '' as any,
    salesmanId: currentUser.id,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStock(StorageService.getFinishedStock());
    if (currentUser.role === UserRole.OWNER) {
      const allUsers = StorageService.getUsers().filter(u => !u.isDisabled);
      setSalesmen(allUsers);
    }
  }, [currentUser]);

  const getMaxStock = () => {
    if (!stock) return 0;
    return formData.productType === 'oil' ? stock.oilStockKg : stock.cakeStockKg;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(formData.quantity);
    const rate = parseFloat(formData.ratePerUnit);
    const max = getMaxStock();

    if (isNaN(qty) || qty <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }
    if (qty > max) {
      setError(`Insufficient Stock. Max available: ${max} Kg`);
      return;
    }
     if (currentUser.role === UserRole.OWNER && formData.ratePerUnit && (isNaN(rate) || rate < 0)) {
      setError("Rate must be a valid, non-negative number.");
      return;
    }

    try {
      const selectedSalesman = salesmen.find(s => s.id === formData.salesmanId);
      
      StorageService.createSale(currentUser, {
        productType: formData.productType,
        quantity: qty,
        buyerName: formData.buyerName,
        buyerType: formData.buyerType,
        vehicleNo: formData.vehicleNo,
        ratePerUnit: currentUser.role === UserRole.OWNER ? rate : undefined,
        totalValue: currentUser.role === UserRole.OWNER ? (rate * qty) : undefined,
        salesmanId: currentUser.role === UserRole.OWNER ? formData.salesmanId : currentUser.id,
        salesmanName: currentUser.role === UserRole.OWNER ? selectedSalesman?.displayName : currentUser.displayName,
      });
      onComplete();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!stock) return <div className="p-8 text-center text-slate-500">Loading stock context...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-amber-600 text-white p-4 rounded-xl shadow-md mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Coins /> New Sale Entry
        </h2>
        <p className="text-amber-100 text-sm mt-1">Dispatch Finished Goods</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 p-4 rounded text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle size={20} />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {/* Stock Context */}
      <div className="grid grid-cols-2 gap-4">
        <div onClick={() => setFormData({...formData, productType: 'oil'})} 
             className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.productType === 'oil' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/50 dark:border-amber-600' : 'border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Droplet size={16} className={formData.productType === 'oil' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'} />
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Oil (Kg)</span>
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stock.oilStockKg.toLocaleString()}</p>
        </div>
        
        <div onClick={() => setFormData({...formData, productType: 'cake'})} 
             className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.productType === 'cake' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/50 dark:border-amber-600' : 'border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700'}`}>
           <div className="flex items-center gap-2 mb-1">
            <Layers size={16} className={formData.productType === 'cake' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'} />
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Cake (Kg)</span>
          </div>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{stock.cakeStockKg.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div>
           <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Salesman / Dispatched By</label>
           <div className="relative">
             <UserIcon className="absolute left-3 top-3 text-slate-400" size={20} />
             {currentUser.role === UserRole.OWNER ? (
               <select 
                 name="salesmanId" 
                 value={formData.salesmanId} 
                 onChange={handleChange} 
                 className={`${inputStyles} pl-10`}
               >
                 {salesmen.map(s => (
                   <option key={s.id} value={s.id}>{s.displayName} ({s.role})</option>
                 ))}
               </select>
             ) : (
               <input disabled value={currentUser.displayName} className={`${disabledInputStyles} pl-10`} />
             )}
           </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Dispatch Quantity (Kg)</label>
          <input 
            required 
            type="number" 
            step="any"
            name="quantity" 
            value={formData.quantity} 
            onChange={handleChange} 
            className="w-full p-4 text-2xl font-mono border-2 border-amber-200 dark:border-amber-700 rounded-lg focus:border-amber-500 focus:ring-4 focus:ring-amber-100 dark:bg-slate-700 dark:text-white dark:focus:ring-amber-900/50 transition-all" 
            placeholder="0"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">Max Available: {getMaxStock()}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Buyer Name</label>
             <input required name="buyerName" value={formData.buyerName} onChange={handleChange} className={inputStyles} />
          </div>
          <div>
             <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Buyer Type</label>
             <select name="buyerType" value={formData.buyerType} onChange={handleChange} className={inputStyles}>
               <option value="retailer">Retailer</option>
               <option value="wholesaler">Wholesaler</option>
               <option value="factory">Factory</option>
               <option value="other">Other</option>
             </select>
          </div>
        </div>

        <div>
           <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Vehicle No (Optional)</label>
           <input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} className={inputStyles} placeholder="e.g. GJ-01-AB-1234" />
        </div>

        {currentUser.role === UserRole.OWNER && (
           <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rate Per Unit (₹)</label>
             <input type="number" step="any" name="ratePerUnit" value={formData.ratePerUnit} onChange={handleChange} className={inputStyles} placeholder="0.00" />
           </div>
        )}
      </div>

      <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-lg">
        <CheckCircle size={24} /> Confirm & Dispatch
      </button>
    </form>
  );
};