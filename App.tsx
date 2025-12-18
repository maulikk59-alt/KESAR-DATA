import React, { useState, useEffect } from 'react';
import { UserRole, User, Language } from './types';
import { StorageService } from './services/storageService';
import { Dashboard } from './components/Dashboard';
import { ProductionForm } from './components/ProductionForm';
import { InwardForm } from './components/InwardForm';
import { Login } from './components/Login';
import { UserManagement } from './components/UserManagement';
import { AuditLogViewer } from './components/AuditLog';
import { SalesForm } from './components/SalesForm';
import { SalesList } from './components/SalesList';
import { InventoryView } from './components/InventoryView';
import { ProfileView } from './components/ProfileView';
import { ExportView } from './components/ExportView';
import { LayoutDashboard, Factory, Truck, LogOut, Menu, X, Users, History, KeyRound, Coins, PackageOpen, Sun, Moon, Wifi, WifiOff, FileDown } from 'lucide-react';

type View = 'dashboard' | 'production' | 'inward' | 'users' | 'audit' | 'sales_new' | 'sales_list' | 'inventory' | 'profile' | 'export';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [lang, setLang] = useState<Language>('en');
  const [stock, setStock] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [inwardLogs, setInwardLogs] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

  useEffect(() => {
    const u = StorageService.getCurrentUser();
    if (u) {
      setUser(u);
      refreshData(u);
      setView(u.role === UserRole.SUPERVISOR ? 'production' : 'dashboard');
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  const refreshData = (currentUser: User) => {
    setStock(StorageService.getStock());
    const data = StorageService.getDashboardStats(currentUser); 
    setDashboardStats(data);
    setLogs(data.history);
    setInwardLogs(data.inwardHistory);
  };

  const handleLogin = () => {
    const u = StorageService.getCurrentUser();
    if (u) {
      setUser(u);
      refreshData(u);
      setView(u.role === UserRole.SUPERVISOR ? 'production' : 'dashboard');
    }
  };

  const handleLogout = () => {
    StorageService.logout();
    setUser(null);
    setIsMenuOpen(false);
  };

  const handleForcePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && newPassword.length >= 6) {
      StorageService.updatePassword(user.id, newPassword);
      const updated = StorageService.getCurrentUser();
      setUser(updated);
      alert("Password updated successfully.");
    } else {
      alert("Password must be at least 6 characters.");
    }
  };

  const NavBtn = ({ label, icon: Icon, active, onClick }: any) => (
    <button 
      onClick={() => { onClick(); setIsMenuOpen(false); }} 
      className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${active ? 'bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/50 dark:text-blue-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700'}`}
    >
      <Icon size={20} /> {label}
    </button>
  );

  if (!user) {
    return <Login onLogin={handleLogin} onLanguageChange={setLang} currentLang={lang} />;
  }

  if (user.isFirstLogin) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
         <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg max-w-md w-full">
           <div className="text-center mb-6 text-amber-600">
             <KeyRound size={48} className="mx-auto mb-2" />
             <h2 className="text-xl font-bold dark:text-amber-400">Security Update Required</h2>
             <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">As a new user, you must set a permanent password before continuing.</p>
           </div>
           <form onSubmit={handleForcePasswordChange} className="space-y-4">
             <input 
               type="password" 
               placeholder="New Strong Password" 
               value={newPassword}
               onChange={e => setNewPassword(e.target.value)}
               className="w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
               required
               minLength={6}
             />
             <button type="submit" className="w-full bg-amber-600 text-white p-3 rounded-lg font-bold hover:bg-amber-700">
               Update & Continue
             </button>
           </form>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 font-sans">
      
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600 dark:text-slate-300">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
            <div>
               <h1 className="font-bold text-slate-800 dark:text-slate-100 text-lg tracking-tight">KESAR DATA</h1>
               <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-600">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mr-2">Stock</span>
              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{stock.toLocaleString()} kg</span>
            </div>
            <div className="flex items-center gap-2">
              <div title={isOnline ? 'Online' : 'Offline'}>
                {isOnline ? <Wifi size={16} className="text-green-500" /> : <WifiOff size={16} className="text-red-500" />}
              </div>
              <button onClick={toggleTheme} className="p-2 text-slate-600 dark:text-slate-300">
                {document.documentElement.classList.contains('dark') ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setIsMenuOpen(false)}>
           <div className="absolute left-0 top-16 w-72 h-full bg-white dark:bg-slate-800 shadow-xl p-4 space-y-2 flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="pb-4 mb-4 border-b border-slate-100 dark:border-slate-700">
                <button onClick={() => { setView('profile'); setIsMenuOpen(false); }} className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                      {user.displayName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-100">{user.displayName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{user.role}</p>
                    </div>
                  </div>
                </button>
              </div>
              
              {user.role === UserRole.OWNER && (
                <>
                  <NavBtn label="Dashboard" icon={LayoutDashboard} active={view === 'dashboard'} onClick={() => setView('dashboard')} />
                  <NavBtn label="Inventory & Ledger" icon={PackageOpen} active={view === 'inventory'} onClick={() => setView('inventory')} />
                  <NavBtn label="User Management" icon={Users} active={view === 'users'} onClick={() => setView('users')} />
                  <NavBtn label="Audit Logs" icon={History} active={view === 'audit'} onClick={() => setView('audit')} />
                  <NavBtn label="Export Center" icon={FileDown} active={view === 'export'} onClick={() => setView('export')} />
                  <div className="border-t border-slate-100 dark:border-slate-700 my-2"></div>
                </>
              )}
              
              <NavBtn label="Production Log" icon={Factory} active={view === 'production'} onClick={() => setView('production')} />
              <NavBtn label="Raw Inward" icon={Truck} active={view === 'inward'} onClick={() => setView('inward')} />
              <div className="border-t border-slate-100 dark:border-slate-700 my-2"></div>
              
              <NavBtn label="New Sale" icon={Coins} active={view === 'sales_new'} onClick={() => setView('sales_new')} />
              <NavBtn label="Sales History" icon={History} active={view === 'sales_list'} onClick={() => setView('sales_list')} />

              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                <button onClick={handleLogout} className="w-full text-center p-3 rounded-lg flex items-center justify-center gap-3 bg-red-500 text-white font-bold hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 transition-colors shadow-lg">
                    <LogOut size={20} /> Logout
                </button>
              </div>
           </div>
        </div>
      )}

      <main className="max-w-md mx-auto p-4 pb-24">
        {view === 'dashboard' && user.role === UserRole.OWNER && dashboardStats && (
          <Dashboard stats={dashboardStats} logs={logs} inwardLogs={inwardLogs} sales={dashboardStats.salesHistory || []} />
        )}

        {view === 'inventory' && user.role === UserRole.OWNER && <InventoryView />}
        {view === 'users' && user.role === UserRole.OWNER && <UserManagement currentUser={user} />}
        {view === 'audit' && user.role === UserRole.OWNER && <AuditLogViewer />}
        {view === 'profile' && <ProfileView currentUser={user} />}
        {view === 'export' && user.role === UserRole.OWNER && <ExportView />}

        {view === 'production' && (
          <ProductionForm 
            currentUser={user.displayName} 
            onComplete={() => {
              refreshData(user);
              if (user.role === UserRole.OWNER) setView('dashboard');
              window.scrollTo(0,0);
              alert("Production Log Saved!");
            }} 
          />
        )}

        {view === 'inward' && (
          <InwardForm 
            currentUser={user.displayName} 
            onComplete={() => {
              refreshData(user);
              window.scrollTo(0,0);
              alert("Stock Updated Successfully!");
              if (user.role === UserRole.OWNER) {
                setView('dashboard');
              } else {
                setView('production');
              }
            }} 
          />
        )}

        {view === 'sales_new' && (
          <SalesForm currentUser={user} onComplete={() => {
            refreshData(user);
            setView('sales_list');
            alert("Sale Confirmed & Stock Deducted");
          }} />
        )}

        {view === 'sales_list' && <SalesList currentUser={user} />}

      </main>
    </div>
  );
};

export default App;