import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { InventoryLedgerItem, FinishedStockState, InventoryAdjustment, ProductType, UserRole } from '../types';
import { Layers, Droplet, FileSpreadsheet, Scale, Check, X, Plus, Minus, Clock, AlertCircle } from 'lucide-react';

const inputStyles = "w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition";

export const InventoryView: React.FC = () => {
  const [ledger, setLedger] = useState<InventoryLedgerItem[]>([]);
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [stock, setStock] = useState<FinishedStockState | null>(null);
  const [tab, setTab] = useState<'ledger' | 'approvals'>('ledger');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestForm, setRequestForm] = useState({ 
    product: 'oil' as ProductType, 
    qty: '', 
    reason: '',
    type: 'add' as 'add' | 'sub'
  });
  
  const user = StorageService.getCurrentUser();

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLedger(StorageService.getLedger());
    setStock(StorageService.getFinishedStock());
    setAdjustments(StorageService.getAdjustments());
  };

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      const finalQty = requestForm.type === 'add' ? Math.abs(Number(requestForm.qty)) : -Math.abs(Number(requestForm.qty));
      
      StorageService.requestAdjustment(user, requestForm.product, finalQty, requestForm.reason);
      setIsRequesting(false);
      setRequestForm({ product: 'oil', qty: '', reason: '', type: 'add' });
      refreshData();
      alert("Adjustment Requested. Pending Owner Approval.");
    }
  };

  const handleApprove = (id: string) => {
    if (user && confirm("Approve this adjustment? Stock will be updated immediately.")) {
      try {
        StorageService.approveAdjustment(user, id);
        refreshData();
      } catch (e: any) { alert(e.message); }
    }
  };

  const handleReject = (id: string) => {
    if (user && confirm("Reject this adjustment request?")) {
       try {
        StorageService.rejectAdjustment(user, id);
        refreshData();
      } catch (e: any) { alert(e.message); }
    }
  };

  if (!stock || !user) return <div className="p-8 text-center text-slate-500">Loading inventory data...</div>;

  const pendingCount = adjustments.filter(a => a.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      
      {/* Stock Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
           <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
             <Droplet size={18} className="text-amber-500" /> 
             <span className="text-xs font-bold uppercase tracking-wider">Oil Inventory</span>
           </div>
           <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
             {stock.oilStockKg.toLocaleString()} 
             <span className="text-sm font-normal text-slate-400 ml-1">Kg</span>
           </p>
           <div className="absolute -right-2 -bottom-2 opacity-5 text-amber-500">
             <Droplet size={80} />
           </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
           <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
             <Layers size={18} className="text-stone-500" /> 
             <span className="text-xs font-bold uppercase tracking-wider">Cake Inventory</span>
           </div>
           <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight">
             {stock.cakeStockKg.toLocaleString()} 
             <span className="text-sm font-normal text-slate-400 ml-1">Kg</span>
           </p>
           <div className="absolute -right-2 -bottom-2 opacity-5 text-stone-500">
             <Layers size={80} />
           </div>
        </div>
      </div>

      {/* Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex w-full sm:w-auto shadow-sm">
          <button 
            onClick={() => setTab('ledger')} 
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === 'ledger' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400'}`}
          >
            <FileSpreadsheet size={16} /> Ledger
          </button>
          <button 
            onClick={() => setTab('approvals')} 
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 relative ${tab === 'approvals' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-400'}`}
          >
            <Clock size={16} /> Adjustments
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold ring-2 ring-white dark:ring-slate-800">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
        <button 
          onClick={() => setIsRequesting(!isRequesting)} 
          className={`w-full sm:w-auto px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${isRequesting ? 'bg-slate-800 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600'}`}
        >
           <Scale size={18} /> {isRequesting ? 'Close Form' : 'Request Correction'}
        </button>
      </div>

      {/* Request Form */}
      {isRequesting && (
        <form onSubmit={handleRequest} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-blue-500 shadow-xl space-y-5 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <AlertCircle className="text-blue-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Inventory Correction Request</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Target Product</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button" 
                  onClick={() => setRequestForm({...requestForm, product: 'oil'})}
                  className={`py-3 rounded-lg border-2 font-bold text-sm transition-all ${requestForm.product === 'oil' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                >
                  Oil
                </button>
                <button 
                  type="button" 
                  onClick={() => setRequestForm({...requestForm, product: 'cake'})}
                  className={`py-3 rounded-lg border-2 font-bold text-sm transition-all ${requestForm.product === 'cake' ? 'border-stone-500 bg-stone-50 dark:bg-stone-900/20 text-stone-700 dark:text-stone-400' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                >
                  Cake
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Correction Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button" 
                  onClick={() => setRequestForm({...requestForm, type: 'add'})}
                  className={`py-3 rounded-lg border-2 font-bold text-sm transition-all flex items-center justify-center gap-1 ${requestForm.type === 'add' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                >
                  <Plus size={14} /> Add
                </button>
                <button 
                  type="button" 
                  onClick={() => setRequestForm({...requestForm, type: 'sub'})}
                  className={`py-3 rounded-lg border-2 font-bold text-sm transition-all flex items-center justify-center gap-1 ${requestForm.type === 'sub' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                >
                  <Minus size={14} /> Subtract
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Quantity (Kg)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={requestForm.qty} 
                  onChange={e => setRequestForm({...requestForm, qty: e.target.value})} 
                  className={`${inputStyles} text-lg font-mono`} 
                  required 
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Reason for Adjustment</label>
                <input 
                  type="text" 
                  placeholder="e.g. Weighing scale error" 
                  value={requestForm.reason} 
                  onChange={e => setRequestForm({...requestForm, reason: e.target.value})} 
                  className={inputStyles} 
                  required 
                />
             </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-3">
             <Scale size={20} /> Submit for Approval
          </button>
        </form>
      )}

      {/* Ledger Tab Content */}
      {tab === 'ledger' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Time & Event</th>
                  <th className="p-4">Product</th>
                  <th className="p-4 text-right">Change</th>
                  <th className="p-4 text-right">Balance After</th>
                  <th className="p-4">Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-mono">
                {ledger.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                     <td className="p-4">
                       <span className="text-slate-800 dark:text-slate-200 font-bold">{new Date(item.timestamp).toLocaleDateString()}</span>
                       <br/>
                       <span className="text-slate-400">{new Date(item.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                     </td>
                     <td className="p-4">
                       <div className="flex flex-col">
                         <span className={`inline-block px-2 py-0.5 rounded text-[9px] uppercase font-black w-fit mb-1 ${item.changeType === 'production' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : item.changeType === 'sale' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                           {item.changeType}
                         </span>
                         <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
                           {item.productType === 'oil' ? <Droplet size={10} className="text-amber-500" /> : <Layers size={10} className="text-stone-500" />}
                           {item.productType}
                         </span>
                       </div>
                     </td>
                     <td className={`p-4 text-right font-black text-sm ${item.quantityChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                       {item.quantityChange > 0 ? '+' : ''}{item.quantityChange.toLocaleString()}
                     </td>
                     <td className="p-4 text-right text-slate-800 dark:text-slate-100 font-bold">{item.balanceAfter.toLocaleString()} <span className="text-[9px] text-slate-400 font-normal">Kg</span></td>
                     <td className="p-4 text-slate-500 dark:text-slate-400 font-sans italic truncate max-w-[100px]">{item.performedBy}</td>
                  </tr>
                ))}
                {ledger.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 italic">No inventory movements recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustments Tab Content */}
      {tab === 'approvals' && (
        <div className="space-y-4">
           {adjustments.map(adj => (
             <div key={adj.id} className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-8 shadow-sm transition-all hover:shadow-md ${adj.status === 'PENDING' ? 'border-amber-400' : adj.status === 'APPROVED' ? 'border-green-500' : 'border-red-500'}`}>
                <div className="flex justify-between items-start gap-4">
                   <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${adj.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' : adj.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                          {adj.status}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{new Date(adj.timestamp).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-baseline gap-2">
                        <h4 className="font-black text-lg text-slate-800 dark:text-slate-100 uppercase">{adj.productType}</h4>
                        <p className={`text-xl font-mono font-bold ${adj.requestedChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {adj.requestedChange > 0 ? '+' : ''}{adj.requestedChange.toLocaleString()} <span className="text-xs uppercase font-sans">Kg</span>
                        </p>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium italic leading-relaxed">"{adj.reason}"</p>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Requested By: <span className="text-blue-500">{adj.requestedBy}</span></p>
                        {adj.actionedBy && (
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Actioned By: <span className="text-slate-600 dark:text-slate-200">{adj.actionedBy}</span></p>
                        )}
                      </div>
                   </div>
                   
                   {adj.status === 'PENDING' && user.role === UserRole.OWNER && (
                     <div className="flex flex-col gap-2">
                       <button 
                         onClick={() => handleApprove(adj.id)} 
                         className="flex items-center justify-center h-12 w-12 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all shadow-lg active:scale-95"
                         title="Approve Adjustment"
                       >
                         <Check size={24} strokeWidth={3} />
                       </button>
                       <button 
                         onClick={() => handleReject(adj.id)} 
                         className="flex items-center justify-center h-12 w-12 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all shadow-lg active:scale-95"
                         title="Reject Request"
                       >
                         <X size={24} strokeWidth={3} />
                       </button>
                     </div>
                   )}
                </div>
             </div>
           ))}
           {adjustments.length === 0 && (
             <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center flex flex-col items-center">
                <div className="h-16 w-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 mb-4">
                  <Clock size={32} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200">No Adjustment Requests</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-[200px]">Inventory adjustment logs will appear here once requested.</p>
             </div>
           )}
        </div>
      )}

    </div>
  );
};