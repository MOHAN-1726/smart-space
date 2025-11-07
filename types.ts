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

export interface ClassMembership {
  id:string;
  userId: string;
  classId: string;
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