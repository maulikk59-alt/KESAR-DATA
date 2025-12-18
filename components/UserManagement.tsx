import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { User, UserRole } from '../types';
import { UserPlus, Power, Key, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  currentUser: User;
}

const inputStyles = "w-full p-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition";

export const UserManagement: React.FC<Props> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: '', loginId: '', employeeCode: '', email: '', phone: '' });
  const [tempPass, setTempPass] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(StorageService.getUsers().filter(u => u.role !== UserRole.OWNER));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      // Simulate slight delay for feedback
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const pass = StorageService.createSupervisor(currentUser, newUser);
      setTempPass(pass);
      setIsAdding(false);
      setNewUser({ name: '', loginId: '', employeeCode: '', email: '', phone: '' });
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggle = (id: string) => {
    if (confirm('Are you sure you want to change this user\'s access status?')) {
      StorageService.toggleUserStatus(currentUser, id);
      loadUsers();
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Supervisor Provisioning</h2>
         <button 
           onClick={() => { setIsAdding(!isAdding); setError(null); setTempPass(null); }} 
           className={`${isAdding ? 'bg-slate-500' : 'bg-blue-600'} text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors`}
         >
           {isAdding ? 'Cancel' : <><UserPlus size={16} /> Add New</>}
         </button>
       </div>

       {tempPass && (
         <div className="bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-800 p-5 rounded-xl text-emerald-800 dark:text-emerald-300 shadow-sm animate-fade-in">
           <p className="font-bold flex items-center gap-2 mb-2"><CheckCircle2 size={20} className="text-emerald-600"/> Account Provisioned Successfully!</p>
           <p className="text-sm leading-relaxed mb-4">Please copy and share this temporary password with the supervisor. They must change it upon their first login.</p>
           <div className="flex flex-col gap-2">
             <div className="font-mono text-2xl font-black bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-700 text-center select-all tracking-widest">
               {tempPass}
             </div>
             <button onClick={() => setTempPass(null)} className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase hover:underline text-right mt-2">
               I have saved this password
             </button>
           </div>
         </div>
       )}

       {isAdding && (
         <form onSubmit={handleAdd} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-xl space-y-5 animate-fade-in">
           <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">New Staff Details</h3>
             {isProcessing && <Loader2 className="animate-spin text-blue-500" size={20} />}
           </div>

           {error && (
             <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded-xl text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2 animate-pulse">
               <AlertCircle size={16} /> {error}
             </div>
           )}

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Supervisor Full Name</label>
               <input placeholder="e.g. Rahul Sharma" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className={inputStyles} />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Unique Login ID</label>
               <input placeholder="e.g. rahul_ops" required value={newUser.loginId} onChange={e => setNewUser({...newUser, loginId: e.target.value})} className={inputStyles} />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Employee Code</label>
               <input placeholder="KSR-102" value={newUser.employeeCode} onChange={e => setNewUser({...newUser, employeeCode: e.target.value})} className={inputStyles} />
             </div>
             <div className="space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Contact Phone</label>
               <input type="tel" placeholder="9988776655" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className={inputStyles} />
             </div>
             <div className="sm:col-span-2 space-y-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email Address</label>
               <input type="email" placeholder="rahul@example.com" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className={inputStyles} />
             </div>
           </div>
           
           <button 
             type="submit" 
             disabled={isProcessing}
             className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isProcessing ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
           >
             {isProcessing ? 'Processing Account...' : 'Provision Account'}
           </button>
         </form>
       )}

       <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-sm text-left whitespace-nowrap">
             <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">
               <tr>
                 <th className="p-4">Staff Member</th>
                 <th className="p-4">Credentials</th>
                 <th className="p-4">Contact Info</th>
                 <th className="p-4">Access Status</th>
                 <th className="p-4 text-right">Control</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
               {users.map(u => (
                 <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                   <td className="p-4">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                         {u.displayName.charAt(0)}
                       </div>
                       <div>
                         <p className="font-bold text-slate-800 dark:text-slate-100">{u.displayName}</p>
                         <p className="text-[10px] text-slate-400 font-mono">{u.employeeCode || 'NO CODE'}</p>
                       </div>
                     </div>
                   </td>
                   <td className="p-4">
                     <span className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-500 dark:text-slate-400">{u.loginId}</span>
                   </td>
                   <td className="p-4 text-xs">
                      {u.phone && <div className="text-slate-700 dark:text-slate-200">{u.phone}</div>}
                      {u.email && <div className="text-slate-400 italic truncate max-w-[120px]">{u.email}</div>}
                      {!u.phone && !u.email && <span className="text-slate-300">--</span>}
                   </td>
                   <td className="p-4">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${u.isDisabled ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'}`}>
                       {u.isDisabled ? 'DISABLED' : 'ACTIVE'}
                     </span>
                   </td>
                   <td className="p-4 text-right">
                     <button 
                       onClick={() => handleToggle(u.id)} 
                       className={`p-2 rounded-lg transition-colors ${u.isDisabled ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20' : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20'}`}
                       title={u.isDisabled ? "Enable User" : "Disable User"}
                     >
                       <Power size={18} />
                     </button>
                   </td>
                 </tr>
               ))}
               {users.length === 0 && (
                 <tr>
                   <td colSpan={5} className="p-12 text-center text-slate-400 italic">No supervisor accounts created yet.</td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
       </div>
    </div>
  );
};