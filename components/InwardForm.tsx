import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { PackagePlus } from 'lucide-react';

interface InwardFormProps {
  onComplete: () => void;
  currentUser: string;
}

const inputStyles = "w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition";
const disabledInputStyles = "w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 font-mono";

export const InwardForm: React.FC<InwardFormProps> = ({ onComplete, currentUser }) => {
  const [formData, setFormData] = useState({
    supplier: '',
    vehicleNo: '',
    weightKg: '' as any
  });
  
  const [currentTimestamp, setCurrentTimestamp] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTimestamp(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = StorageService.getCurrentUser();
    if (!user) return;

    StorageService.addInward(user, {
      supplier: formData.supplier,
      vehicleNo: formData.vehicleNo,
      weightKg: Number(formData.weightKg),
    });
    onComplete();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-md mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <PackagePlus /> Raw Material Inward
        </h2>
        <p className="text-emerald-100 text-sm mt-1">Add groundnut stock to inventory</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Entry Timestamp</label>
          <input 
            disabled 
            value={formatDateTime(currentTimestamp)} 
            className={disabledInputStyles}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Supplier Name</label>
          <input required name="supplier" value={formData.supplier} onChange={handleChange} className={inputStyles} />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vehicle Number</label>
          <input required name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} className={inputStyles} placeholder="KA-01-AB-1234" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Net Weight (KG)</label>
          <input 
            required 
            type="number" 
            name="weightKg" 
            value={formData.weightKg} 
            onChange={handleChange} 
            className="w-full p-4 text-2xl font-mono border-2 border-emerald-200 dark:border-emerald-700 rounded-lg focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 dark:bg-slate-700 dark:text-white dark:focus:ring-emerald-900/50 transition-all" 
            placeholder="0"
          />
        </div>
      </div>

      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg text-lg">
        Update Stock
      </button>
    </form>
  );
};