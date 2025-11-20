
import { Document } from 'mongoose';

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface ClassDocument extends Document {
  name: string;
  teacher: UserDocument;
  students: UserDocument[];
}

export interface AssignmentDocument extends Document {
  title: string;
  description: string;
  class: ClassDocument;
  teacher: UserDocument;
  dueDate: Date;
}

export interface SubmissionDocument extends Document {
  assignment: AssignmentDocument;
  student: UserDocument;
  submissionDate: Date;
  grade: number;
  file: string;
}

export interface NoteDocument extends Document {
  title: string;
  class: ClassDocument;
  teacher: UserDocument;
  file: string;
}

export interface AttendanceDocument extends Document {
  class: ClassDocument;
  student: UserDocument;
  date: Date;
  present: boolean;
}

export interface AnnouncementDocument extends Document {
  title: string;
  content: string;
  author: UserDocument;
  class: ClassDocument;
}

export interface TimetableDocument extends Document {
  class: ClassDocument;
  teacher: UserDocument;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
  subject: string;
}

export interface NotificationDocument extends Document {
  user: UserDocument;
  message: string;
  read: boolean;
}
