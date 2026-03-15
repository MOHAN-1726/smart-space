
import React, { useState } from 'react';
import { Button, Card } from './UI';
import { Role } from '../types';

interface LoginProps {
  onLogin: (email: string, password?: string) => Promise<boolean>;
  onRegister: (name: string, email: string, role: Role, password?: string) => Promise<{ success: boolean; message: string }>;
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
  const [regRole, setRegRole] = useState<Role>(Role.STUDENT);
  const [regError, setRegError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onLogin(loginEmail, loginPassword);
    if (!success) {
      setLoginError('Invalid credentials. Please try again.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onRegister(regName, regEmail, regRole, regPassword);
    if (!result.success) {
      setRegError(result.message);
    }
    // On success, App component will handle login and redirect
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <svg className="w-16 h-16 mx-auto text-green-600 mb-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" /> {/* Placeholder Icon */}
            <path d="M3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm12 4c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm-9 8c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1H6v-1z" />
          </svg>
          <h1 className="text-3xl font-normal text-gray-800">Google Classroom Clone</h1>
          <p className="text-gray-500 mt-2">Manage your classes with ease</p>
        </div>

        <Card className="text-left shadow-lg border-0">
          {view === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
              <div>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Email"
                />
              </div>
              <div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Password"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded shadow-sm">
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regError && <p className="text-red-500 text-sm">{regError}</p>}
              <input
                type="text" value={regName}
                onChange={(e) => setRegName(e.target.value)} required
                className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Full Name"
              />
              <input
                type="email" value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)} required
                className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Email"
              />
              <input
                type="password" value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)} required
                className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Password"
              />
              <select value={regRole} onChange={(e) => setRegRole(e.target.value as Role)}
                className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors bg-white">
                <option value={Role.STUDENT}>Student</option>
                <option value={Role.STAFF}>Teacher</option>
              </select>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded shadow-sm">
                Create Account
              </Button>
            </form>
          )}
        </Card>

        <p className="mt-6 text-sm text-gray-600">
          {view === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => {
              setView(view === 'login' ? 'register' : 'login');
              setLoginError('');
              setRegError('');
            }}
            className="text-blue-600 font-medium hover:underline"
          >
            {view === 'login' ? 'Create account' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
