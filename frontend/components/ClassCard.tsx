import React, { useState, useRef, useEffect } from 'react';
import { Class } from '../types';

interface ClassCardProps {
    classData: Class;
    onClick: (classId: string) => void;
    onDelete?: (classId: string) => void;
    ownerName?: string;
    ownerPhoto?: string;
}

const ClassCard: React.FC<ClassCardProps> = ({ classData, onClick, onDelete, ownerName, ownerPhoto }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Theme map to colors/images
    const getThemeStyle = (theme: string) => {
        // Simplified theme mapping
        const themes: Record<string, string> = {
            'theme-blue': 'bg-blue-600',
            'theme-green': 'bg-green-600',
            'theme-red': 'bg-red-600',
            'theme-dark': 'bg-slate-800',
        };
        return themes[theme] || 'bg-blue-600';
    };

    return (
        <div
            onClick={() => onClick(classData.id)}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col h-72 w-72"
        >
            {/* Banner */}
            <div className={`${getThemeStyle(classData.theme)} h-24 p-4 text-white relative`}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-medium hover:underline truncate">{classData.name}</h2>
                        <p className="text-sm opacity-90 truncate">{classData.section}</p>
                    </div>
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen(!menuOpen);
                            }}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg py-1 border border-gray-100 z-10">
                                {onDelete && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpen(false);
                                            onDelete(classData.id);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        Delete
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setMenuOpen(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Copy Link
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-4 left-4">
                    <p className="text-sm font-medium opacity-90">{ownerName}</p>
                </div>

                {ownerPhoto && (
                    <div className="absolute -bottom-8 right-4">
                        <img src={ownerPhoto} alt={ownerName} className="w-16 h-16 rounded-full border-4 border-white" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 pt-10 flex-1 flex flex-col">
                <div className="flex-1">
                    {/* Placeholder for "Due Soon" */}
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-3 flex justify-end gap-2 bg-white">
                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                </button>
            </div>
        </div>
    );
};

export default ClassCard;
