import React, { ReactNode } from 'react';
import { RequestStatus, User } from '../types';
import { UserIcon } from './Icons';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, ...props }) => (
  <div className={`glass-card rounded-2xl overflow-hidden hover-lift ${className}`} {...props}>
    {title && <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 px-6 pt-4">{title}</h3>}
    <div className="p-6">{children}</div>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', size = 'md', ...props }) => {
  const baseClasses = 'rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200 ease-out transform hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0';
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 focus:ring-primary-500 text-white shadow-md shadow-primary-500/30',
    secondary: 'bg-gradient-to-r from-accent-500 to-accent-400 hover:from-accent-600 hover:to-accent-500 focus:ring-accent-400 text-white shadow-md shadow-accent-500/30',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 focus:ring-red-500 text-white shadow-md shadow-red-500/30',
    success: 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 focus:ring-emerald-500 text-white shadow-md shadow-emerald-500/30',
  };

  const sizeClasses = {
    md: 'px-4 py-2',
    sm: 'px-3 py-1.5 text-sm',
  };

  return (
    <button className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

interface BadgeProps {
  status: RequestStatus | string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status }) => {
  const statusClasses: { [key: string]: string } = {
    [RequestStatus.APPROVED]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 ring-1 ring-emerald-500/20',
    'Graded': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 ring-1 ring-emerald-500/20',
    'Submitted': 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 ring-1 ring-sky-500/20',
    [RequestStatus.PENDING]: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 ring-1 ring-amber-500/20',
    [RequestStatus.REJECTED]: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 ring-1 ring-rose-500/20',
  };

  const classes = statusClasses[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 ring-1 ring-slate-500/20';

  return (
    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${classes}`}>
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
  confirmDisabled?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  confirmVariant = 'primary',
  confirmDisabled = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="glass-card rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <div className="mt-4 text-slate-600 dark:text-slate-400">{children}</div>
        </div>
        <div className="bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm px-6 py-4 rounded-b-2xl flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={confirmDisabled}>
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
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all animate-scaleIn custom-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">{children}</div>
        <div className="bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm px-6 py-4 rounded-b-2xl flex justify-end gap-3">
          {footer ? footer : <Button variant="secondary" onClick={onClose}>Close</Button>}
        </div>
      </div>
    </div>
  );
};

interface ProfilePictureProps {
  user?: Partial<User>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ProfilePicture: React.FC<ProfilePictureProps> = ({ user, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-32 h-32',
  };
  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-16 h-16',
  };

  if (user?.profilePhotoUrl) {
    return (
      <img
        src={user.profilePhotoUrl}
        alt={user.name ?? 'Profile Picture'}
        className={`rounded-full object-cover ring-2 ring-primary-500/20 ${sizeClasses[size]} ${className}`}
      />
    );
  }

  return (
    <div className={`rounded-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-accent-400 ${sizeClasses[size]} ${className}`}>
      <UserIcon className={`${iconSizeClasses[size]} text-white`} />
    </div>
  );
}