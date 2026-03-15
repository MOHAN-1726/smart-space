import React from 'react';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, className = '' }) => {
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 ${className}`}>
            {title && <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">{title}</h2>}
            {children}
        </div>
    );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyle = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    let variantStyle = "";
    if (variant === 'primary') {
        variantStyle = "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500";
    } else if (variant === 'secondary') {
        variantStyle = "bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-500 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600";
    } else if (variant === 'danger') {
        variantStyle = "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500";
    } else if (variant === 'success') {
        variantStyle = "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500";
    }

    return (
        <button className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
            {children}
        </button>
    );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    let colorClass = "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
    if (status === 'Pending') colorClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300";
    else if (status === 'Submitted') colorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
    else if (status === 'Graded') colorClass = "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    else if (status === 'Approved') colorClass = "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300";
    else if (status === 'Rejected') colorClass = "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
            {status}
        </span>
    );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
};

export const ConfirmationDialog: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; confirmText?: string; confirmVariant?: 'primary' | 'secondary' | 'danger' | 'success'; children: React.ReactNode }> = ({ isOpen, onClose, onConfirm, title, confirmText = 'Confirm', confirmVariant = 'primary', children }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="mb-6 text-slate-700 dark:text-slate-300">{children}</div>
            <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant={confirmVariant} onClick={onConfirm}>{confirmText}</Button>
            </div>
        </Modal>
    );
};
