import React from 'react';
import { Search, Bell, Moon, Sun, ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-10 flex items-center justify-between px-8">
      {/* Search Bar */}
      <div className="flex items-center gap-3 w-96 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 focus-within:border-emerald-500 transition-colors">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search courses, users, analytics..."
          className="bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Super Admin Mode</span>
        </div>

        <button
          title="Notifications"
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors relative"
        >
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-slate-950"></span>
        </button>
      </div>
    </header>
  );
}
