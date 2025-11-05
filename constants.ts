import { Role, User, NoDueRequest, OnDutyRequest, Assignment, Attendance, Feedback, Notification, RequestStatus, AttendanceStatus, NotificationType, Message, Announcement, Class, ClassMembership } from './types';

export const MOCK_CLASSES: Class[] = [
  { id: 'C1', name: 'CS101: Intro to Computer Science', description: 'Fundamental concepts of programming and computer science.' },
  { id: 'C2', name: 'CS301: Advanced Algorithms', description: 'In-depth study of algorithm design and analysis.' },
  { id: 'C3', name: 'ME202: Thermodynamics', description: 'Principles of heat and energy transfer.' },
];

export const MOCK_CLASS_MEMBERSHIPS: ClassMembership[] = [
    // Alice
    { id: 'CM1', userId: '1', classId: 'C1', role: Role.STUDENT },
    { id: 'CM2', userId: '1', classId: 'C2', role: Role.STUDENT },
    // Charlie
    { id: 'CM3', userId: '4', classId: 'C3', role: Role.STUDENT },
    // Dr. Smith
    { id: 'CM4', userId: '2', classId: 'C1', role: Role.STAFF },
    { id: 'CM5', userId: '2', classId: 'C2', role: Role.STAFF },
    { id: 'CM6', userId: '2', classId: 'C3', role: Role.STAFF },
];

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Alice Johnson', email: 'student1@mail.com', role: Role.STUDENT, rollNo: 'S001', department: 'Computer Science', year: 3, classIds: ['C1', 'C2'] },
  { id: '2', name: 'Dr. Robert Smith', email: 'staff1@mail.com', role: Role.STAFF, staffId: 'T001', designation: 'Professor', classIds: ['C1', 'C2', 'C3'] },
  { id: '3', name: 'Bob Johnson', email: 'parent1@mail.com', role: Role.PARENT, studentId: '1', classIds: [] },
  { id: '4', name: 'Charlie Brown', email: 'student2@mail.com', role: Role.STUDENT, rollNo: 'S002', department: 'Mechanical Engineering', year: 2, classIds: ['C3'] },
];

export const MOCK_NODUE_REQUESTS: NoDueRequest[] = [
  { id: 'ND001', studentId: '1', studentName: 'Alice Johnson', department: 'Library', status: RequestStatus.APPROVED, remarks: 'All books returned.', requestedDate: '2023-10-25' },
  { id: 'ND002', studentId: '4', studentName: 'Charlie Brown', department: 'Hostel', status: RequestStatus.PENDING, remarks: 'Awaiting warden confirmation.', requestedDate: '2023-10-28' },
];

export const MOCK_ONDUTY_REQUESTS: OnDutyRequest[] = [
  { id: 'OD001', studentId: '1', studentName: 'Alice Johnson', eventName: 'Tech Symposium 2023', fromDate: '2023-11-05', toDate: '2023-11-06', status: RequestStatus.PENDING, reason: 'Presenting a paper.' },
  { id: 'OD002', studentId: '4', studentName: 'Charlie Brown', eventName: 'Sports Meet', fromDate: '2023-11-10', toDate: '2023-11-10', status: RequestStatus.REJECTED, reason: 'Participation not confirmed by sports head.' },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 'AS001', studentId: '1', classId: 'C2', subject: 'Data Structures', submissionDate: '2023-10-30', status: 'Graded', grade: 'A+', submittedFiles: [{ name: 'ds_assignment.pdf', url: '/submitted/ds_assignment.pdf', size: 120450 }], gradedFileUrl: '/graded/ds_assignment_graded.pdf' },
  { id: 'AS002', studentId: '1', classId: 'C1', subject: 'Database Management', submissionDate: '2023-11-15', status: 'Graded', grade: 'B-' },
  { id: 'AS003', studentId: '4', classId: 'C3', subject: 'Thermodynamics', submissionDate: '2023-10-28', status: 'Submitted', submittedFiles: [{ name: 'thermo_report.pdf', url: '/submitted/thermo_report.pdf', size: 250000 }, { name: 'thermo_appendix.zip', url: '/submitted/thermo_appendix.zip', size: 1250000 }] },
  { id: 'AS004', studentId: '1', classId: 'C2', subject: 'Algorithm Analysis', submissionDate: '2023-11-20', status: 'Pending' },
];

