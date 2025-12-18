import React, { useState } from 'react';
import { StorageService } from '../services/storageService';
import { FileDown, FileSpreadsheet, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export const ExportView: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const exportAllData = () => {
    setIsExporting(true);
    const user = StorageService.getCurrentUser();
    if (!user) return;

    try {
      // 1. Fetch all data streams
      const production = StorageService.getProductionLogs();
      const inward = StorageService.getInwardLogs();
      const sales = StorageService.getSales(user);
      const inventory = StorageService.getLedger();
      const adjustments = StorageService.getAdjustments();
      const users = StorageService.getUsers();
      const audit = StorageService.getAuditLogs();

      // 2. Create workbook
      const wb = XLSX.utils.book_new();

      // Helper to add sheet
      const addSheet = (data: any[], name: string) => {
        if (data.length === 0) {
          const ws = XLSX.utils.json_to_sheet([{ Info: "No data available in this module" }]);
          XLSX.utils.book_append_sheet(wb, ws, name);
          return;
        }
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, name);
      };

      // 3. Populate Sheets
      addSheet(production, "Production Logs");
      addSheet(inward, "Raw Material Inward");
      addSheet(sales, "Sales & Dispatches");
      addSheet(inventory, "Inventory Ledger");
      addSheet(adjustments, "Stock Adjustments");
      addSheet(users, "System Users");
      addSheet(audit, "System Audit Log");

      // 4. Generate and Save File
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `KESAR_DATA_LOG_${dateStr}.xlsx`;
      
      XLSX.writeFile(wb, fileName);

      // 5. Log activity
      StorageService.logAudit(user.id, user.displayName, 'LOGIN', `Full data export triggered: ${fileName}`);
      
      setLastExport(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to generate Excel file. Please try again.");
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <FileSpreadsheet size={28} /> KESAR DATA CENTER
          </h2>
          <p className="text-blue-200 text-sm mt-2 opacity-90">
            Secure, centralized export for all production and financial records.
          </p>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <FileDown size={120} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-sm text-center">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Download size={40} />
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Generate Full Report</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-xs mx-auto">
          This will generate a multi-sheet Excel file containing all historical records from this device.
        </p>

        <button 
          onClick={exportAllData}
          disabled={isExporting}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 ${isExporting ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {isExporting ? (
            <>Generating XLSX...</>
          ) : (
            <>
              <FileDown size={22} /> Download KESAR DATA
            </>
          )}
        </button>

        {lastExport && (
          <div className="mt-6 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-fade-in">
            <CheckCircle2 size={16} /> Exported successfully at {lastExport}
          </div>
        )}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl border border-amber-100 dark:border-amber-800 flex gap-4 items-start">
        <ShieldCheck className="text-amber-600 shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm uppercase tracking-wide">Security Notice</h4>
          <p className="text-amber-700 dark:text-amber-400/80 text-xs mt-1 leading-relaxed">
            Exports contain sensitive operational and financial data. Ensure the generated files are stored securely or shared only via encrypted channels.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {[
          "Production History & Yields",
          "Raw Material Inward Records",
          "Sales & Dispatch Ledger",
          "Inventory Movements",
          "Supervisor Logs",
          "System Audit Trail"
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
             <div className="h-2 w-2 rounded-full bg-blue-500"></div>
             <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item}</span>
             <span className="ml-auto text-[10px] uppercase font-bold text-slate-400">Included</span>
          </div>
        ))}
      </div>
    </div>
  );
};