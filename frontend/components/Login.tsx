import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../service';
import { User, Role } from '../types';
import { Button, Card } from './UI';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: Role.STUDENT as string,
    studentId: '', // For parent linking
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (isSignup) {
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }
        if (formData.role === 'PARENT' && !formData.studentId) {
            setError('Student ID is required for Parent registration');
            setLoading(false);
            return;
        }
    }

    const url = isSignup ? '/register' : '/login';

    try {
      const data = await api.post(url, formData);
      if (data.success && data.user) {
        onLoginSuccess(data.user);
        const role = data.user.role;
        const rolePath = role === 'STAFF' ? 'teacher' : role.toLowerCase();
        navigate(`/${rolePath}`);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md w-full p-8 shadow-2xl rounded-3xl border-0 bg-white/80 backdrop-blur-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-100 mb-6 rotate-3">
             <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
             </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-500 mt-1 font-medium">Smart Space Classroom System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-semibold border border-rose-100 animate-shake">
              {error}
            </div>
          )}
          
          {isSignup && (
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Full Name</label>
                <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none"
                required
                />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="name@school.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none"
              required
            />
          </div>

          {isSignup && (
            <>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 tracking-wider">Select Role</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none appearance-none"
                    >
                        <option value="STUDENT">Student</option>
                        <option value="STAFF">Teacher</option>
                        <option value="PARENT">Parent</option>
                        <option value="ADMIN">Administrator</option>
                    </select>
                </div>

                {formData.role === 'PARENT' && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase ml-1 tracking-wider">Student ID to Link</label>
                        <input
                            type="text"
                            name="studentId"
                            placeholder="U12345..."
                            value={formData.studentId}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-indigo-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-indigo-500 transition-all outline-none"
                            required
                        />
                    </div>
                )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm font-medium">
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button 
                    onClick={() => {
                        setIsSignup(!isSignup);
                        setError('');
                    }}
                    className="text-indigo-600 font-bold hover:underline"
                >
                    {isSignup ? 'Sign In' : 'Create Account'}
                </button>
            </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
