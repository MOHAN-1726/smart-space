import React from "react";

const BASE_CLASS = "w-6 h-6";

type SVGProps = React.SVGProps<SVGSVGElement>;

function mergeClass(props: SVGProps, extra?: string) {
  const parts = [extra ?? BASE_CLASS, props.className].filter(Boolean);
  return parts.join(" ");
}

/* -----------------------------------------------------------
   ICONS
----------------------------------------------------------- */

export const HomeIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5"
    />
  </svg>
);

export const ClassIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
    />
  </svg>
);

export const AttendanceIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18"
    />
  </svg>
);

export const LeaveIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-3 0l-3-3m0 0l3-3m-3 3h12.75"
    />
  </svg>
);

export const CalendarIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25"
    />
  </svg>
);

export const AssignmentIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5"
    />
  </svg>
);

export const RequestIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7"
    />
  </svg>
);

export const FeedbackIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75" />
  </svg>
);

export const NotificationIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082" />
  </svg>
);

export const MessageIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76" />
  </svg>
);

export const AnnouncementIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636" />
  </svg>
);

export const LogoutIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9" />
  </svg>
);

export const ChevronDownIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props, "w-5 h-5")}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

export const ChevronLeftIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

export const ChevronRightIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

export const MenuIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5" />
  </svg>
);

export const CloseIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export const ApproveIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" />
  </svg>
);

export const RejectIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5" />
  </svg>
);

export const UserIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0" />
  </svg>
);

export const SpinnerIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props, "animate-spin h-5 w-5")}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
  </svg>
);

export const SortAscIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props, "w-4 h-4")}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

export const SortDescIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props, "w-4 h-4")}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

export const UploadIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5" />
  </svg>
);

/* ----------------------------------------------
   NEW: DownloadIcon (the one your import needs)
----------------------------------------------- */
export const DownloadIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 3v13.5m0 0l-3.75-3.75M12 16.5l3.75-3.75"
    />
  </svg>
);

export const SendIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

export const ReplyIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9" />
  </svg>
);

export const SunIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25" />
  </svg>
);

export const MoonIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002" />
  </svg>
);

export const SearchIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197" />
  </svg>
);

export const EyeIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322" />
  </svg>
);

export const EditIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687" />
  </svg>
);

export const TrashIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9" />
  </svg>
);

export const GraduationCapIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147" />
  </svg>
);

export const KeyIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3" />
  </svg>
);

export const SparklesIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904" />
  </svg>
);

export const DocumentTextIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
  </svg>
);

export const BookOpenIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12" />
  </svg>
);

export const LightBulbIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 18v-5.25m0 0a3 3 0 00-3-3"
    />
  </svg>
);

export const ClipboardCheckIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2" />
  </svg>
);

export const PaperPlaneIcon = (props: SVGProps) => (
  <svg
    {...props}
    className={mergeClass(props)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
    />
  </svg>
);
