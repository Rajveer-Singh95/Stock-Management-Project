'use client';
import { useState, useEffect, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

let toastFn = null;

export function toast(message, type = 'info', duration = 4000) {
  if (toastFn) toastFn(message, type, duration);
}

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastFn = (message, type, duration) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    };
    return () => { toastFn = null; };
  }, []);

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    info: <Info className="w-4 h-4 text-indigo-400" />,
  };

  const styles = {
    success: 'border-emerald-500/30 bg-emerald-500/10',
    error: 'border-rose-500/30 bg-rose-500/10',
    warning: 'border-amber-500/30 bg-amber-500/10',
    info: 'border-indigo-500/30 bg-indigo-500/10',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-xl animate-slide-up min-w-[280px] max-w-sm ${styles[t.type]}`}>
          {icons[t.type]}
          <span className="text-sm text-slate-200 flex-1">{t.message}</span>
          <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            className="text-slate-500 hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
