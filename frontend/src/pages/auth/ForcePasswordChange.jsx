import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore, getHomeRoute } from '../../store/authStore';
import { useToastStore, TOAST_COLORS } from '../../store/toastStore';

const calculateStrength = (password) => {
  let score = 0;
  if (!password) return score;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
};

const getStrengthColor = (score) => {
  if (score <= 2) return 'bg-[#F87171] shadow-[0_0_8px_rgba(248,113,113,0.4)]';
  if (score === 3) return 'bg-[#FBBF24] shadow-[0_0_8px_rgba(251,191,36,0.4)]';
  if (score === 4) return 'bg-[#60A5FA] shadow-[0_0_8px_rgba(96,165,250,0.4)]';
  return 'bg-[#4ADE80] shadow-[0_0_8px_rgba(74,222,128,0.4)]';
};

const getStrengthLabel = (score) => {
  if (score === 0) return '';
  if (score <= 2) return 'Weak';
  if (score === 3) return 'Fair';
  if (score === 4) return 'Good';
  return 'Strong';
};

export default function ForcePasswordChange() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  
  const [localError, setLocalError] = useState('');
  
  const { changePassword, isLoading, checkAuth, user, logout } = useAuthStore();
  const { showToast } = useToastStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (newPassword !== confirmPassword) {
      setLocalError('New passwords do not match');
      return;
    }

    if (newPassword === currentPassword) {
      setLocalError('New password must be different from current password');
      return;
    }

    const score = calculateStrength(newPassword);
    if (score <= 2) {
      setLocalError('Password is too weak. Please use a stronger password.');
      return;
    }

    const result = await changePassword({ currentPassword, newPassword });
    if (result.success) {
      showToast('Password changed successfully', TOAST_COLORS.success);
      // Re-fetch auth state to get the updated requiresPasswordChange flag
      await checkAuth();
      navigate(getHomeRoute(user?.role));
    } else {
      setLocalError(result.message);
    }
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
        </svg>
      </div>

      <div className="w-full max-w-[420px] bg-[#181D2A] border border-[#1F2A40] rounded-2xl p-8 relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            </div>
          </div>
          <h1 className="text-[1.25rem] font-bold text-[#E2E8F0] mb-2 text-center">Action Required</h1>
          <p className="text-[0.875rem] text-[#94A3B8] text-center max-w-[280px]">Please update your password to continue.</p>
        </div>

        {localError && (
          <div className="mb-6 p-3.5 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.3)] rounded-lg flex items-start gap-3" aria-live="assertive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#F87171] shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="text-[13px] text-[#F87171] leading-relaxed">{localError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4 relative">
            <label className={labelCls} htmlFor="currentPassword">Current Password</label>
            <div className="absolute top-[34px] left-[13px] text-[#5A6A85] pointer-events-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            </div>
            <input
              id="currentPassword"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className={clsx(inputCls, "pr-[36px]")}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute top-[34px] right-[13px] text-[#5A6A85] hover:text-[#94A3B8] transition-colors focus:outline-none"
            >
              {showCurrent ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </button>
          </div>

          <div className="mb-4 relative">
            <label className={labelCls} htmlFor="newPassword">New Password</label>
            <div className="absolute top-[34px] left-[13px] text-[#5A6A85] pointer-events-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            </div>
            <input
              id="newPassword"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className={clsx(inputCls, "pr-[36px]")}
              placeholder="••••••••"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute top-[34px] right-[13px] text-[#5A6A85] hover:text-[#94A3B8] transition-colors focus:outline-none"
            >
              {showNew ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              )}
            </button>
            <div className="mt-2 space-y-2 relative px-1">
              <div className="flex gap-1.5 h-1.5 w-full bg-[#131823] rounded-full overflow-hidden border border-[#1F2A40]">
                {[1, 2, 3, 4].map((index) => {
                  const passwordScore = calculateStrength(newPassword);
                  return (
                    <div
                      key={index}
                      className={clsx(
                        'h-full flex-1 rounded-full transition-all duration-300',
                        index <= passwordScore ? getStrengthColor(passwordScore) : 'bg-[#1F2A40]'
                      )}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between items-center text-[10px] font-medium tracking-wide">
                <span className="text-[#94A3B8]">Password Strength</span>
                <span className={clsx(
                  'transition-colors duration-300',
                  (() => {
                      const passwordScore = calculateStrength(newPassword);
                      if (passwordScore <= 2) return 'text-[#F87171]';
                      if (passwordScore === 3) return 'text-[#FBBF24]';
                      if (passwordScore === 4) return 'text-[#60A5FA]';
                      return 'text-[#4ADE80]';
                  })()
                )}>
                  {getStrengthLabel(calculateStrength(newPassword))}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-8 relative">
            <label className={labelCls} htmlFor="confirmPassword">Confirm New Password</label>
            <div className="absolute top-[34px] left-[13px] text-[#5A6A85] pointer-events-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
            </div>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={inputCls}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>

          <div className="flex flex-col gap-3">
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
                'Change Password'
              )}
            </button>
            <button
              type="button"
              onClick={logout}
              disabled={isLoading}
              className="w-full h-[42px] rounded-lg border border-[#ef4444] text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)] text-[13px] font-bold tracking-wide transition-colors flex items-center justify-center disabled:opacity-80"
            >
              Log Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
