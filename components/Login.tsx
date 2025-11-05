
import React, { useState } from 'react';
import { Button, Card } from './UI';
import { MOCK_USERS } from '../constants';
import { Role } from '../types';

interface LoginProps {
  onLogin: (email: string) => boolean;
  onRegister: (name: string, email: string, role: Role) => { success: boolean; message: string };
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [view, setView] = useState<'login' | 'register'>('login');
  
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

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(loginEmail);
    if (!success) {
      setLoginError('Invalid credentials. Please try again.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }
    if (regPassword.length < 6) {
        setRegError('Password must be at least 6 characters long.');
        return;
    }
    const result = onRegister(regName, regEmail, regRole);
    if (!result.success) {
      setRegError(result.message);
    }
    // On success, App component will handle login and redirect
  };

  const handleQuickLogin = (email: string) => {
    onLogin(email);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary-700">Student Activity Portal</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {view === 'login' ? 'Sign in to access your dashboard' : 'Create an account to get started'}
            </p>
        </div>
        
        {view === 'login' ? (
          <Card>
              <form onSubmit={handleLoginSubmit}>
                  {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
                  <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                      <input
                          type="email"
                          id="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="you@example.com"
                      />
                  </div>
                  <div className="mb-6">
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                      <input
                          type="password"
                          id="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="••••••••"
                      />
                  </div>
                  <Button type="submit" className="w-full">
                      Sign In
                  </Button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                Don’t have an account?{' '}
                <button onClick={() => { setView('register'); setLoginError(''); }} className="font-semibold text-primary-600 hover:text-primary-500">
                  Register
                </button>
              </p>
          </Card>
        ) : (
          <Card>
              <form onSubmit={handleRegisterSubmit}>
                  {regError && <p className="text-red-500 text-sm mb-4">{regError}</p>}
                  <div className="mb-4">
                      <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                      <input
                          type="text" id="reg-name" value={regName}
                          onChange={(e) => setRegName(e.target.value)} required
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm"
                      />
                  </div>
                   <div className="mb-4">
                      <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                      <input
                          type="email" id="reg-email" value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)} required
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm"
                      />
                  </div>
                  <div className="mb-4">
                      <label htmlFor="reg-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">I am a...</label>
                      <select id="reg-role" value={regRole} onChange={(e) => setRegRole(e.target.value as Role)}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm">
                          <option value={Role.STUDENT}>Student</option>
                          <option value={Role.STAFF}>Staff</option>
                          <option value={Role.PARENT}>Parent</option>
                      </select>
                  </div>
                  <div className="mb-4">
                      <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                      <input
                          type="password" id="reg-password" value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)} required
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm"
                      />
                  </div>
                   <div className="mb-6">
                      <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                      <input
                          type="password" id="reg-confirm-password" value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)} required
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm"
                      />
                  </div>
                  <Button type="submit" className="w-full">
                      Create Account
                  </Button>
              </form>
              <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <button onClick={() => { setView('login'); setRegError(''); }} className="font-semibold text-primary-600 hover:text-primary-500">
                  Sign In
                </button>
              </p>
          </Card>
        )}

        <div className="mt-6">
          <Card title="Quick Logins (Demo)">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => handleQuickLogin('student1@mail.com')}>Login as Student</Button>
              <Button variant="secondary" onClick={() => handleQuickLogin('staff1@mail.com')}>Login as Staff</Button>
              <Button variant="secondary" onClick={() => handleQuickLogin('parent1@mail.com')}>Login as Parent</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
