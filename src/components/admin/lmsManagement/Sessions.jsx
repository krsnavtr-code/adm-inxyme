import React, { useState, useEffect } from "react";
import {
  createSession,
  getSessionsBySprint,
  updateSession,
  deleteSession,
  reorderSessions,
} from "../../../api/sessionApi";
import {
  createTask,
  getTasksBySession,
  updateTask,
} from "../../../api/taskApi";
import TaskForm from "./TaskForm";

const Sessions = ({ sprintId, sprint, onClose }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSessionModalVisible, setIsSessionModalVisible] = useState(false);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Form States
  const [sessionFormData, setSessionFormData] = useState({
    name: "",
    description: "",
    duration: 60,
    content: "",
    videoUrl: "",
    zoomMeetingLink: "",
    isActive: true,
    resources: [],
  });

  const handleTaskSubmit = async (taskData) => {
    try {
      setTasksLoading(true);
      if (taskData._id) {
        await updateTask(taskData._id, taskData);
      } else {
        await createTask({
          ...taskData,
          sessionId: currentSessionId,
        });
      }
      setIsTaskModalVisible(false);
      fetchSessions(); // Refresh to update task count
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    if (sprintId) {
      fetchSessions();
    }
  }, [sprintId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await getSessionsBySprint(sprintId);
      if (response?.data?.sessions) {
        // Sort sessions by order
        const sorted = [...response.data.sessions].sort(
          (a, b) => (a.order || 0) - (b.order || 0),
        );
        setSessions(sorted);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const openSessionModal = (session = null) => {
    setEditingSession(session);
    if (session) {
      setSessionFormData({
        name: session.name,
        description: session.description || "",
        duration: session.duration,
        content: session.content || "",
        videoUrl: session.videoUrl || "",
        zoomMeetingLink: session.zoomMeetingLink || "",
        isActive: session.isActive,
        resources: session.resources || [],
      });
    } else {
      setSessionFormData({
        name: "",
        description: "",
        duration: 60,
        content: "",
        videoUrl: "",
        zoomMeetingLink: "",
        isActive: true,
        resources: [],
      });
    }
    setIsSessionModalVisible(true);
  };

  const handleSessionSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...sessionFormData, sprintId };
      if (editingSession) {
        await updateSession(editingSession._id, data);
      } else {
        // Find next order
        const nextOrder =
          sessions.length > 0
            ? Math.max(...sessions.map((s) => s.order || 0)) + 1
            : 1;
        await createSession({ ...data, order: nextOrder });
      }
      setIsSessionModalVisible(false);
      fetchSessions();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      try {
        setLoading(true);
        await deleteSession(id);
        fetchSessions();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const moveSession = async (id, direction) => {
    const currentIndex = sessions.findIndex((s) => s._id === id);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sessions.length) return;

    const newSessions = [...sessions];
    [newSessions[currentIndex], newSessions[newIndex]] = [
      newSessions[newIndex],
      newSessions[currentIndex],
    ];
    setSessions(newSessions);

    try {
      await reorderSessions(
        sprintId,
        newSessions.map((s, idx) => ({ id: s._id, order: idx + 1 })),
      );
    } catch (error) {
      console.error("Error reordering sessions:", error);
      fetchSessions();
    }
  };

  // Resources form field management
  const addResourceField = () => {
    setSessionFormData((prev) => ({
      ...prev,
      resources: [...prev.resources, { title: "", url: "", type: "document" }],
    }));
  };

  const removeResourceField = (idx) => {
    setSessionFormData((prev) => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== idx),
    }));
  };

  const updateResourceField = (idx, field, value) => {
    const updated = [...sessionFormData.resources];
    updated[idx] = { ...updated[idx], [field]: value };
    setSessionFormData((prev) => ({ ...prev, resources: updated }));
  };

  // Metrics
  const totalSessionsCount = sessions.length;
  const activeSessionsCount = sessions.filter((s) => s.isActive).length;
  const totalDurationMin = sessions.reduce(
    (acc, s) => acc + (s.duration || 0),
    0,
  );
  const totalDurationFormatted =
    totalDurationMin >= 60
      ? `${Math.floor(totalDurationMin / 60)}h ${totalDurationMin % 60}m`
      : `${totalDurationMin} mins`;
  const liveMeetingsCount = sessions.filter((s) => s.zoomMeetingLink).length;

  return (
    <div className="bg-white text-slate-800 rounded-3xl border border-slate-200 shadow-xl overflow-hidden transition-all">
      {/* Header Banner */}
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-wider mb-2">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Sequence Manager
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Sprint Sessions
          </h2>
          <p className="text-sm font-semibold text-slate-400 mt-1 max-w-xl leading-relaxed">
            {sprint?.name
              ? `Configure and order chronological classroom sessions and tasks for "${sprint.name}"`
              : "Manage timelines, resources, and live webinar endpoints for this sprint."}
          </p>
        </div>

        <button
          onClick={() => openSessionModal()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
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
              strokeWidth="2.5"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Session
        </button>
      </div>

      {/* Session Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-slate-100 bg-white">
        <div className="p-5 border-r border-b lg:border-b-0 border-slate-100 flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Total Sessions
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">
            {totalSessionsCount}
          </p>
        </div>
        <div className="p-5 border-r border-b lg:border-b-0 border-slate-100 flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Active Modules
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">
            {activeSessionsCount}
          </p>
        </div>
        <div className="p-5 border-r border-slate-100 flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Accumulated Duration
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">
            {totalDurationFormatted}
          </p>
        </div>
        <div className="p-5 flex flex-col justify-center">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Live Classes
          </span>
          <p className="text-xl font-black text-slate-900 mt-1">
            {liveMeetingsCount}
          </p>
        </div>
      </div>

      {/* Timeline List Representation */}
      <div className="p-8 bg-white">
        {loading && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-pulse">
            <svg
              className="w-12 h-12 mb-4 animate-spin text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15.89M21 21v-5h-.581"
              />
            </svg>
            <span className="font-bold tracking-wider uppercase text-xs">
              Fetching Sessions...
            </span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 italic font-medium">
            No sessions drafted for this sprint yet. Use "Add Session" to build
            the chronological timeline.
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 ml-6 pl-10 space-y-8 py-2">
            {sessions.map((s, idx) => (
              <div
                key={s._id}
                className="relative animate-in fade-in slide-in-from-left-4 duration-300"
              >
                {/* Timeline Circle and Sequence Indicator */}
                <div className="absolute -left-[61px] top-1.5 flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border-4 border-white shadow-md flex items-center justify-center font-black text-sm text-white">
                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </div>

                  {/* Reordering Controls right below circle */}
                  <div className="flex bg-white border border-slate-100 rounded-lg shadow-sm p-0.5">
                    <button
                      onClick={() => moveSession(s._id, "up")}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded disabled:opacity-20 transition-all"
                      disabled={idx === 0}
                      title="Move Up"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveSession(s._id, "down")}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded disabled:opacity-20 transition-all"
                      disabled={idx === sessions.length - 1}
                      title="Move Down"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Session Card Detail */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col justify-between relative group">
                  <div>
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {s.duration} mins
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            s.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-100"
                          }`}
                        >
                          {s.isActive ? "Active" : "Hidden"}
                        </span>
                      </div>

                      {/* Card Controls */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => openSessionModal(s)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl border border-transparent hover:border-amber-100 transition-all"
                          title="Edit Session Settings"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-all"
                          title="Delete Session"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-black text-slate-900 leading-tight">
                      {s.name}
                    </h3>

                    {/* Description */}
                    {s.description && (
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        {s.description}
                      </p>
                    )}

                    {/* Links row */}
                    {(s.zoomMeetingLink || s.videoUrl) && (
                      <div className="flex flex-wrap gap-2.5 mt-4">
                        {s.zoomMeetingLink && (
                          <a
                            href={s.zoomMeetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100/50 rounded-xl text-xs font-bold transition-all"
                          >
                            <svg
                              className="w-4 h-4 text-indigo-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            <span>Zoom Meeting Link</span>
                          </a>
                        )}
                        {s.videoUrl && (
                          <a
                            href={s.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100/50 rounded-xl text-xs font-bold transition-all"
                          >
                            <svg
                              className="w-4 h-4 text-rose-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>Recorded Playback URL</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Resources attached preview */}
                    {s.resources && s.resources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-50">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                          Attached Resources ({s.resources.length})
                        </span>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {s.resources.map((res, rIdx) => (
                            <a
                              key={res._id || rIdx}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600 hover:text-blue-600 rounded-lg hover:bg-blue-50/40 hover:border-blue-100 transition-all"
                            >
                              <svg
                                className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <span>{res.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tasks footer block */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">
                      Total Tasks Assigned: {s.tasks?.length || 0}
                    </span>
                    <button
                      onClick={() => {
                        setCurrentSessionId(s._id);
                        setIsTaskModalVisible(true);
                      }}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-black uppercase tracking-wider rounded-xl shadow-sm transition-all"
                    >
                      Configure Tasks ({s.tasks?.length || 0})
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session Add/Edit Modal */}
      {isSessionModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <form onSubmit={handleSessionSubmit}>
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {editingSession ? "Edit" : "Create"} Session
                </h2>
                <button
                  type="button"
                  onClick={() => setIsSessionModalVisible(false)}
                  className="hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                >
                  <svg
                    className="w-6 h-6 text-slate-400 hover:text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Scrollable Fields */}
              <div className="p-8 space-y-5 max-h-[70vh] overflow-y-auto text-left">
                {/* Session Name */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                    Session Title
                  </label>
                  <input
                    required
                    value={sessionFormData.name}
                    onChange={(e) =>
                      setSessionFormData({
                        ...sessionFormData,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-400"
                    placeholder="e.g. Introduction to React Hooks"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={sessionFormData.duration}
                      onChange={(e) =>
                        setSessionFormData({
                          ...sessionFormData,
                          duration: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                      Visibility Status
                    </label>
                    <select
                      value={sessionFormData.isActive}
                      onChange={(e) =>
                        setSessionFormData({
                          ...sessionFormData,
                          isActive: e.target.value === "true",
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                    >
                      <option value="true">Active / Published</option>
                      <option value="false">Hidden / Draft</option>
                    </select>
                  </div>
                </div>

                {/* Video & Meeting Links */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                    Video & Meeting Links
                  </label>
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 font-black text-[10px] uppercase bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                        Zoom
                      </span>
                      <input
                        value={sessionFormData.zoomMeetingLink}
                        onChange={(e) =>
                          setSessionFormData({
                            ...sessionFormData,
                            zoomMeetingLink: e.target.value,
                          })
                        }
                        className="w-full pl-20 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium"
                        placeholder="Zoom Conference Link"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 font-black text-[10px] uppercase bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                        Record
                      </span>
                      <input
                        value={sessionFormData.videoUrl}
                        onChange={(e) =>
                          setSessionFormData({
                            ...sessionFormData,
                            videoUrl: e.target.value,
                          })
                        }
                        className="w-full pl-20 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium"
                        placeholder="Recorded Playback URL"
                      />
                    </div>
                  </div>
                </div>

                {/* Content (Markdown) */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2">
                    Content (Markdown Supported)
                  </label>
                  <textarea
                    rows="4"
                    value={sessionFormData.content}
                    onChange={(e) =>
                      setSessionFormData({
                        ...sessionFormData,
                        content: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium resize-none"
                    placeholder="Provide curriculum description, slides, markdown documentation..."
                  />
                </div>

                {/* Session Resources Section (Previously fully missing from the UI!) */}
                <div className="border-t border-slate-100 pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                      Session Resources ({sessionFormData.resources.length})
                    </label>
                    <button
                      type="button"
                      onClick={addResourceField}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span>Add Resource</span>
                    </button>
                  </div>

                  {sessionFormData.resources.length === 0 ? (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200 text-center">
                      No resources attached yet. Add PDFs, slide decks, or extra
                      links!
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {sessionFormData.resources.map((resource, idx) => (
                        <div
                          key={idx}
                          className="flex gap-2 items-center bg-slate-50 border border-slate-200 p-3 rounded-2xl relative group"
                        >
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              required
                              value={resource.title}
                              onChange={(e) =>
                                updateResourceField(
                                  idx,
                                  "title",
                                  e.target.value,
                                )
                              }
                              placeholder="Resource Title"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-xs font-medium"
                            />
                            <input
                              type="url"
                              required
                              value={resource.url}
                              onChange={(e) =>
                                updateResourceField(idx, "url", e.target.value)
                              }
                              placeholder="URL Link (https://...)"
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-xs font-medium"
                            />
                            <select
                              value={resource.type}
                              onChange={(e) =>
                                updateResourceField(idx, "type", e.target.value)
                              }
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-600 cursor-pointer"
                            >
                              <option value="document">Document / PDF</option>
                              <option value="video">Video</option>
                              <option value="link">Web Link</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeResourceField(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Remove resource"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSessionModalVisible(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  {editingSession ? "Update Session" : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* External Task Component */}
      <TaskForm
        visible={isTaskModalVisible}
        sessionId={currentSessionId}
        onSave={handleTaskSubmit}
        onCancel={() => setIsTaskModalVisible(false)}
      />
    </div>
  );
};

export default Sessions;
