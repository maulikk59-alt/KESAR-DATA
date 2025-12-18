import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { THRESHOLDS, ProductionEntry } from '../types';
import { Calculator, AlertTriangle, Send, Lock } from 'lucide-react';

interface ProductionFormProps {
  onComplete: () => void;
  currentUser: string;
}

const BREAKDOWN_REASONS = ['None', 'Power Cut', 'Expeller Jam', 'Belt Broken', 'Motor Fault', 'Heating Issue', 'Other'];
const inputStyles = "w-full p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition";
const timeSelectStyles = "flex-1 min-w-[3.5rem] py-3 px-1 text-center bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm sm:text-base";
const disabledInputStyles = "w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 font-mono";

export const ProductionForm: React.FC<ProductionFormProps> = ({ onComplete, currentUser }) => {
  const [formData, setFormData] = useState({
    shift: 'Day',
    helperName: '',
    startHour: '08',
    startMinute: '00',
    startAmPm: 'AM',
    endHour: '05',
    endMinute: '00',
    endAmPm: 'PM',
    breakdownMinutes: 0,
    breakdownReason: 'None',
    groundnutConsumed: '' as any,
    oilProduced: '' as any,
    cakeProduced: '' as any,
  });

  const [calcs, setCalcs] = useState({
    runtime: 0,
    oilYield: 0,
    cakeYield: 0,
    totalAccounted: 0,
    processLoss: 0,
    oilPerHour: 0
  });

  const [stock, setStock] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentTimestamp, setCurrentTimestamp] = useState(new Date());
  
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const convertTo24Hour = (hourStr: string, minuteStr: string, ampm: string): string => {
    let hour = parseInt(hourStr, 10);
    if (ampm === 'PM' && hour < 12) {
        hour += 12;
    }
    if (ampm === 'AM' && hour === 12) { // Midnight case (12:xx AM -> 00:xx)
        hour = 0;
    }
    return `${hour.toString().padStart(2, '0')}:${minuteStr}`;
  };

  useEffect(() => {
    setStock(StorageService.getStock());
    const timer = setInterval(() => setCurrentTimestamp(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  useEffect(() => {
    const consumed = Number(formData.groundnutConsumed) || 0;
    const oil = Number(formData.oilProduced) || 0;
    const cake = Number(formData.cakeProduced) || 0;
    
    let runtimeMins = 0;
    const startTime24 = convertTo24Hour(formData.startHour, formData.startMinute, formData.startAmPm);
    const endTime24 = convertTo24Hour(formData.endHour, formData.endMinute, formData.endAmPm);

    if (startTime24 && endTime24) {
      const start = new Date(`1970-01-01T${startTime24}:00`);
      const end = new Date(`1970-01-01T${endTime24}:00`);
      let diffMs = end.getTime() - start.getTime();
      if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
      runtimeMins = Math.floor(diffMs / 60000) - Number(formData.breakdownMinutes);
    }

    const oilYield = consumed > 0 ? (oil / consumed) * 100 : 0;
    const cakeYield = consumed > 0 ? (cake / consumed) * 100 : 0;
    const totalAccounted = oilYield + cakeYield;
    const processLoss = consumed > 0 ? 100 - totalAccounted : 0;
    const oilPerHour = runtimeMins > 0 ? (oil / runtimeMins) * 60 : 0;

    setCalcs({ runtime: runtimeMins, oilYield, cakeYield, totalAccounted, processLoss, oilPerHour });

  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const generateWhatsAppLink = (log: ProductionEntry) => {
    const alerts = [];
    if (log.oilYieldPercent < THRESHOLDS.MIN_OIL_YIELD) alerts.push(`⚠️ LOW YIELD: ${log.oilYieldPercent.toFixed(1)}%`);
    if (log.processLossPercent > THRESHOLDS.MAX_PROCESS_LOSS) alerts.push(`⚠️ HIGH LOSS: ${log.processLossPercent.toFixed(1)}%`);
    if (log.breakdownMinutes > THRESHOLDS.MAX_BREAKDOWN_MINS) alerts.push(`⚠️ LONG BREAKDOWN: ${log.breakdownMinutes}m`);

    if (alerts.length === 0) return null;

    const message = `*ALERT: Line-01 Production Issue*\nSupervisor: ${log.supervisorName}\n\n${alerts.join('\n')}\n\nCheck dashboard immediately.`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = StorageService.getCurrentUser();
    if (!user) return;

    if (Number(formData.groundnutConsumed) > stock) {
      setError("Cannot consume more than available stock!");
      return;
    }
    if (calcs.runtime <= 0) {
      setError("Invalid Start/End times or Breakdown duration.");
      return;
    }

    try {
      const startTime24 = convertTo24Hour(formData.startHour, formData.startMinute, formData.startAmPm);
      const endTime24 = convertTo24Hour(formData.endHour, formData.endMinute, formData.endAmPm);

      const entry = StorageService.addProduction(user, {
        lineId: 'Line-01',
        supervisorName: user.displayName,
        helperName: formData.helperName,
        startTime: startTime24,
        endTime: endTime24,
        breakdownMinutes: Number(formData.breakdownMinutes),
        breakdownReason: formData.breakdownReason,
        groundnutConsumed: Number(formData.groundnutConsumed),
        oilProduced: Number(formData.oilProduced),
        cakeProduced: Number(formData.cakeProduced),
        runtimeMinutes: calcs.runtime,
        oilYieldPercent: calcs.oilYield,
        cakeYieldPercent: calcs.cakeYield,
        totalAccountedPercent: calcs.totalAccounted,
        processLossPercent: calcs.processLoss,
        oilPerHour: calcs.oilPerHour,
      });

      const waLink = generateWhatsAppLink(entry);
      if (waLink) {
        window.open(waLink, '_blank');
      }

      onComplete();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isYieldLow = calcs.oilYield > 0 && calcs.oilYield < THRESHOLDS.MIN_OIL_YIELD;
  const isLossHigh = calcs.processLoss > THRESHOLDS.MAX_PROCESS_LOSS;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      
      <div className="bg-blue-600 text-white p-4 rounded-xl shadow-md">
        <h2 className="text-xl font-bold">Line-01 Production Log</h2>
        <div className="flex justify-between mt-2 text-blue-100 text-sm">
          <span>Available Stock:</span>
          <span className="font-mono font-bold text-white text-lg">{stock.toLocaleString()} kg</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 p-4 rounded text-red-700 dark:text-red-300">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Shift Details</h3>
        
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Entry Timestamp</label>
          <input disabled value={formatDateTime(currentTimestamp)} className={disabledInputStyles} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Supervisor</label>
             <input disabled value={currentUser} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-bold text-slate-700 dark:text-slate-200" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Helper (Opt)</label>
            <input type="text" name="helperName" value={formData.helperName} onChange={handleChange} className={inputStyles} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
            <div className="flex gap-1">
              <select name="startHour" value={formData.startHour} onChange={handleChange} className={timeSelectStyles}>
                {hours.map(h => <option key={`sh-${h}`} value={h}>{h}</option>)}
              </select>
              <select name="startMinute" value={formData.startMinute} onChange={handleChange} className={timeSelectStyles}>
                {minutes.map(m => <option key={`sm-${m}`} value={m}>{m}</option>)}
              </select>
              <select name="startAmPm" value={formData.startAmPm} onChange={handleChange} className={timeSelectStyles}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">End Time</label>
            <div className="flex gap-1">
              <select name="endHour" value={formData.endHour} onChange={handleChange} className={timeSelectStyles}>
                {hours.map(h => <option key={`eh-${h}`} value={h}>{h}</option>)}
              </select>
              <select name="endMinute" value={formData.endMinute} onChange={handleChange} className={timeSelectStyles}>
                {minutes.map(m => <option key={`em-${m}`} value={m}>{m}</option>)}
              </select>
              <select name="endAmPm" value={formData.endAmPm} onChange={handleChange} className={timeSelectStyles}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Breakdown (Mins)</label>
             <input required type="number" name="breakdownMinutes" value={formData.breakdownMinutes} onChange={handleChange} className={inputStyles} />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Reason</label>
            <select name="breakdownReason" value={formData.breakdownReason} onChange={handleChange} className={inputStyles}>
              {BREAKDOWN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Production Data</h3>
        
        <div>
          <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Groundnut Consumed (KG)</label>
          <input required type="number" name="groundnutConsumed" value={formData.groundnutConsumed} onChange={handleChange} className="w-full p-4 text-xl font-mono border-2 border-blue-200 dark:border-blue-700 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:bg-slate-700 dark:text-white dark:focus:ring-blue-900/50 transition-all" placeholder="0"/>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Oil Produced (KG)</label>
            <input required type="number" name="oilProduced" value={formData.oilProduced} onChange={handleChange} className={inputStyles} placeholder="0" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Cake Produced (KG)</label>
            <input required type="number" name="cakeProduced" value={formData.cakeProduced} onChange={handleChange} className={inputStyles} placeholder="0" />
          </div>
        </div>
      </div>

      <div className="bg-slate-800 dark:bg-slate-900 p-5 rounded-xl space-y-4">
        <div className="flex items-center space-x-2 text-slate-400 mb-2">
          <Lock size={16} />
          <span className="text-xs uppercase font-bold tracking-wider">Auto-Calculated Metrics</span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-slate-400">Oil Yield</p>
            <p className={`text-2xl font-bold ${isYieldLow ? 'text-red-400' : 'text-green-400'}`}>
              {calcs.oilYield.toFixed(2)}%
            </p>
            {isYieldLow && <span className="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded">Low</span>}
          </div>
          <div>
            <p className="text-xs text-slate-400">Process Loss</p>
            <p className={`text-2xl font-bold ${isLossHigh ? 'text-red-400' : 'text-emerald-400'}`}>
              {calcs.processLoss.toFixed(2)}%
            </p>
            {isLossHigh && <span className="text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded">High</span>}
          </div>
          <div>
            <p className="text-xs text-slate-400">Runtime</p>
            <p className="text-xl font-mono text-slate-100">{Math.floor(calcs.runtime / 60)}h {calcs.runtime % 60}m</p>
          </div>
          <div>
             <p className="text-xs text-slate-400">Throughput</p>
             <p className="text-xl font-mono text-slate-100">{calcs.oilPerHour.toFixed(1)} <span className="text-sm">kg/hr</span></p>
          </div>
        </div>
      </div>

      <button type="submit" disabled={calcs.oilYield === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 text-lg">
        <Calculator size={24} />
        <span>Submit Production Log</span>
      </button>

      <p className="text-center text-xs text-slate-400">
        Submitting will immediately deduct stock and lock this entry.
      </p>
    </form>
  );
};