export const MOCK_ATTENDANCE: Attendance[] = [
  { id: 'AT001', studentId: '1', classId: 'C2', date: '2023-10-27', status: AttendanceStatus.PRESENT, subject: 'Data Structures' },
  { id: 'AT002', studentId: '1', classId: 'C1', date: '2023-10-27', status: AttendanceStatus.ABSENT, subject: 'Database Management' },
  { id: 'AT003', studentId: '1', classId: 'C2', date: '2023-10-26', status: AttendanceStatus.PRESENT, subject: 'Data Structures' },
  { id: 'AT004', studentId: '4', classId: 'C3', date: '2023-10-27', status: AttendanceStatus.PRESENT, subject: 'Thermodynamics' },
];

export const MOCK_FEEDBACK: Feedback[] = [
  { id: 'FB001', studentId: '1', staffId: '2', classId: 'C2', staffName: 'Dr. Robert Smith', comments: 'The lectures on algorithms were very clear and helpful.', createdDate: '2023-10-20' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'N007', userId: '1', message: "New announcement: Mid-term Exam Schedule.", type: NotificationType.INFO, timestamp: '2023-11-02T10:05:00Z', read: false },
  { id: 'N006', userId: '3', message: "New announcement: Parent-Teacher Meeting.", type: NotificationType.INFO, timestamp: '2023-11-01T15:05:00Z', read: false },
  { id: 'N005', userId: '2', message: "You have a new message from Bob Johnson regarding Alice's progress.", type: NotificationType.INFO, timestamp: '2023-11-01T13:01:00Z', read: false },
  { id: 'N004', userId: '3', message: "Alice's attendance for October is 92%.", type: NotificationType.INFO, timestamp: '2023-11-01T08:00:00Z', read: true },
  { id: 'N001', userId: '1', message: 'Your On-Duty request for Tech Symposium has been approved.', type: NotificationType.SUCCESS, timestamp: '2023-10-29T10:00:00Z', read: false },
  { id: 'N002', userId: '1', message: 'Assignment for Database Management is due soon.', type: NotificationType.WARNING, timestamp: '2023-10-28T14:30:00Z', read: true },
  { id: 'N003', userId: '2', message: 'New No-Due request from Charlie Brown.', type: NotificationType.INFO, timestamp: '2023-10-28T09:00:00Z', read: false },
];

export const MOCK_MESSAGES: Message[] = [
    { id: 'M001', senderId: '2', receiverId: '1', classId: 'C2', content: 'Hi Alice, I have graded your Data Structures assignment. Great work!', timestamp: '2023-10-30T14:00:00Z', read: true },
    { id: 'M002', senderId: '1', receiverId: '2', classId: 'C2', content: 'Thank you, Dr. Smith! I appreciate the feedback.', timestamp: '2023-10-30T14:05:00Z', read: true, parentMessageId: 'M001' },
    { id: 'M003', senderId: '2', receiverId: '1', classId: 'C1', content: 'You\'re welcome. Keep it up. Let me know if you have questions about the upcoming database assignment.', timestamp: '2023-10-30T14:06:00Z', read: false },
    { id: 'M004', senderId: '3', receiverId: '2', classId: 'C1', content: "Good afternoon Dr. Smith, this is Alice's father. I was hoping to get an update on her progress.", timestamp: '2023-11-01T13:00:00Z', read: true },
    { id: 'M005', senderId: '2', receiverId: '3', classId: 'C1', content: "Hello Mr. Johnson. Alice is doing very well in my classes. Her recent assignment was excellent.", timestamp: '2023-11-01T13:10:00Z', read: false, parentMessageId: 'M004' },
    { id: 'M006', senderId: '1', receiverId: '2', classId: 'C1', content: 'I do have one question about the ER diagrams.', timestamp: '2023-10-30T15:00:00Z', read: false, parentMessageId: 'M003' },
    { id: 'M007', senderId: '2', receiverId: '1', classId: 'C1', content: 'Of course, what is it?', timestamp: '2023-10-30T15:01:00Z', read: false, parentMessageId: 'M006' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'AN001', staffId: '2', staffName: 'Dr. Robert Smith', classId: 'C1', title: 'Mid-term Exam Schedule', content: 'The mid-term exams for all 3rd-year students will commence from November 20th. Detailed schedule will be shared shortly.', timestamp: '2023-11-02T10:00:00Z', targetAudience: 'STUDENT' },
  { id: 'AN002', staffId: '2', staffName: 'Dr. Robert Smith', title: 'Parent-Teacher Meeting', content: 'We are organizing a parent-teacher meeting on November 18th to discuss student progress. We invite all parents to attend.', timestamp: '2023-11-01T15:00:00Z', targetAudience: 'PARENT' },
  { id: 'AN003', staffId: '2', staffName: 'Dr. Robert Smith', classId: 'C2', title: 'Project Submission Deadline Extended', content: 'The final project submission for Advanced Algorithms has been extended to Dec 5th.', timestamp: '2023-11-05T11:00:00Z', targetAudience: 'STUDENT' },
];