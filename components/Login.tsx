import React, { useState } from 'react';
import { Button, Card } from './UI';
import { Role } from '../types';
import { 
  useLoginMutation, 
  useRegisterMutation, 
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
} from '../src/services/api';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../src/store/authSlice';

const Login: React.FC = () => {
  type View = 'login' | 'register' | 'forgotPassword' | 'resetPassword' | 'verifyEmail';
  const [view, setView] = useState<View>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<Role>(Role.STUDENT);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');


  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Reset Password state
  const [resetOtp, setResetOtp] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');

  // Verification state
  const [verifyOtp, setVerifyOtp] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [emailForVerification, setEmailForVerification] = useState<string | null>(null);


  const dispatch = useDispatch();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [forgotPassword, { isLoading: isSendingOtp }] = useForgotPasswordMutation();
  const [resetPasswordMutation, { isLoading: isResettingPassword }] = useResetPasswordMutation();
  const [verifyEmail, { isLoading: isVerifyingEmail }] = useVerifyEmailMutation();
  const [resendVerification, { isLoading: isResendingOtp }] = useResendVerificationMutation();

  const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-500 dark:focus:ring-offset-slate-900";


  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const { user, accessToken, refreshToken } = await login({ email: loginEmail, password: loginPassword }).unwrap();
      dispatch(loginSuccess({ user, accessToken, refreshToken }));
    } catch (err: any) {
      if (err.data?.message === 'Email not verified') {
        setEmailForVerification(loginEmail);
        setView('verifyEmail');
      } else {
        setLoginError(err.data?.message || 'An unexpected error occurred');
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }
    if (regPassword.length < 6) {
        setRegError('Password must be at least 6 characters long.');
        return;
    }
    try {
        await register({ name: regName, email: regEmail, role: regRole, password: regPassword }).unwrap();
        setRegSuccess('Registration successful! Please check your email for a verification OTP.');
        setEmailForVerification(regEmail);
        setTimeout(() => setView('verifyEmail'), 1000);
    } catch (err: any) {
        setRegError(err.data?.message || 'An error occurred during registration.');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    try {
        await forgotPassword({ email: forgotEmail }).unwrap();
        setForgotSuccess(`A password reset OTP has been sent to ${forgotEmail}.`);
        setTimeout(() => setView('resetPassword'), 1000);
    } catch(err: any) {
        setForgotError(err.data?.message || 'Could not send OTP. Please try again.');
    }
  };
  
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (!resetOtp) {
        setResetError('Please enter the OTP.');
        return;
    }
     if (resetPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }
    if (resetPassword.length < 6) {
        setResetError('Password must be at least 6 characters long.');
        return;
    }

    try {
        await resetPasswordMutation({ email: forgotEmail, otp: resetOtp, password: resetPassword }).unwrap();
        alert('Password has been reset successfully! Please log in with your new password.');
        setView('login');
        setForgotEmail('');
    } catch(err: any) {
        setResetError(err.data?.message || 'Could not reset password. Please try again.');
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');
    if (!emailForVerification) {
        setVerifyError('No email to verify. Please start the process again.');
        return;
    }
    try {
        const { user, accessToken, refreshToken } = await verifyEmail({ email: emailForVerification, otp: verifyOtp }).unwrap();
        dispatch(loginSuccess({ user, accessToken, refreshToken }));
        setVerifySuccess('Email verified successfully!');
    } catch(err: any) {
        setVerifyError(err.data?.message || 'Invalid OTP or an error occurred.');
    }
  };

  const handleResendClick = async () => {
    if (!emailForVerification) {
        setVerifyError('No email to resend OTP to. Please start the process again.');
        return;
    }
    setVerifySuccess('');
    setVerifyError('');
    try {
        await resendVerification({ email: emailForVerification }).unwrap();
        setVerifySuccess('A new OTP has been sent.');
    } catch(err: any) {
        setVerifyError(err.data?.message || 'Could not resend OTP.');
    }
    setTimeout(() => setVerifySuccess(''), 5000);
  };


  const handleQuickLogin = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('password123');
  }

  const renderContent = () => {
    switch (view) {
      case 'login':
        return (
          <Card key="login" className="!bg-white/80 dark:!bg-slate-800/60 !rounded-2xl">
              <form onSubmit={handleLoginSubmit}>
                  {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
                  <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                      <input type="email" id="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className={inputClasses} placeholder="you@example.com"/>
                  </div>
                  <div className="mb-4">
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                      <input type="password" id="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className={inputClasses} placeholder="••••••••"/>
                  </div>
                   <div className="text-right mb-6">
                        <button type="button" onClick={() => setView('forgotPassword')} className="text-sm font-semibold text-blue-600 hover:text-blue-500">
                            Forgot password?
                        </button>
                    </div>
                  <Button type="submit" className="w-full" disabled={isLoggingIn}>{isLoggingIn ? 'Signing In...' : 'Sign In'}</Button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                Don’t have an account?{' '}'''
                <button onClick={() => { setView('register'); setLoginError(''); }} className="font-semibold text-blue-600 hover:text-blue-500">
                  Register
                </button>
              </p>
          </Card>
        );
      case 'register':
        return (
          <Card key="register" className="!bg-white/80 dark:!bg-slate-800/60 !rounded-2xl">
              <form onSubmit={handleRegisterSubmit}>
                  {regError && <p className="text-red-500 text-sm mb-4">{regError}</p>}
                  {regSuccess && <p className="text-green-500 text-sm mb-4">{regSuccess}</p>}
                  <div className="mb-4">
                      <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                      <input type="text" id="reg-name" value={regName} onChange={(e) => setRegName(e.target.value)} required className={inputClasses}/>
                  </div>
                   <div className="mb-4">
                      <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                      <input type="email" id="reg-email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required className={inputClasses}/>
                  </div>
                  <div className="mb-4">
                      <label htmlFor="reg-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">I am a...</label>
                      <select id="reg-role" value={regRole} onChange={(e) => setRegRole(e.target.value as Role)} className={inputClasses}>
                          <option value={Role.STUDENT}>Student</option>
                          <option value={Role.STAFF}>Staff</option>
                          <option value={Role.PARENT}>Parent</option>
                      </select>
                  </div>
                  <div className="mb-4">
                      <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                      <input type="password" id="reg-password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required className={inputClasses}/>
                  </div>
                   <div className="mb-6">
                      <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                      <input type="password" id="reg-confirm-password" value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} required className={inputClasses}/>
                  </div>
                  <Button type="submit" className="w-full" disabled={isRegistering}>{isRegistering ? 'Creating Account...' : 'Create Account'}</Button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}'''
                <button onClick={() => { setView('login'); setRegError(''); }} className="font-semibold text-blue-600 hover:text-blue-500">
                  Sign In
                </button>
              </p>
          </Card>
        );
      case 'forgotPassword':
        return (
          <Card key="forgot" className="!bg-white/80 dark:!bg-slate-800/60 !rounded-2xl">
            <form onSubmit={handleForgotPasswordSubmit}>
                {forgotError && <p className="text-red-500 text-sm mb-4">{forgotError}</p>}
                {forgotSuccess && <p className="text-green-500 text-sm mb-4">{forgotSuccess}</p>}
                <div className="mb-4">
                    <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Enter your email</label>
                    <input type="email" id="forgot-email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required className={inputClasses}/>
                </div>
                <Button type="submit" className="w-full" disabled={isSendingOtp}>{isSendingOtp ? 'Sending...' : 'Send Reset OTP'}</Button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              Remembered your password?{' '}'''
              <button onClick={() => { setView('login'); setForgotError(''); }} className="font-semibold text-blue-600 hover:text-blue-500">
                Sign In
              </button>
            </p>
          </Card>
        );
      case 'resetPassword':
        return (
          <Card key="reset" className="!bg-white/80 dark:!bg-slate-800/60 !rounded-2xl">
            <form onSubmit={handleResetPasswordSubmit}>
                {resetError && <p className="text-red-500 text-sm mb-4">{resetError}</p>}
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Resetting password for <strong>{forgotEmail}</strong>.</p>
                <div className="mb-4">
                    <label htmlFor="reset-otp" className="block text-sm font-medium text-slate-700 dark:text-slate-300">OTP</label>
                    <input type="text" id="reset-otp" value={resetOtp} onChange={(e) => setResetOtp(e.target.value)} required className={inputClasses}/>
                </div>
                 <div className="mb-4">
                    <label htmlFor="reset-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                    <input type="password" id="reset-password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required className={inputClasses}/>
                </div>
                 <div className="mb-6">
                    <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                    <input type="password" id="reset-confirm-password" value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} required className={inputClasses}/>
                </div>
                <Button type="submit" className="w-full" disabled={isResettingPassword}>{isResettingPassword ? 'Resetting...' : 'Reset Password'}</Button>
            </form>
          </Card>
        );
       case 'verifyEmail':
        return (
          <Card key="verify" className="!bg-white/80 dark:!bg-slate-800/60 !rounded-2xl">
            <form onSubmit={handleVerifySubmit}>
              <p className="text-sm text-center text-slate-600 dark:text-slate-400 mb-4">
                  We've sent a verification OTP to <strong>{emailForVerification}</strong>. Please enter it below.
              </p>
              {verifyError && <p className="text-red-500 text-sm mb-4">{verifyError}</p>}
              {verifySuccess && <p className="text-green-500 text-sm mb-4">{verifySuccess}</p>}
              <div className="mb-4">
                  <label htmlFor="verify-otp" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Verification OTP</label>
                  <input type="text" id="verify-otp" value={verifyOtp} onChange={(e) => setVerifyOtp(e.target.value)} required className={inputClasses}/>
              </div>
              <Button type="submit" className="w-full" disabled={isVerifyingEmail}>{isVerifyingEmail ? 'Verifying...' : 'Verify and Sign In'}</Button>
            </form>
            <div className="mt-4 text-center">
                <button onClick={handleResendClick} disabled={isResendingOtp} className="text-sm font-semibold text-blue-600 hover:text-blue-500 disabled:opacity-50">
                    {isResendingOtp ? 'Resending...' : "Didn't get an OTP? Resend."}
                </button>
            </div>
          </Card>
        );
    }
  };
  
  const getTitle = () => {
    switch(view) {
        case 'login': return 'Sign in to access your dashboard';
        case 'register': return 'Create an account to get started';
        case 'forgotPassword': return 'Reset your password';
        case 'resetPassword': return 'Create a new password';
        case 'verifyEmail': return 'Verify Your Email Address';
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-transparent p-4">
      <div className="max-w-md w-full animate-slideInUp">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-500">Student Activity Portal</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">{getTitle()}</p>
        </div>
        
        {renderContent()}

        {view === 'login' && <div className="mt-6">
          <Card className="animate-slideInUp !bg-white/80 dark:!bg-slate-800/60 !rounded-2xl" title="Quick Logins (Demo)">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => handleQuickLogin('student1@mail.com')}>Login as Student</Button>
              <Button variant="secondary" onClick={() => handleQuickLogin('staff1@mail.com')}>Login as Staff</Button>
              <Button variant="secondary" onClick={() => handleQuickLogin('parent1@mail.com')}>Login as Parent</Button>
            </div>
          </Card>
        </div>}
      </div>
    </div>
  );
};

export default Login;
