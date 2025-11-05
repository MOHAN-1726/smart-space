
import React, { ReactNode } from 'react';
import { RequestStatus } from '../types';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-md dark:shadow-slate-700/50 overflow-hidden ${className}`}>
    {title && <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 px-6 pt-4">{title}</h3>}
    <div className="p-6">{children}</div>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-slate-600 hover:bg-slate-700 focus:ring-slate-500',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

interface BadgeProps {
  status: RequestStatus | string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status }) => {
  const statusClasses = {
    [RequestStatus.APPROVED]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Graded': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Submitted': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    [RequestStatus.PENDING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    [RequestStatus.REJECTED]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  };

  const classes = statusClasses[status] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${classes}`}>
      {status}
    </span>
  );
};

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
  confirmText?: string;
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'success';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  confirmVariant = 'primary',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900 bg-opacity-60 z-50 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
          <div className="mt-4 text-slate-600 dark:text-slate-400">{children}</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  if (!isOpen) return null;

  // Effect to handle Escape key press
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-slate-900 bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close modal"
          >
             <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">{children}</div>
        <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 rounded-b-lg flex justify-end gap-3">
            {footer ? footer : <Button variant="secondary" onClick={onClose}>Close</Button>}
        </div>
      </div>
    </div>
  );
};
