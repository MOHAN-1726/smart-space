import React from "react";

/* ============================= */
/* Icon Props */
/* ============================= */

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number; // pixel size override (optional)
}

/* ============================= */
/* Helpers */
/* ============================= */

const getIconStyle = (size?: number): React.CSSProperties | undefined =>
  size ? { width: size, height: size } : undefined;

const getIconClass = (className?: string) =>
  className ? `icon ${className}` : "icon";

/* ============================= */
/* Base SVG */
/* ============================= */

const BaseSvg = ({
  size,
  className,
  children,
  ...props
}: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    aria-hidden="true"
    className={getIconClass(className)}
    style={getIconStyle(size)}
    {...props}
  >
    {children}
  </svg>
);

/* ============================= */
/* Icons */
/* ============================= */

export const HomeIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5"
    />
  </BaseSvg>
);

export const UserIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z
         M4.501 20.118a7.5 7.5 0 0114.998 0
         A17.933 17.933 0 0112 21.75
         c-2.676 0-5.216-.584-7.499-1.632z"
    />
  </BaseSvg>
);

export const NotificationIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31
         A8.967 8.967 0 0118 9.75V9
         A6 6 0 006 9v.75
         a8.967 8.967 0 01-2.312 6.022
         c1.733.64 3.56 1.085 5.455 1.31
         m5.714 0a3 3 0 11-5.714 0"
    />
  </BaseSvg>
);

export const MenuIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
    />
  </BaseSvg>
);

export const CloseIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </BaseSvg>
);

export const SearchIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21 21l-5.197-5.197
         m0 0A7.5 7.5 0 105.196 5.196
         a7.5 7.5 0 0010.607 10.607z"
    />
  </BaseSvg>
);

export const AttendanceIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </BaseSvg>
);

export const AssignmentIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </BaseSvg>
);

export const RequestIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
  </BaseSvg>
);

export const FeedbackIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
  </BaseSvg>
);

export const LogoutIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </BaseSvg>
);

export const ApproveIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </BaseSvg>
);

export const RejectIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </BaseSvg>
);

export const SortAscIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
  </BaseSvg>
);

export const SortDescIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
  </BaseSvg>
);

export const UploadIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </BaseSvg>
);

export const MessageIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </BaseSvg>
);

export const SendIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </BaseSvg>
);

export const AnnouncementIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.996.946 1.821 1.891 2.228M10.34 6.75c.254-.997.947-1.823 1.892-2.228.692-.297 1.442-.423 2.195-.369l3.5.25a2.25 2.25 0 011.83 2.23v10.743a2.25 2.25 0 01-1.83 2.23l-3.5.25c-.753.054-1.502-.072-2.195-.368" />
  </BaseSvg>
);

export const ReplyIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </BaseSvg>
);

export const ClassIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
  </BaseSvg>
);

export const SunIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.263l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </BaseSvg>
);

export const MoonIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </BaseSvg>
);

export const EyeIcon = (props: IconProps) => (
  <BaseSvg {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </BaseSvg>
);


/* ============================= */
/* Spinner */
/* ============================= */

export const SpinnerIcon = ({
  size,
  className,
  ...props
}: IconProps) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={`icon icon-spin ${className || ""}`}
    style={getIconStyle(size)}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
      opacity="0.25"
    />
    <path
      fill="currentColor"
      opacity="0.75"
      d="M4 12a8 8 0 018-8V0
         C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);
