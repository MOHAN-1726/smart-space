export enum Role {
  STUDENT = 'STUDENT',
  STAFF = 'STAFF',
  PARENT = 'PARENT',
  ADMIN = 'ADMIN',
}

export interface Class {
  id: string;
  name: string;
  section?: string;
  subject?: string;
  room?: string; // e.g. "Room 302"
  description: string;
  ownerId: string; // The teacher who created it
  enrollmentCode: string;
  theme: string; // Background image or color theme
  role?: string; // The role of the current user in this class (optional)
  ownerName?: string;
  ownerPhoto?: string;
}

export interface ClassMembership {
  id: string;
  userId: string;
  classId: string;
  role: Role.STUDENT | Role.STAFF;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  photoUrl?: string;
  token?: string;
  password?: string;
  // Role-specific properties
  rollNo?: string;
  department?: string;
  year?: number;
  staffId?: string;
  designation?: string;
  studentId?: string;
  parentId?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
  type: string;
  status?: string;
  source: 'EVENT' | 'ASSIGNMENT';
  targetClassId?: string;
  classId?: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  description?: string;
  targetClassId?: string;
  color?: string;
}

export interface SubmittedFile {
  name: string;
  url: string;
  size: number;
  type?: string;
}

// The "Instruction/Task" created by the teacher
export interface Assignment {
  id: string;
  classId: string;
  title: string;
  instructions: string;
  topic?: string; // Grouping (e.g., "Unit 1")
  dueDate?: string;
  points?: number; // null = ungreaded
  attachments?: SubmittedFile[]; // Teacher provided materials
  createdAt: string;
  createdBy: string; // Teacher ID
}

// The student's work for an assignment
export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  status: 'Assigned' | 'TurnedIn' | 'Returned';
  submittedFiles: SubmittedFile[];
  grade?: number; // e.g. 85/100
  privateComments?: Message[]; // Comments between student and teacher
  submittedAt?: string;
}

export interface Material {
  id: string;
  classId: string;
  title: string;
  description: string;
  topic?: string;
  attachments: SubmittedFile[];
  createdAt: string;
}

export interface Announcement {
  id: string;
  classId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: string;
  attachments?: SubmittedFile[];
  comments?: Comment[];
}

export interface Comment {
  id: string;
  parentId: string; // AnnouncementID or AssignmentID
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  startTime: string;
  endTime?: string;
  description: string;
  status: 'ACTIVE' | 'CLOSED';
  records?: AttendanceRecord[]; // Included when fetching full details
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName?: string;
  studentPhoto?: string;
  studentEmail?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'ON_DUTY' | 'LEAVE' | 'NO_DUE';
  joinedAt?: string;
  remarks?: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName?: string;
  studentPhoto?: string;
  classId: string;
  className?: string; // For student view
  subject?: string;
  fromDate: string;
  toDate: string;
  type: 'OD' | 'LEAVE' | 'STUDY';
  studyType?: string;
  reason: string;
  documentUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  parentApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  staffRemarks?: string;
  createdAt: string;
}

export interface NoDueRequest {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  organizationId: string;
  reason?: string;
  status: 'PENDING' | 'TEACHER_APPROVED' | 'COMPLETED' | 'REJECTED';
  teacherRemarks?: string;
  teacherReviewedBy?: string;
  teacherReviewedAt?: string;
  adminRemarks?: string;
  adminReviewedBy?: string;
  adminReviewedAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  role: Role;
  type: 'ASSIGNMENT' | 'ATTENDANCE' | 'LEAVE' | 'ANNOUNCEMENT' | 'MATERIAL' | 'EXAM';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface PerformanceRecord {
  id: string;
  studentId: string;
  subject: string;
  score: number;
  maxScore: number;
  type: 'ASSIGNMENT' | 'TEST';
  date: string;
}

export interface AttendanceAnalytics {
  percentage: number;
  present: number;
  absent: number;
  total: number;
  trend: { month: string; percentage: number }[];
}