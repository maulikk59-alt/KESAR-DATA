import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { UserRole, Language, User } from '../types';
import { ShieldCheck, UserCircle, KeyRound, Globe, Mail, AlertCircle, CheckCircle } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  onLanguageChange: (lang: Language) => void;
  currentLang: Language;
}

const TEXTS = {
  en: { title: 'KESAR DATA', subtitle: 'Secure Production Control', login: 'Login', id: 'Login ID', pass: 'Password', setup: 'Setup Owner Account' },
  hi: { title: 'केसर डेटा', subtitle: 'सुरक्षित उत्पादन नियंत्रण', login: 'लॉग इन करें', id: 'लॉगिन आईडी', pass: 'पासवर्ड', setup: 'मालिक खाता सेटअप' },
  gu: { title: 'કેસર ડેટા', subtitle: 'સુરક્ષિત ઉત્પાદન નિયંત્રણ', login: 'લોગ ઇન કરો', id: 'લોગિન આઈડી', pass: 'પાસવર્ડ', setup: 'માલિક ખાતું બનાવો' }
};

const baseInputStyles = "w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition";
const iconInputStyles = `${baseInputStyles} pl-10`;

export const Login: React.FC<LoginProps> = ({ onLogin, onLanguageChange, currentLang }) => {
  const [isSetupMode, setIsSetupMode] = useState(!StorageService.isSystemInitialized());
  const [viewMode, setViewMode] = useState<'login' | 'reset_start' | 'reset_verify_owner' | 'reset_new_password'>('login');
  const [formData, setFormData] = useState({ name: '', loginId: '', password: '', confirmPassword: '' });
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [verifyName, setVerifyName] = useState('');
  const [newPass, setNewPass] = useState({ pass: '', confirm: '' });
  const [resetMessage, setResetMessage] = useState('');
  const [error, setError] = useState('');

  const t = TEXTS[currentLang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isSetupMode) {
        if (formData.password !== formData.confirmPassword) throw new Error("Passwords do not match");
        if (formData.password.length < 6) throw new Error("Password must be at least 6 chars");
        StorageService.initializeSystem({
          name: formData.name,
          loginId: formData.loginId,
          password: formData.password
        });
        StorageService.login(formData.loginId, formData.password);
        onLogin();
      } else {
        StorageService.login(formData.loginId, formData.password);
        onLogin();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResetStart = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = StorageService.findUserByLoginId(formData.loginId);
    if (!user) {
      setError("User ID not found in system.");
      return;
    }
    
    setResetUser(user);
    if (user.role === UserRole.SUPERVISOR) {
      setResetMessage("Supervisor Account Detected: Please contact the system Owner (Administrator) to reset your password. They can update it from the User Management panel.");
    } else {
      setViewMode('reset_verify_owner');
    }
  };

  const handleVerifyOwner = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (resetUser && verifyName.toLowerCase() === resetUser.displayName.toLowerCase()) {
      setViewMode('reset_new_password');
    } else {
      setError("Verification failed. Full Name does not match.");
    }
  };

  const handleNewPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPass.pass.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPass.pass !== newPass.confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (resetUser) {
      StorageService.updatePassword(resetUser.id, newPass.pass);
      setResetMessage("Password reset successful! You can now log in.");
      setViewMode('login');
      setFormData({ ...formData, password: '' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        
        <div className="flex justify-end mb-4">
           <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-full px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 space-x-2">
             <Globe size={14} />
             <button onClick={() => onLanguageChange('en')} className={currentLang === 'en' ? 'text-blue-600 dark:text-blue-400' : ''}>ENG</button>
             <span>|</span>
             <button onClick={() => onLanguageChange('hi')} className={currentLang === 'hi' ? 'text-blue-600 dark:text-blue-400' : ''}>हिंदी</button>
             <span>|</span>
             <button onClick={() => onLanguageChange('gu')} className={currentLang === 'gu' ? 'text-blue-600 dark:text-blue-400' : ''}>ગુજ</button>
           </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 mb-4">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{t.title}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t.subtitle}</p>
        </div>

        {resetMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm mb-6 flex gap-3 items-start animate-fade-in">
            <CheckCircle className="shrink-0 mt-0.5" size={18} />
            <p>{resetMessage}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded-xl text-red-700 dark:text-red-300 text-xs text-center font-bold mb-6 flex items-center justify-center gap-2 animate-fade-in">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {viewMode === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSetupMode && (
               <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input name="name" type="text" value={formData.name} onChange={handleChange} className={baseInputStyles} required />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.id}</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input name="loginId" type="text" value={formData.loginId} onChange={handleChange} className={iconInputStyles} placeholder="username" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.pass}</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input name="password" type="password" value={formData.password} onChange={handleChange} className={iconInputStyles} required />
              </div>
            </div>

            {isSetupMode && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
                <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className={baseInputStyles} required />
              </div>
            )}

            {!isSetupMode && (
              <div className="text-right">
                <button type="button" onClick={() => { setViewMode('reset_start'); setResetMessage(''); setError(''); }} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Forgot Password?
                </button>
              </div>
            )}

            <button type="submit" className="w-full bg-blue-900 text-white p-4 rounded-xl font-bold hover:bg-blue-800 transition mt-2 shadow-lg active:scale-95">
              {isSetupMode ? t.setup : t.login}
            </button>
          </form>
        )}

        {viewMode === 'reset_start' && (
          <form onSubmit={handleResetStart} className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Password Recovery</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Please enter your Login ID to begin the recovery process.</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.id}</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input name="loginId" type="text" value={formData.loginId} onChange={handleChange} className={iconInputStyles} placeholder="username" required />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-900 text-white p-4 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg active:scale-95">
                Verify Identity
            </button>
            <button type="button" onClick={() => { setViewMode('login'); setError(''); }} className="w-full text-sm text-slate-600 dark:text-slate-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                Back to Login
            </button>
          </form>
        )}

        {viewMode === 'reset_verify_owner' && (
           <form onSubmit={handleVerifyOwner} className="space-y-4 animate-fade-in">
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Owner Verification</h3>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">To reset the main account, please confirm the <strong>Full Name</strong> used during setup.</p>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Full Name</label>
               <input type="text" value={verifyName} onChange={e => setVerifyName(e.target.value)} className={baseInputStyles} placeholder="John Doe" required />
             </div>
             <button type="submit" className="w-full bg-blue-900 text-white p-4 rounded-xl font-bold hover:bg-blue-800 transition shadow-lg active:scale-95">
                 Verify Owner
             </button>
             <button type="button" onClick={() => setViewMode('login')} className="w-full text-sm text-slate-600 dark:text-slate-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                 Back to Login
             </button>
           </form>
        )}

        {viewMode === 'reset_new_password' && (
          <form onSubmit={handleNewPasswordSubmit} className="space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Set New Password</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Verification successful. Please create a new strong password.</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
              <input type="password" value={newPass.pass} onChange={e => setNewPass({...newPass, pass: e.target.value})} className={baseInputStyles} required minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
              <input type="password" value={newPass.confirm} onChange={e => setNewPass({...newPass, confirm: e.target.value})} className={baseInputStyles} required />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg active:scale-95">
                Save & Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};