import React, { useState, useEffect, useId, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  GraduationCap,
  Send,
  X,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ExternalLink,
  KeyRound,
} from "lucide-react";
import NativeModalDialog from "./payments/NativeModalDialog";
import userApi from "../../api/userApi";

const isValidHttpUrl = (value = "") => /^https?:\/\/\S+$/i.test(String(value || "").trim());

export default function SendLmsInviteModal({
  open,
  user,
  onClose,
  onInviteSent,
}) {
  const titleId = useId();
  const fieldPrefix = useId();

  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [toEmail, setToEmail] = useState("");
  const [ccEmail, setCcEmail] = useState("");
  const [lmsLoginUrl, setLmsLoginUrl] = useState("https://www.inxyme.com/login");
  const [courseNames, setCourseNames] = useState("");
  const [autoApproveLms, setAutoApproveLms] = useState(true);

  const [subject, setSubject] = useState("");
  const [writtenMessage, setWrittenMessage] = useState("");

  const subjectEditedRef = useRef(false);
  const messageEditedRef = useRef(false);
  const initializedRef = useRef(false);

  const loadInvitePreview = useCallback(
    async (userId, overrides = {}, { preserveEdits = false, silent = false } = {}) => {
      try {
        if (!silent) setLoadingPreview(true);
        const res = await userApi.getLmsInvitePreview(userId, overrides);
        if (res?.success && res.preview) {
          const p = res.preview;
          if (!preserveEdits) {
            setToEmail(p.to || "");
            setLmsLoginUrl(p.lmsLoginUrl || "https://www.inxyme.com/login");
            setCourseNames(p.courseSummary || "");
          }
          if (!preserveEdits || !subjectEditedRef.current) {
            setSubject(p.subject || "");
          }
          if (!preserveEdits || !messageEditedRef.current) {
            setWrittenMessage(p.writtenMessage || "");
          }
          initializedRef.current = true;
        }
      } catch (err) {
        console.error("Failed to load LMS invite email preview:", err);
        if (!silent) toast.error("Failed to prepare LMS invite email preview");
      } finally {
        if (!silent) setLoadingPreview(false);
      }
    },
    []
  );

  useEffect(() => {
    if (open && user?._id) {
      initializedRef.current = false;
      subjectEditedRef.current = false;
      messageEditedRef.current = false;
      setCcEmail("");
      setAutoApproveLms(!user.isApproved);
      loadInvitePreview(user._id);
    }
  }, [open, user?._id, user?.isApproved, loadInvitePreview]);

  useEffect(() => {
    if (!open || !user?._id || !initializedRef.current) return;
    if (subjectEditedRef.current && messageEditedRef.current) return;

    const timer = setTimeout(() => {
      loadInvitePreview(
        user._id,
        { lmsLoginUrl, courseNames },
        { preserveEdits: true, silent: true }
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [open, user?._id, lmsLoginUrl, courseNames, loadInvitePreview]);

  const handleRegenerateText = () => {
    if (!user?._id) return;
    subjectEditedRef.current = false;
    messageEditedRef.current = false;
    loadInvitePreview(
      user._id,
      { lmsLoginUrl, courseNames },
      { preserveEdits: true }
    );
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!user?._id) return;

    const trimmedTo = toEmail.trim();
    if (!trimmedTo || !/\S+@\S+\.\S+/.test(trimmedTo)) {
      toast.error("Please enter a valid recipient email address");
      return;
    }

    const trimmedUrl = lmsLoginUrl.trim();
    if (!isValidHttpUrl(trimmedUrl)) {
      toast.error("Please enter a valid LMS login URL (starting with http:// or https://)");
      return;
    }

    if (!subject.trim() || !writtenMessage.trim()) {
      toast.error("Email subject and message are required");
      return;
    }

    try {
      setIsSending(true);
      const res = await userApi.sendLmsInvite(user._id, {
        to: trimmedTo,
        cc: ccEmail.trim(),
        subject: subject.trim(),
        writtenMessage: writtenMessage.trim(),
        lmsLoginUrl: trimmedUrl,
        courseNames: courseNames.trim(),
        autoApproveLms,
      });

      if (res?.success) {
        toast.success(res.message || "LMS invite email sent successfully!");
        if (onInviteSent) onInviteSent(res.data);
        onClose();
      } else {
        throw new Error(res?.message || "Failed to send LMS invite email");
      }
    } catch (err) {
      console.error("Failed to send LMS invite email:", err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to send LMS invite email"
      );
    } finally {
      setIsSending(false);
    }
  };

  const safeLoginUrl = isValidHttpUrl(lmsLoginUrl)
    ? lmsLoginUrl.trim()
    : "https://www.inxyme.com/login";

  return (
    <NativeModalDialog
      open={open}
      onClose={() => {
        if (!isSending) onClose();
      }}
      titleId={titleId}
      closedBy={isSending ? "none" : "any"}
      maxWidthClass="max-w-6xl"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 px-6 py-4 text-white shrink-0 border-b-2 border-[#f47c26]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/20">
            <GraduationCap className="h-5 w-5 text-blue-100" />
          </div>
          <div className="min-w-0">
            <h1 id={titleId} className="text-lg font-bold leading-tight truncate">
              Send LMS Invite Mail
            </h1>
            <p className="text-xs text-blue-200 truncate mt-0.5">
              Preview &amp; send LMS welcome instructions to{" "}
              <span className="font-semibold text-white">
                {user?.fullname || user?.email}
              </span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isSending}
          aria-label="Close Send LMS Invite Mail dialog"
          className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Body */}
      <form
        method="post"
        onSubmit={handleSend}
        className="flex-1 overflow-y-auto bg-gray-50 flex flex-col"
      >
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          {/* LEFT PANE: Email Configuration & Written Message */}
          <div className="lg:col-span-6 p-5 flex flex-col gap-3.5 bg-white">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-bold text-gray-900">
                  LMS Invite Details &amp; Written Mail
                </h2>
              </div>
              <button
                type="button"
                onClick={handleRegenerateText}
                disabled={loadingPreview}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                <RotateCcw className={`h-3 w-3 ${loadingPreview ? "animate-spin" : ""}`} />
                Refresh Default Text
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={`${fieldPrefix}-to`}
                  className="block text-xs font-semibold text-gray-700 mb-1"
                >
                  To (Student Email) <span className="text-red-500">*</span>
                </label>
                <input
                  id={`${fieldPrefix}-to`}
                  name="to"
                  type="email"
                  required
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor={`${fieldPrefix}-cc`}
                  className="block text-xs font-semibold text-gray-700 mb-1"
                >
                  CC <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id={`${fieldPrefix}-cc`}
                  name="cc"
                  type="text"
                  value={ccEmail}
                  onChange={(e) => setCcEmail(e.target.value)}
                  placeholder="support@inxyme.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={`${fieldPrefix}-lmsUrl`}
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                LMS Portal Login URL <span className="text-red-500">*</span>
              </label>
              <input
                id={`${fieldPrefix}-lmsUrl`}
                name="lmsLoginUrl"
                type="url"
                required
                value={lmsLoginUrl}
                onChange={(e) => setLmsLoginUrl(e.target.value)}
                placeholder="https://www.inxyme.com/login"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor={`${fieldPrefix}-courses`}
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Course(s) Highlighted <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id={`${fieldPrefix}-courses`}
                name="courseNames"
                type="text"
                value={courseNames}
                onChange={(e) => setCourseNames(e.target.value)}
                placeholder="e.g. SAP FICO, Full Stack Development"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor={`${fieldPrefix}-subject`}
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Email Subject <span className="text-red-500">*</span>
              </label>
              <input
                id={`${fieldPrefix}-subject`}
                name="subject"
                type="text"
                required
                value={subject}
                onChange={(e) => {
                  subjectEditedRef.current = true;
                  setSubject(e.target.value);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor={`${fieldPrefix}-message`}
                className="block text-xs font-semibold text-gray-700 mb-1"
              >
                Written Mail Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id={`${fieldPrefix}-message`}
                name="writtenMessage"
                rows={8}
                required
                value={writtenMessage}
                onChange={(e) => {
                  messageEditedRef.current = true;
                  setWrittenMessage(e.target.value);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 leading-relaxed focus:border-blue-600 focus:outline-none"
              />
            </div>

            {!user?.isApproved && (
              <label
                htmlFor={`${fieldPrefix}-autoApprove`}
                className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs font-medium text-emerald-900 cursor-pointer"
              >
                <input
                  id={`${fieldPrefix}-autoApprove`}
                  type="checkbox"
                  checked={autoApproveLms}
                  onChange={(e) => setAutoApproveLms(e.target.checked)}
                  className="rounded border-emerald-300 accent-emerald-600"
                />
                <span>
                  Automatically set student&apos;s <strong>LMS Status = Approved</strong> when sending this invite
                </span>
              </label>
            )}
          </div>

          {/* RIGHT PANE: Live Branded Student Email Preview */}
          <div className="lg:col-span-6 p-5 flex flex-col gap-3 bg-gray-50/70">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-gray-900">
                Live Student Email Preview
              </h2>
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                LMS ACCESS ACTIVE
              </span>
            </div>

            {loadingPreview ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-xs">Preparing LMS welcome preview...</span>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs space-y-1">
                  <div>
                    <span className="font-semibold text-gray-500">To: </span>
                    <span className="font-semibold text-gray-900">{toEmail}</span>
                    {ccEmail && <span className="text-gray-500 ml-2">• CC: {ccEmail}</span>}
                  </div>
                  <div className="truncate">
                    <span className="font-semibold text-gray-500">Subject: </span>
                    <span className="font-semibold text-gray-900">{subject}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs max-h-[520px] overflow-y-auto">
                  <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-5 py-4 text-white flex items-center justify-between border-b-2 border-[#f47c26]">
                    <div className="flex items-center gap-3">
                      <div className="bg-white rounded-lg px-2 py-1 shadow-xs shrink-0">
                        <img
                          src="/inxyme-logo.png"
                          alt="Inxyme"
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                      <div>
                        <div className="text-base font-extrabold tracking-wide">Inxyme</div>
                        <div className="text-[11px] text-blue-200">
                          Learning Management System (LMS) Welcome
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-800 border border-emerald-200">
                      LMS ACCESS ACTIVE
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="text-xs sm:text-[13px] leading-relaxed text-gray-800 whitespace-pre-line">
                      {writtenMessage}
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1.5">
                        Your LMS Access &amp; Login Credentials
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Student Name</span>
                        <span className="font-semibold text-slate-900 text-right">
                          {user?.fullname || "Student"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Registered Login Email</span>
                        <span className="font-bold text-slate-900 text-right">
                          {user?.email}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">Password</span>
                        <span className="text-slate-700 text-right">
                          Same password used at Inxyme registration
                        </span>
                      </div>
                      {courseNames.trim() && (
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-500 shrink-0">Active Course(s)</span>
                          <span className="font-semibold text-emerald-700 text-right">
                            {courseNames.trim()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 shrink-0">LMS Portal</span>
                        <span className="font-semibold text-blue-700 truncate text-right">
                          {safeLoginUrl}
                        </span>
                      </div>
                    </div>

                    <div className="text-center pt-1">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#0068D9] px-5 py-2.5 text-xs font-bold text-white shadow-xs border-b-2 border-[#f47c26]">
                        Log In &amp; Explore Your Course
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-200 bg-white px-6 py-4 shrink-0">
          <div className="text-xs text-gray-600">
            {user?.lmsInviteSent ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Previously invited ({user.lmsInviteSentCount || 1}x) on{" "}
                {user.lmsInviteSentAt
                  ? new Date(user.lmsInviteSentAt).toLocaleString("en-IN")
                  : "earlier"}{" "}
                to {user.lmsInviteLastSentTo || user.email}
              </span>
            ) : (
              <span>
                Ready to send LMS onboarding invite to{" "}
                <strong>{toEmail || user?.email}</strong>.
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || loadingPreview}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-700/20 hover:bg-blue-800 disabled:opacity-50 transition-all"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending LMS Invite...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {user?.lmsInviteSent ? "Resend LMS Invite Mail" : "Send LMS Invite Mail"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </NativeModalDialog>
  );
}
