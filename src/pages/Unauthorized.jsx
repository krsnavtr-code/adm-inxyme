import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="text-center p-8 max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Access Denied
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          You do not have administrative permission to access this section. Please contact your Super Administrator.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-950"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
