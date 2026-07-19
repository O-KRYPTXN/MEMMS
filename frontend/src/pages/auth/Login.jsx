import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore, getHomeRoute } from '../../store/authStore';
import { useToastStore, TOAST_COLORS } from '../../store/toastStore';
import Modal, { ModalCancelBtn, ModalPrimaryBtn } from '../../components/ui/Modal';

const DEMO_ACCOUNTS = {
  'admin@memms.local': { role: 'Admin', password: 'asdfasdf' },
  'supervisor@memms.local': { role: 'Supervisor', password: 'asdfasdf' },
  'tech@memms.local': { role: 'Technician', password: 'asdfasdf' },
  'dept@memms.local': { role: 'Department', password: 'asdfasdf' }
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const { login, isLoading, error, clearError } = useAuthStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError?.(); // if we added clearError to store

    const result = await login(email.trim(), password);
    if (result.success) {
      navigate(getHomeRoute(useAuthStore.getState().user.role));
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    setShowForgotModal(false);
    showToast(`Password reset link sent to ${resetEmail}`, TOAST_COLORS.success);
    setResetEmail('');
  };

  const inputCls = "w-full bg-[#131823] border border-[#1F2A40] rounded-lg text-[#F8FAFC] text-[13px] px-[13px] py-[10px] pl-[36px] outline-none focus:border-[#3B82F6] placeholder:text-[#4A5568] transition-colors";
  const labelCls = "block text-[12px] text-[#94A3B8] font-semibold tracking-wide mb-1.5";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] relative overflow-hidden p-4">

      {/* Background SVG Animation */}
      <style>{`
        @keyframes pulse-dash {
          0% { stroke-dashoffset: 1000; }
          100% { stroke-dashoffset: 0; }
        }
        .ekg-line {
          stroke-dasharray: 1000;
          animation: pulse-dash 4s linear infinite;
        }
      `}</style>
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center overflow-hidden" aria-hidden="true">
        <svg className="w-full min-w-[1200px] h-[300px] text-[#3B82F6]" viewBox="0 0 1000 200" fill="none" preserveAspectRatio="none">
          <path className="ekg-line" d="M0 100 L 250 100 L 270 50 L 300 150 L 320 100 L 450 100 L 470 70 L 490 130 L 510 100 L 750 100 L 770 20 L 800 180 L 830 100 L 1000 100" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path className="ekg-line" d="M0 150 L 200 150 L 220 120 L 250 180 L 270 150 L 550 150 L 570 130 L 590 170 L 610 150 L 850 150 L 870 110 L 900 190 L 930 150 L 1000 150" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" strokeOpacity="0.5" style={{ animationDelay: '2s' }} />
          <path className="ekg-line" d="M0 50 L 150 50 L 170 30 L 200 80 L 220 50 L 650 50 L 670 20 L 690 90 L 710 50 L 900 50 L 920 10 L 950 100 L 970 50 L 1000 50" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" strokeOpacity="0.3" style={{ animationDelay: '1s' }} />
        </svg>
      </div>

      <div className="w-full max-w-[420px] bg-[#181D2A] border border-[#1F2A40] rounded-2xl p-8 relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>
            </div>
            <span className="text-[1.375rem] font-bold text-white tracking-tight">MEMMS<span className="text-[#3B82F6]">.</span></span>
          </div>
          <h1 className="text-[1.25rem] font-bold text-[#E2E8F0] mb-2">Staff Sign In</h1>
          <p className="text-[0.875rem] text-[#94A3B8] text-center max-w-[280px]">Enter your credentials to access the portal</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.3)] rounded-lg flex items-start gap-3" aria-live="assertive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#F87171] shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="text-[13px] text-[#F87171] leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4 relative">
            <label className={labelCls} htmlFor="email">Email Address</label>
            <div className="absolute top-[34px] left-[13px] text-[#5A6A85] pointer-events-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputCls}
              placeholder="name@hospital.org"
              required
            />
          </div>

          <div className="mb-5 relative">
            <label className={labelCls} htmlFor="password">Password</label>
            <div className="absolute top-[34px] left-[13px] text-[#5A6A85] pointer-events-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={clsx(inputCls, "pr-[36px]")}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-[34px] right-[13px] text-[#5A6A85] hover:text-[#94A3B8] transition-colors focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mb-8">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative w-4 h-4 rounded border border-[#1F2A40] bg-[#131823] group-hover:border-[#3B82F6] transition-colors flex items-center justify-center overflow-hidden">
                <input
                  type="checkbox"
                  className="absolute opacity-0 w-0 h-0"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                {rememberMe && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 text-[#3B82F6] animate-in zoom-in duration-150">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <span className="text-[13px] text-[#94A3B8] select-none">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-[13px] text-[#3B82F6] font-semibold hover:text-[#60A5FA] transition-colors focus:outline-none"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[42px] rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[13px] font-bold tracking-wide transition-colors flex items-center justify-center gap-2 disabled:opacity-80"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-[#5A6A85] text-[13px]">Don't have an account? </span>
          <Link to="/signup" className="text-[#3B82F6] font-semibold text-[13px] hover:text-[#60A5FA] transition-colors">Create account</Link>
        </div>

        {/* Demo Credentials Box */}
        <div className="mt-8 bg-[#131823] border border-[#1F2A40] rounded-lg p-3 relative overflow-hidden">
          <div className="absolute top-0 start-0 w-1 h-full bg-[#3B82F6]"></div>
          <div className="text-[10px] text-[#5A6A85] font-bold uppercase tracking-wider mb-2 pl-2">Demo Credentials</div>
          <div className="text-[11px] text-[#94A3B8] font-mono leading-relaxed pl-2">
            admin@memms.local / asdfasdf<br />
            supervisor@memms.local / asdfasdf<br />
            tech1@memms.local / asdfasdf<br />
            doc.er@memms.local/ asdfasdf
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title="Reset Password"
        maxWidth="400px"
        footer={
          <>
            <ModalCancelBtn onClick={() => setShowForgotModal(false)} />
            <ModalPrimaryBtn type="submit" form="forgot-password-form" color="#3B82F6">
              Send Link
            </ModalPrimaryBtn>
          </>
        }
      >
        <p className="text-[13px] text-[#94A3B8] mb-4 mt-2">Enter your registered email and we'll send a reset link.</p>
        <form id="forgot-password-form" onSubmit={handleForgotSubmit}>
          <div className="relative">
            <div className="absolute top-[10px] left-[13px] text-[#5A6A85] pointer-events-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            </div>
            <input
              type="email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              className={inputCls}
              placeholder="name@hospital.org"
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
