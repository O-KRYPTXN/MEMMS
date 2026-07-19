import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '../../store/authStore';

import { useQuery } from '@tanstack/react-query';
import { getDepartmentOptions } from '../../api/departmentsService';

const ROLES = [
  { id: 'Supervisor', label: 'Supervisor', icon: '🏥' },
  { id: 'Technician', label: 'Technician', icon: '🔧' },

  { id: 'Department Supervisor', label: 'Department Supervisor', icon: '🩺' }
];

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

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const { signup, isLoading, error: storeError, clearError } = useAuthStore();
  const [localError, setLocalError] = useState(null);

  const { data: deptResponse, isLoading: isLoadingDepts } = useQuery({
    queryKey: ['departmentOptions'],
    queryFn: getDepartmentOptions,
  });

  const activeDepartments = deptResponse?.data || [];

  // We use localError for step 1 validation, and storeError for API errors
  const error = localError || storeError;

  const setError = (msg) => {
    setLocalError(msg);
    clearError?.();
  };
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', confirmPassword: '',
    role: '', department: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const validateStep1 = () => {
    if (!formData.role) {
      setError('Please select a role.');
      return false;
    }
    if (formData.role === 'Department Supervisor' && !formData.department) {
      setError('Please select a department.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('Please provide your first and last name.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please provide a valid email address.');
      return false;
    }
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Please provide a valid Egyptian phone number (e.g. 01012345678).');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleNextStep1 = () => {
    if (validateStep1()) setStep(2);
  };

  const handleNextStep2 = () => {
    if (validateStep2()) setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;

    setError(null);
    const result = await signup(formData);

    if (result.success) {
      setStep('success');
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
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center overflow-hidden">
        <svg className="w-full min-w-[1200px] h-[300px] text-[#3B82F6]" viewBox="0 0 1000 200" fill="none" preserveAspectRatio="none">
          <path className="ekg-line" d="M0 100 L 250 100 L 270 50 L 300 150 L 320 100 L 450 100 L 470 70 L 490 130 L 510 100 L 750 100 L 770 20 L 800 180 L 830 100 L 1000 100" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path className="ekg-line" d="M0 150 L 200 150 L 220 120 L 250 180 L 270 150 L 550 150 L 570 130 L 590 170 L 610 150 L 850 150 L 870 110 L 900 190 L 930 150 L 1000 150" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" strokeOpacity="0.5" style={{ animationDelay: '2s' }} />
        </svg>
      </div>

      <div className="w-full max-w-[480px] bg-[#181D2A] border border-[#1F2A40] rounded-2xl p-8 relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {step !== 'success' && (
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>
                </div>
                <span className="text-[1.375rem] font-bold text-white tracking-tight">MEMMS<span className="text-[#3B82F6]">.</span></span>
              </div>
              <h1 className="text-[1.25rem] font-bold text-[#E2E8F0] mb-2">Create Account</h1>
              <p className="text-[0.875rem] text-[#94A3B8] text-center max-w-[320px]">Fill in your details — your request will be reviewed by an Admin</p>
            </div>

            <div className="flex gap-1.5 mb-6">
              {[1, 2, 3].map(s => (
                <div key={s} className={clsx(
                  "h-1.5 rounded-full flex-1 transition-all duration-300",
                  step > s ? "bg-[#3B82F6]" : step === s ? "bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]" : "bg-[#1F2A40]"
                )} />
              ))}
            </div>

            {error && (
              <div className="mb-6 p-3.5 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.3)] rounded-lg flex items-start gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#F87171] shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span className="text-[13px] text-[#F87171] leading-relaxed">{error}</span>
              </div>
            )}
          </>
        )}

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-[11px] font-bold text-[#5A6A85] tracking-wider mb-5">STEP 1 OF 2 — ROLE & DEPARTMENT</div>
            <label className={labelCls}>Requested Role</label>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {ROLES.map(role => (
                <div
                  key={role.id}
                  onClick={() => { setFormData(prev => ({ ...prev, role: role.id })); setError(null); }}
                  className={clsx(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200",
                    formData.role === role.id
                      ? "border-[#3B82F6] bg-[rgba(59,114,246,0.1)] shadow-[0_0_0_1px_rgba(59,114,246,0.5)]"
                      : "border-[#1F2A40] bg-transparent hover:border-[#3B82F6] hover:bg-[rgba(59,114,246,0.06)]"
                  )}
                >
                  <div className="text-xl">{role.icon}</div>
                  <div className="text-[13px] font-semibold text-[#E2E8F0]">{role.label}</div>
                </div>
              ))}
            </div>
            {formData.role === 'Department Supervisor' && (
              <div className="mb-8">
                <label className={labelCls}>Primary Department</label>
                <select name="department" value={formData.department} onChange={handleChange} className={clsx(inputCls, "pl-[13px]")} disabled={isLoadingDepts}>
                  <option value="">{isLoadingDepts ? 'Loading departments...' : 'Select Department...'}</option>
                  {activeDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
            <button onClick={handleNextStep1} className="w-full h-[42px] rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[13px] font-bold tracking-wide transition-colors flex items-center justify-center gap-2">
              Next — Personal Info
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[14px] h-[14px]"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-[11px] font-bold text-[#5A6A85] tracking-wider mb-5">STEP 2 OF 2 — PERSONAL INFORMATION</div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <label className={labelCls}>First Name</label>
                <div className="absolute top-[34px] left-[13px] text-[#5A6A85]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                </div>
                <input name="firstName" value={formData.firstName} onChange={handleChange} className={inputCls} placeholder="First name" />
              </div>
              <div className="relative">
                <label className={labelCls}>Last Name</label>
                <div className="absolute top-[34px] left-[13px] text-[#5A6A85]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                </div>
                <input name="lastName" value={formData.lastName} onChange={handleChange} className={inputCls} placeholder="Last name" />
              </div>
            </div>
            <div className="mb-4 relative">
              <label className={labelCls}>Work Email</label>
              <div className="absolute top-[34px] left-[13px] text-[#5A6A85]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              </div>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputCls} placeholder="name@hospital.com" />
            </div>
            <div className="mb-8 relative">
              <label className={labelCls}>Phone Number</label>
              <div className="absolute top-[34px] left-[13px] text-[#5A6A85]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.48-4.18-7.076-7.076l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
              </div>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputCls} placeholder="e.g. 01012345678" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="w-[100px] h-[42px] rounded-lg border border-[#1F2A40] text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B] text-[13px] font-bold tracking-wide transition-colors">
                ← Back
              </button>
              <button onClick={handleNextStep2} className="flex-1 h-[42px] rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[13px] font-bold tracking-wide transition-colors flex items-center justify-center gap-2">
                Next — Security
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[14px] h-[14px]"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-[11px] font-bold text-[#5A6A85] tracking-wider mb-5">STEP 3 OF 3 — SECURITY</div>
            <div className="mb-4 relative">
              <label className={labelCls}>Password</label>
              <div className="absolute top-[34px] left-[13px] text-[#5A6A85]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
              </div>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className={inputCls} placeholder="••••••••" />
              
              <div className="mt-2.5">
                <div className="flex gap-1.5 h-1.5 w-full">
                  {[1, 2, 3, 4, 5].map(level => {
                    const score = calculateStrength(formData.password);
                    return (
                      <div key={level} className={clsx(
                        "flex-1 rounded-full transition-all duration-300",
                        score >= level ? getStrengthColor(score) : "bg-[#1F2A40]"
                      )} />
                    );
                  })}
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-[11px] text-[#5A6A85]">Use 8+ chars, mix letters, numbers & symbols</span>
                  <span className={clsx("text-[11px] font-bold transition-all duration-200", formData.password ? "text-[#E2E8F0]" : "text-transparent")}>
                    {getStrengthLabel(calculateStrength(formData.password))}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mb-8 relative">
              <label className={labelCls}>Confirm Password</label>
              <div className="absolute top-[34px] left-[13px] text-[#5A6A85]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
              </div>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={inputCls} placeholder="••••••••" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="w-[100px] h-[42px] rounded-lg border border-[#1F2A40] text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E293B] text-[13px] font-bold tracking-wide transition-colors">
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={isLoading} className="flex-1 h-[42px] rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[13px] font-bold tracking-wide transition-colors flex items-center justify-center gap-2 disabled:opacity-80">
                {isLoading ? (
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>Submit Request <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[14px] h-[14px]"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg></>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-500 py-6">
            <div className="w-[72px] h-[72px] rounded-full bg-[rgba(34,197,94,0.1)] flex items-center justify-center mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-10 h-10 text-[#22C55E]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-[1.5rem] font-bold text-[#E2E8F0] mb-3">Request Submitted!</h2>
            <p className="text-[#94A3B8] text-[0.875rem] leading-relaxed mb-8 max-w-[340px]">
              Your registration request has been submitted and is awaiting administrator approval. You will be able to log in once your account is approved.
            </p>
            <button onClick={() => navigate('/login')} className="w-full h-[42px] rounded-lg bg-[#1A2235] hover:bg-[#1E293B] border border-[#1F2A40] text-[#E2E8F0] text-[13px] font-bold tracking-wide transition-colors">
              Back to Sign In
            </button>
          </div>
        )}

        {step !== 'success' && (
          <div className="mt-6 text-center">
            <span className="text-[#5A6A85] text-[13px]">Already have an account? </span>
            <Link to="/login" className="text-[#3B82F6] font-semibold text-[13px] hover:text-[#60A5FA] transition-colors">Sign In</Link>
          </div>
        )}
      </div>
    </div>
  );
}
