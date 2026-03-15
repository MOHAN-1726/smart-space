export enum Role {
  STUDENT = 'STUDENT',
  STAFF = 'STAFF',
  PARENT = 'PARENT',
}

export interface Class {
  id: string;
  name: string;
  description: string;
}

export interface Section {
  id: string;
  name: string;
  classId: string;
}

export interface ClassMembership {
  id: string;
  userId: string;
  classId: string;
  sectionId?: string | null;
  role: Role.STUDENT | Role.STAFF;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  classIds: string[];
  password?: string;
  isVerified?: boolean;
  profilePhotoUrl?: string;
  // Role-specific properties
  rollNo?: string;
  department?: string;
  year?: number;
  staffId?: string;
  designation?: string;
  studentId?: string;
}

export enum RequestStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export interface NoDueRequest {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  status: RequestStatus;
  remarks: string;
  requestedDate: string;
}

export interface OnDutyRequest {
  id: string;
  studentId: string;
  studentName: string;
  eventName: string;
  fromDate: string;
  toDate: string;
  status: RequestStatus;
  reason: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  leaveType: 'Sick Leave' | 'Casual Leave' | 'Emergency';
  fromDate: string;
  toDate: string;
  status: RequestStatus;
  reason: string;
}

export interface SubmittedFile {
  name: string;
  url: string;
  size: number;
}

export interface Assignment {
  id: string;
  studentId: string;
  classId: string;
  subject: string;
  dueDate: string;
  submittedOn?: string;
  submittedFiles?: SubmittedFile[];
  gradedFileUrl?: string;
  grade?: string;
  status: 'Submitted' | 'Pending' | 'Graded';
}

export enum AttendanceStatus {
  PRESENT = 'P',
  ABSENT = 'A',
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  subject: string;
}

export interface Feedback {
  id: string;
  studentId: string;
  staffId: string;
  classId: string;
  staffName: string;
  comments: string;
  createdDate: string;
}

export enum NotificationType {
  INFO = 'Info',
  SUCCESS = 'Success',
  WARNING = 'Warning',
  ERROR = 'Error',
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  classId: string;
  content: string;
  timestamp: string;
  read: boolean;
  parentMessageId?: string;
}

export interface Announcement {
  id: string;
  staffId: string;
  staffName: string;
  classId?: string; // Optional for global announcements
  title: string;
  content: string;
  timestamp: string;
  targetAudience: 'STUDENT' | 'PARENT' | 'ALL';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  start: string; // ISO Date string e.g., '2023-11-20'
  end: string;   // ISO Date string e.g., '2023-11-22'
  classId?: string; // Optional for class-specific events
  audience: 'STUDENT' | 'PARENT' | 'STAFF' | 'ALL';
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

export interface ClassMaterial {
  id: string;
  classId: string;
  title: string;
  description: string;
  subject: string;
  fileName: string;
  fileUrl: string;
  fileSize: number; // in bytes
  uploadedBy: string; // staffId
  uploadedByName: string;
  uploadDate: string; // ISO Date string
}

export interface Exam {
  id: string;
  classId: string;
  name: string;
  date: string; // ISO Date string
  totalMarks: number;
  paperUrl?: string; // URL to the question paper PDF
  paperStatus?: 'Available' | 'Requested' | 'NotAvailable'; // Status of exam paper availability
}

export interface ExamMark {
  id: string;
  examId: string;
  studentId: string;
  marksObtained: number | null; // Can be null if not marked yet
  answerSheetUrl?: string;
}

export interface MarkComment {
  id: string;
  markId: string;
  userId: string; // ID of the commenter (student, parent, or staff)
  comment: string;
  timestamp: string; // ISO datetime string
}