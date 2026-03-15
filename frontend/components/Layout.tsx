import React, { useState } from 'react';
import { User, Class } from '../types';

interface LayoutProps {
    user: User;
    title?: string;
    onLogout: () => void;
    children: React.ReactNode;
    classes?: Class[];
}

const Layout: React.FC<LayoutProps> = ({ user, title = 'Classroom', onLogout, children, classes = [] }) => {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Top Bar */}
            <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 fixed w-full z-50 top-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="text-xl font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <span className="font-bold tracking-tight">{title}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                        title="Add Class"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>

                    <div className="relative" ref={userMenuRef}>
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded-full border border-transparent hover:border-gray-200 focus:outline-none"
                        >
                            {user.photoUrl ? (
                                <img src={user.photoUrl} alt={user.name} className="w-8 h-8 rounded-full" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-medium">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 border border-gray-100 z-50 animate-fade-in-down">
                                <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
                                    <p className="font-medium text-gray-900">{user.name}</p>
                                    <p className="text-gray-500 text-xs truncate mt-0.5">{user.email}</p>
                                </div>
                                <button
                                    onClick={onLogout}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 pt-16">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
