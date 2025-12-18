import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { AuditLog as IAuditLog } from '../types';
import { History } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<IAuditLog[]>([]);

  useEffect(() => {
    setLogs(StorageService.getAuditLogs());
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 dark:bg-slate-900 text-slate-200 p-4 rounded-xl flex items-center gap-3">
        <History />
        <div>
          <h2 className="font-bold text-white">System Audit Logs</h2>
          <p className="text-xs text-slate-400">Security & Operational Events</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase sticky top-0">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Action</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-mono">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="p-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{log.action}</td>
                  <td className="p-3 text-blue-600 dark:text-blue-400">{log.actorName}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 break-words max-w-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};