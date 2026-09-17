import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import userApi from "../../api/userApi";
import { Shield, KeyRound, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const { login, isAuthenticated, setUserFromTokens } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const {
    register: registerOTP,
    handleSubmit: handleOTPSubmit,
    formState: { errors: otpErrors },
  } = useForm();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, from, navigate]);

  const onSubmit = async (formData) => {
    try {
      setIsLoading(true);
      const loginResponse = await login(formData.email, formData.password);

      if (loginResponse?.requiresOTP) {
        setShowOTP(true);
        setAdminEmail(loginResponse.email);
        toast.success("OTP sent to your email for admin verification");
        return;
      }
    } catch (error) {
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const onOTPSubmit = async (formData) => {
    try {
      setIsVerifyingOTP(true);
      const response = await userApi.verifyAdminOTP(adminEmail, formData.otp);

      if (response.success) {
        setUserFromTokens(response.token, response.refreshToken, response.user);
        toast.success("Admin login verified successfully!");
        navigate(from, { replace: true });
      }
    } catch (error) {
      toast.error(error.message || "OTP verification failed. Please try again.");
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4 shadow-lg shadow-indigo-950">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Eklabya Admin</h1>
          <p className="text-slate-400 text-sm mt-1">
            Secure administration and management portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {!showOTP ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    placeholder="admin@eklabya.com"
                    {...register("email", { required: "Email is required" })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-rose-400 text-xs mt-1.5">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    {...register("password", { required: "Password is required" })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                {errors.password && (
                  <p className="text-rose-400 text-xs mt-1.5">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-950 mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit(onOTPSubmit)} className="space-y-5">
              <div className="text-center pb-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Enter the verification code sent to <br />
                  <strong className="text-slate-200">{adminEmail}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  {...registerOTP("otp", {
                    required: "OTP is required",
                    minLength: { value: 6, message: "OTP must be 6 digits" },
                  })}
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                {otpErrors.otp && (
                  <p className="text-rose-400 text-xs mt-1.5 text-center">
                    {otpErrors.otp.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifyingOTP}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950"
              >
                {isVerifyingOTP ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowOTP(false)}
                className="w-full text-xs text-slate-400 hover:text-slate-200 text-center py-1 transition-colors"
              >
                ← Back to Login
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-8">
          © {new Date().getFullYear()} Eklabya Education Platform. Confidential & Restricted.
        </p>
      </div>
    </div>
  );
}
