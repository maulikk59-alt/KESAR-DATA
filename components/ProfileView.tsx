import React, { useState } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storageService';
import { UserCircle, KeyRound, ShieldCheck } from 'lucide-react';

interface ProfileViewProps {
  currentUser: User;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ currentUser }) => {
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      StorageService.changePassword(currentUser.id, passwordData.oldPassword, passwordData.newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };
  
  const inputStyles = "w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition";

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
          <UserCircle /> My Profile
        </h2>
        <div className="space-y-2 text-sm">
          <p><strong className="text-slate-500 dark:text-slate-400">Name:</strong> <span className="text-slate-700 dark:text-slate-200">{currentUser.displayName}</span></p>
          <p><strong className="text-slate-500 dark:text-slate-400">Login ID:</strong> <span className="font-mono text-slate-700 dark:text-slate-200">{currentUser.loginId}</span></p>
          <p><strong className="text-slate-500 dark:text-slate-400">Role:</strong> <span className="font-bold text-slate-700 dark:text-slate-200">{currentUser.role}</span></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <KeyRound /> Change Password
        </h3>
        
        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'}`}>
            {message.text}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
          <input required type="password" name="oldPassword" value={passwordData.oldPassword} onChange={handleChange} className={inputStyles} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
          <input required type="password" name="newPassword" value={passwordData.newPassword} onChange={handleChange} className={inputStyles} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
          <input required type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handleChange} className={inputStyles} />
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md flex items-center justify-center gap-2">
          <ShieldCheck size={20} /> Update Password
        </button>
      </form>
    </div>
  );
};