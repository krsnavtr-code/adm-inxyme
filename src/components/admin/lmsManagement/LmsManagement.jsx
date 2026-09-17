import React from "react";
import { Link } from "react-router-dom";

// Standardized Icon Component to reduce boilerplate
const AdminIcon = ({ children, bgColor, textColor, ringColor }) => (
  <div
    className={`rounded-2xl p-3 ${bgColor} ${textColor} ${ringColor} ring-1 transition-all duration-300 group-hover:scale-110 shadow-sm`}
  >
    {children}
  </div>
);

const ManagementCard = ({ to, title, desc, icon, theme }) => {
  // Map themes to specific Tailwind classes for reliability
  const themes = {
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      ring: "ring-indigo-100",
      hover: "group-hover:border-indigo-300",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      ring: "ring-emerald-100",
      hover: "group-hover:border-emerald-300",
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      ring: "ring-blue-100",
      hover: "group-hover:border-blue-300",
    },
  };

  const style = themes[theme] || themes.indigo;

  return (
    <Link
      to={to}
      className={`group relative rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 ${style.hover}`}
    >
      <div className="flex items-start gap-5">
        <AdminIcon
          bgColor={style.bg}
          textColor={style.text}
          ringColor={style.ring}
        >
          {icon}
        </AdminIcon>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800 transition-colors group-hover:text-blue-600">
            {title}
          </h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">{desc}</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
          Manage Section
        </span>
        <svg
          className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-all transform group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </div>
    </Link>
  );
};

const LmsManagement = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 transition-colors">
      {/* Page Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            Admin Control Center
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-800">
            LMS Management
          </h1>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            Design learning paths, configure sprints, and manage career
            listings. Jump into specific modules below to update content.
          </p>
        </div>

        <Link
          to="/smart-board/dashboard"
          className="inline-flex items-center gap-3 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:scale-105 transition-all active:scale-95"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          Preview Learner Mode
        </Link>
      </div>

      {/* Main Grid */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Core Administration
          </h2>
          <div className="h-px flex-1 bg-slate-100"></div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ManagementCard
            to="/admin/lms/create-sprint"
            title="Sprint Architecture"
            desc="Construct curriculum sprints, define daily sessions, and assign specific learner tasks."
            theme="indigo"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
            }
          />

          <ManagementCard
            to="/admin/lms/assessment"
            title="Assesment Lab"
            desc="Design quiz banks, interactive assessments, and final exams for course certification."
            theme="emerald"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            }
          />

          <ManagementCard
            to="/admin/lms/career"
            title="Career Portal"
            desc="Publish job openings, manage internships, and connect learners with recruitment partners."
            theme="blue"
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            }
          />
        </div>
      </section>
    </div>
  );
};

export default LmsManagement;
