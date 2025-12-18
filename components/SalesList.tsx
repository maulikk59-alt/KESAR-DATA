import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User, SalesEntry, UserRole, BuyerType } from '../types';
import { XCircle, User as UserIcon } from 'lucide-react';

interface SalesListProps {
  currentUser: User;
}

const inputStyles = "w-full p-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition";

export const SalesList: React.FC<SalesListProps> = ({ currentUser }) => {
  const [sales, setSales] = useState<SalesEntry[]>([]);
  const [filters, setFilters] = useState({
    productType: 'all' as 'all' | 'oil' | 'cake',
    buyerType: 'all' as 'all' | BuyerType,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = () => {
    setSales(StorageService.getSales(currentUser));
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleCancelSale = (saleId: string) => {
    const reason = prompt("Please provide a reason for cancellation:");
    if (reason && reason.trim() !== '') {
      try {
        StorageService.cancelSale(currentUser, saleId, reason);
        loadSales();
        alert('Sale cancelled and stock restored.');
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const filteredSales = sales.filter(s => {
    const saleDate = new Date(s.timestamp);
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;

    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);

    const productMatch = filters.productType === 'all' || s.productType === filters.productType;
    const buyerMatch = filters.buyerType === 'all' || s.buyerType === filters.buyerType;
    const startDateMatch = !startDate || saleDate >= startDate;
    const endDateMatch = !endDate || saleDate <= endDate;
    
    return productMatch && buyerMatch && startDateMatch && endDateMatch;
  });

  const sortedSales = [...filteredSales].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-slate-800 dark:text-slate-100 text-xl">Dispatch History</h2>
      
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <select name="productType" value={filters.productType} onChange={handleFilterChange} className={inputStyles}>
            <option value="all">All Products</option>
            <option value="oil">Oil</option>
            <option value="cake">Cake</option>
          </select>
          <select name="buyerType" value={filters.buyerType} onChange={handleFilterChange} className={inputStyles}>
            <option value="all">All Buyers</option>
            <option value="retailer">Retailer</option>
            <option value="wholesaler">Wholesaler</option>
            <option value="factory">Factory</option>
            <option value="other">Other</option>
          </select>
        </div>
         <div className="grid grid-cols-2 gap-2">
           <div>
             <label className="text-slate-500 dark:text-slate-400 text-[10px] font-bold">Start Date</label>
             <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={inputStyles}/>
           </div>
           <div>
             <label className="text-slate-500 dark:text-slate-400 text-[10px] font-bold">End Date</label>
             <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={inputStyles}/>
           </div>
        </div>
      </div>


      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {sortedSales.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No sales records match filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
               <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs">
                <tr>
                  <th className="p-3">Details</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Buyer</th>
                  {currentUser.role === UserRole.OWNER && <th className="p-3 text-right">Value</th>}
                  <th className="p-3">Salesman</th>
                  {currentUser.role === UserRole.OWNER && <th className="p-3 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {sortedSales.map(sale => (
                  <tr key={sale.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 ${sale.status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/20 opacity-60' : ''}`}>
                     <td className="p-3">
                       <p className={`font-bold text-slate-700 dark:text-slate-200 ${sale.status === 'cancelled' ? 'line-through' : ''}`}>{sale.dateStr}</p>
                       <p className="text-[10px] text-slate-400">{new Date(sale.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                     </td>
                     <td className="p-3">
                       <div className="flex items-center gap-2">
                         <span className={`w-2 h-2 rounded-full ${sale.productType === 'oil' ? 'bg-amber-500' : 'bg-stone-500'}`}></span>
                         <span className={`font-bold text-slate-800 dark:text-slate-100 ${sale.status === 'cancelled' ? 'line-through' : ''}`}>{sale.quantity.toLocaleString()} Kg</span>
                       </div>
                     </td>
                     <td className="p-3">
                        <p className={`text-slate-800 dark:text-slate-200 ${sale.status === 'cancelled' ? 'line-through' : ''}`}>{sale.buyerName}</p>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1 rounded uppercase text-slate-500 dark:text-slate-400">{sale.buyerType}</span>
                     </td>
                     {currentUser.role === UserRole.OWNER && (
                       <td className={`p-3 text-right font-mono text-green-700 dark:text-green-400 ${sale.status === 'cancelled' ? 'line-through' : ''}`}>
                         ₹{(sale.totalValue || 0).toLocaleString()}
                       </td>
                     )}
                     <td className="p-3">
                       <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                         <UserIcon size={12} className="shrink-0" />
                         <div className="flex flex-col">
                           <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Sold By:</span>
                           <span className={`font-medium text-slate-600 dark:text-slate-300 ${sale.status === 'cancelled' ? 'line-through' : ''}`}>{sale.salesmanName}</span>
                         </div>
                       </div>
                     </td>
                     {currentUser.role === UserRole.OWNER && (
                       <td className="p-3 text-center">
                         {sale.status === 'confirmed' ? (
                           <button onClick={() => handleCancelSale(sale.id)} className="text-red-500 hover:text-red-700 dark:text-red-500/80 dark:hover:text-red-500 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                             <XCircle size={16} />
                           </button>
                         ) : (
                           <span className="text-red-500 text-[10px] font-bold uppercase">Cancelled</span>
                         )}
                       </td>
                     )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};