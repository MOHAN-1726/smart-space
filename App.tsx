import React, { useState, useCallback, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { User, Role } from './types';
import { MOCK_USERS } from './constants';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>('light');
  const [emailForVerification, setEmailForVerification] = useState<string | null>(null);
  const [verificationOtp, setVerificationOtp] = useState<string | null>(null);

  useEffect(() => {
    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    // Check for system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(prefersDark ? 'dark' : 'light');
    }

    // Simulate checking for a logged-in user session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleLogin = useCallback((email: string, password: string): { success: boolean; message: string; verificationRequired?: boolean; } => {
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        if (user.isVerified === false) {
            const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
            setVerificationOtp(newOtp);
            setEmailForVerification(email);
            console.log(`Verification required. Simulated OTP for ${email}: ${newOtp}`);
            return { success: false, verificationRequired: true, message: 'Account is not verified. An OTP has been sent.' };
        }
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        return { success: true, message: 'Login successful' };
    }
    return { success: false, message: 'Invalid credentials. Please try again.' };
  }, [users]);
  
  const handleRegister = useCallback((name: string, email: string, role: Role, password: string): { success: boolean; message: string } => {
    if (users.some(u => u.email === email)) {
        return { success: false, message: 'An account with this email already exists.' };
    }

    const newUser: User = {
        id: `U${Date.now()}`,
        name,
        email,
        role,
        password,
        isVerified: false, // Start as not verified
        classIds: [],
        ...(role === Role.STUDENT && { rollNo: `S${String(Date.now()).slice(-4)}`, department: 'Unassigned', year: 1 }),
        ...(role === Role.STAFF && { staffId: `T${String(Date.now()).slice(-4)}`, designation: 'Instructor' }),
        ...(role === Role.PARENT && { studentId: undefined }), // Cannot link on registration yet
    };

    setUsers(prev => [...prev, newUser]);
    
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationOtp(newOtp);
    setEmailForVerification(email);
    console.log(`Registration successful. Simulated OTP for ${email}: ${newOtp}`);

    return { success: true, message: 'Registration successful! Please check your email for a verification OTP.' };
  }, [users]);


  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }, []);
  
  const handleUpdateUser = useCallback((updatedUser: User) => {
    setUsers(prevUsers => {
      const newUsers = prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
      // Also update the current user if they are the one being updated
      if (currentUser && currentUser.id === updatedUser.id) {
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      return newUsers;
    });
  }, [currentUser]);

  const checkUserExists = useCallback((email: string): boolean => {
    return users.some(u => u.email === email);
  }, [users]);

  const handlePasswordReset = useCallback((email: string, newPassword: string): boolean => {
    let userFound = false;
    setUsers(prevUsers => prevUsers.map(u => {
      if (u.email === email) {
        userFound = true;
        return { ...u, password: newPassword };
      }
      return u;
    }));
    return userFound;
  }, []);

  const handleVerifyAndLogin = useCallback((otp: string): { success: boolean; message: string } => {
    if (!emailForVerification || !verificationOtp) {
        return { success: false, message: 'Verification process not initiated.' };
    }

    if (otp === verificationOtp) {
        let verifiedUser: User | null = null;
        setUsers(prevUsers => prevUsers.map(u => {
            if (u.email === emailForVerification) {
                verifiedUser = { ...u, isVerified: true };
                return verifiedUser;
            }
            return u;
        }));

        if (verifiedUser) {
            setCurrentUser(verifiedUser);
            localStorage.setItem('currentUser', JSON.stringify(verifiedUser));
            setEmailForVerification(null);
            setVerificationOtp(null);
            return { success: true, message: 'Email verified successfully!' };
        }
        return { success: false, message: 'Could not find user to verify.' };
    }

    return { success: false, message: 'Invalid OTP. Please try again.' };
  }, [emailForVerification, verificationOtp, users]);

  const handleResendOtp = useCallback(() => {
    if (emailForVerification) {
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setVerificationOtp(newOtp);
        console.log(`Resent simulated OTP for ${emailForVerification}: ${newOtp}`);
        return { success: true, message: 'A new OTP has been sent.' };
    }
    return { success: false, message: 'No email found to resend OTP to.' };
  }, [emailForVerification]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50 dark:bg-slate-950">
        <div className="text-xl font-semibold text-slate-700 dark:text-slate-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {theme === 'dark' && <div className="aurora-bg" />}
      {currentUser ? (
        <Dashboard 
          user={currentUser} 
          onLogout={handleLogout} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          updateUser={handleUpdateUser} 
          allUsers={users}
          onUpdateAllUsers={setUsers}
        />
      ) : (
        <Login 
          onLogin={handleLogin} 
          onRegister={handleRegister} 
          onCheckUser={checkUserExists} 
          onPasswordReset={handlePasswordReset} 
          onVerifyAndLogin={handleVerifyAndLogin}
          onResendOtp={handleResendOtp}
          verificationEmail={emailForVerification}
        />
      )}
    </div>
  );
};

export default App;