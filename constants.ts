import { Role, User, NoDueRequest, OnDutyRequest, Assignment, Attendance, Feedback, Notification, RequestStatus, AttendanceStatus, NotificationType, Message, Announcement, Class, ClassMembership, Event, Section, LeaveRequest, ClassMaterial } from './types';

export const MOCK_CLASSES: Class[] = [
  { id: 'C1', name: 'CS101: Intro to Computer Science', description: 'Fundamental concepts of programming and computer science.' },
  { id: 'C2', name: 'CS301: Advanced Algorithms', description: 'In-depth study of algorithm design and analysis.' },
  { id: 'C3', name: 'ME202: Thermodynamics', description: 'Principles of heat and energy transfer.' },
];

export const MOCK_SECTIONS: Section[] = [
  { id: 'S1', name: 'Section A', classId: 'C1' },
  { id: 'S2', name: 'Section B', classId: 'C1' },
  { id: 'S3', name: 'Section A', classId: 'C2' },
];

export const MOCK_CLASS_MEMBERSHIPS: ClassMembership[] = [
    // Mohanraj
    { id: 'CM1', userId: '1', classId: 'C1', sectionId: 'S1', role: Role.STUDENT },
    { id: 'CM2', userId: '1', classId: 'C2', sectionId: 'S3', role: Role.STUDENT },
    // Akash
    { id: 'CM3', userId: '4', classId: 'C3', role: Role.STUDENT },
    // Arthi Priyadharshini
    { id: 'CM4', userId: '2', classId: 'C1', role: Role.STAFF },
    { id: 'CM5', userId: '2', classId: 'C2', role: Role.STAFF },
    { id: 'CM6', userId: '2', classId: 'C3', role: Role.STAFF },
    // Another student in C1, Section B
    { id: 'CM7', userId: '5', classId: 'C1', sectionId: 'S2', role: Role.STUDENT },
];

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Mohanraj', email: 'student1@mail.com', role: Role.STUDENT, password: 'password123', rollNo: 'S001', department: 'Computer Science', year: 3, classIds: ['C1', 'C2'], profilePhotoUrl: `https://i.pravatar.cc/150?u=1` },
  { id: '2', name: 'Arthi Priyadharshini', email: 'staff1@mail.com', role: Role.STAFF, password: 'password123', staffId: 'T001', designation: 'Professor', classIds: ['C1', 'C2', 'C3'], profilePhotoUrl: `https://i.pravatar.cc/150?u=2` },
  { id: '3', name: 'Sivakami', email: 'parent1@mail.com', role: Role.PARENT, password: 'password123', studentId: '1', classIds: [], profilePhotoUrl: `https://i.pravatar.cc/150?u=3` },
  { id: '4', name: 'Akash', email: 'student2@mail.com', role: Role.STUDENT, password: 'password123', rollNo: 'S002', department: 'Mechanical Engineering', year: 2, classIds: ['C3'], profilePhotoUrl: `https://i.pravatar.cc/150?u=4` },
  { id: '5', name: 'Sathya', email: 'student3@mail.com', role: Role.STUDENT, password: 'password123', rollNo: 'S003', department: 'Computer Science', year: 3, classIds: ['C1'], profilePhotoUrl: `https://i.pravatar.cc/150?u=5` },

];

export const MOCK_NODUE_REQUESTS: NoDueRequest[] = [
  { id: 'ND001', studentId: '1', studentName: 'Mohanraj', department: 'Library', status: RequestStatus.APPROVED, remarks: 'All books returned.', requestedDate: '2023-10-25' },
  { id: 'ND002', studentId: '4', studentName: 'Akash', department: 'Hostel', status: RequestStatus.PENDING, remarks: 'Awaiting warden confirmation.', requestedDate: '2023-10-28' },
];

export const MOCK_ONDUTY_REQUESTS: OnDutyRequest[] = [
  { id: 'OD001', studentId: '1', studentName: 'Mohanraj', eventName: 'Tech Symposium 2023', fromDate: '2023-11-05', toDate: '2023-11-06', status: RequestStatus.PENDING, reason: 'Presenting a paper.' },
  { id: 'OD002', studentId: '4', studentName: 'Akash', eventName: 'Sports Meet', fromDate: '2023-11-10', toDate: '2023-11-10', status: RequestStatus.REJECTED, reason: 'Participation not confirmed by sports head.' },
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 'LR001', studentId: '1', studentName: 'Mohanraj', leaveType: 'Sick Leave', fromDate: '2023-11-12', toDate: '2023-11-13', status: RequestStatus.APPROVED, reason: 'Fever and cold.' },
  { id: 'LR002', studentId: '4', studentName: 'Akash', leaveType: 'Casual Leave', fromDate: '2023-11-15', toDate: '2023-11-15', status: RequestStatus.PENDING, reason: 'Family function.' },
  { id: 'LR003', studentId: '5', studentName: 'Sathya', leaveType: 'Emergency', fromDate: '2023-11-09', toDate: '2023-11-10', status: RequestStatus.REJECTED, reason: 'Attending a cousin\'s wedding.' },
];

export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 'AS001', studentId: '1', classId: 'C2', subject: 'Data Structures', dueDate: '2023-10-30', status: 'Graded', grade: 'A+', submittedFiles: [{ name: 'ds_assignment.pdf', url: '/submitted/ds_assignment.pdf', size: 120450 }], gradedFileUrl: '/graded/ds_assignment_graded.pdf', submittedOn: '2023-10-28' },
  { id: 'AS002', studentId: '1', classId: 'C1', subject: 'Database Management', dueDate: '2023-11-15', status: 'Graded', grade: 'B-', submittedOn: '2023-11-14' },
  { id: 'AS003', studentId: '4', classId: 'C3', subject: 'Thermodynamics', dueDate: '2023-10-28', status: 'Submitted', submittedFiles: [{ name: 'thermo_report.pdf', url: '/submitted/thermo_report.pdf', size: 250000 }, { name: 'thermo_appendix.zip', url: '/submitted/thermo_appendix.zip', size: 1250000 }], submittedOn: '2023-10-28' },
  { id: 'AS004', studentId: '1', classId: 'C2', subject: 'Algorithm Analysis', dueDate: '2023-11-20', status: 'Pending' },
];

export const MOCK_ATTENDANCE: Attendance[] = [
  { id: 'AT001', studentId: '1', classId: 'C2', date: '2023-10-27', status: AttendanceStatus.PRESENT, subject: 'Data Structures' },
  { id: 'AT002', studentId: '1', classId: 'C1', date: '2023-10-27', status: AttendanceStatus.ABSENT, subject: 'Database Management' },
  { id: 'AT003', studentId: '1', classId: 'C2', date: '2023-10-26', status: AttendanceStatus.PRESENT, subject: 'Data Structures' },
  { id: 'AT004', studentId: '4', classId: 'C3', date: '2023-10-27', status: AttendanceStatus.PRESENT, subject: 'Thermodynamics' },
];

export const MOCK_FEEDBACK: Feedback[] = [
  { id: 'FB001', studentId: '1', staffId: '2', classId: 'C2', staffName: 'Arthi Priyadharshini', comments: 'The lectures on algorithms were very clear and helpful.', createdDate: '2023-10-20' },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'N007', userId: '1', message: "New announcement: Mid-term Exam Schedule.", type: NotificationType.INFO, timestamp: '2023-11-02T10:05:00Z', read: false },
  { id: 'N006', userId: '3', message: "New announcement: Parent-Teacher Meeting.", type: NotificationType.INFO, timestamp: '2023-11-01T15:05:00Z', read: false },
  { id: 'N005', userId: '2', message: "You have a new message from Sivakami regarding Mohanraj's progress.", type: NotificationType.INFO, timestamp: '2023-11-01T13:01:00Z', read: false },
  { id: 'N004', userId: '3', message: "Mohanraj's attendance for October is 92%.", type: NotificationType.INFO, timestamp: '2023-11-01T08:00:00Z', read: true },
  { id: 'N001', userId: '1', message: 'Your On-Duty request for Tech Symposium has been approved.', type: NotificationType.SUCCESS, timestamp: '2023-10-29T10:00:00Z', read: false },
  { id: 'N002', userId: '1', message: 'Assignment for Database Management is due soon.', type: NotificationType.WARNING, timestamp: '2023-10-28T14:30:00Z', read: true },
  { id: 'N003', userId: '2', message: 'New No-Due request from Akash.', type: NotificationType.INFO, timestamp: '2023-10-28T09:00:00Z', read: false },
];

export const MOCK_MESSAGES: Message[] = [
    { id: 'M001', senderId: '2', receiverId: '1', classId: 'C2', content: 'Hi Mohanraj, I have graded your Data Structures assignment. Great work!', timestamp: '2023-10-30T14:00:00Z', read: true },
    { id: 'M002', senderId: '1', receiverId: '2', classId: 'C2', content: 'Thank you, Arthi! I appreciate the feedback.', timestamp: '2023-10-30T14:05:00Z', read: true, parentMessageId: 'M001' },
    { id: 'M003', senderId: '2', receiverId: '1', classId: 'C1', content: 'You\'re welcome. Keep it up. Let me know if you have questions about the upcoming database assignment.', timestamp: '2023-10-30T14:06:00Z', read: false },
    { id: 'M004', senderId: '3', receiverId: '2', classId: 'C1', content: "Good afternoon Arthi, this is Mohanraj's mother. I was hoping to get an update on his progress.", timestamp: '2023-11-01T13:00:00Z', read: true },
    { id: 'M005', senderId: '2', receiverId: '3', classId: 'C1', content: "Hello Sivakami. Mohanraj is doing very well in my classes. His recent assignment was excellent.", timestamp: '2023-11-01T13:10:00Z', read: false, parentMessageId: 'M004' },
    { id: 'M006', senderId: '1', receiverId: '2', classId: 'C1', content: 'I do have one question about the ER diagrams.', timestamp: '2023-10-30T15:00:00Z', read: false, parentMessageId: 'M003' },
    { id: 'M007', senderId: '2', receiverId: '1', classId: 'C1', content: 'Of course, what is it?', timestamp: '2023-10-30T15:01:00Z', read: false, parentMessageId: 'M006' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'AN001', staffId: '2', staffName: 'Arthi Priyadharshini', classId: 'C1', title: 'Mid-term Exam Schedule', content: 'The mid-term exams for all 3rd-year students will commence from November 20th. Detailed schedule will be shared shortly.', timestamp: '2023-11-02T10:00:00Z', targetAudience: 'STUDENT' },
  { id: 'AN002', staffId: '2', staffName: 'Arthi Priyadharshini', title: 'Parent-Teacher Meeting', content: 'We are organizing a parent-teacher meeting on November 18th to discuss student progress. We invite all parents to attend.', timestamp: '2023-11-01T15:00:00Z', targetAudience: 'PARENT' },
  { id: 'AN003', staffId: '2', staffName: 'Arthi Priyadharshini', classId: 'C2', title: 'Project Submission Deadline Extended', content: 'The final project submission for Advanced Algorithms has been extended to Dec 5th.', timestamp: '2023-11-05T11:00:00Z', targetAudience: 'STUDENT' },
];

export const MOCK_EVENTS: Event[] = [
  { id: 'E001', title: 'Mid-term Exams Start', description: 'Mid-term exams for all 3rd-year students.', start: '2023-11-20', end: '2023-11-20', audience: 'STUDENT', color: 'red' },
  { id: 'E002', title: 'Parent-Teacher Meeting', description: 'Discuss student progress.', start: '2023-11-18', end: '2023-11-18', audience: 'PARENT', color: 'blue' },
  { id: 'E003', title: 'Tech Symposium 2023', description: 'Annual technology symposium.', start: '2023-11-05', end: '2023-11-06', audience: 'ALL', color: 'green' },
  { id: 'E004', title: 'CS301 Project Deadline', description: 'Final project submission for Advanced Algorithms.', start: '2023-12-05', end: '2023-12-05', classId: 'C2', audience: 'STUDENT', color: 'yellow' },
  { id: 'E005', title: 'Staff Development Workshop', description: 'Workshop on new teaching methodologies.', start: '2023-11-25', end: '2023-11-25', audience: 'STAFF', color: 'purple' },
  { id: 'E006', title: 'Winter Break', description: 'College closed for winter break.', start: '2023-12-23', end: '2024-01-02', audience: 'ALL', color: 'blue' },
  { id: 'E007', title: 'CS101 Guest Lecture', description: 'Guest lecture on AI by an industry expert.', start: '2023-11-10', end: '2023-11-10', classId: 'C1', audience: 'STUDENT', color: 'yellow' },
];

export const MOCK_CLASS_MATERIALS: ClassMaterial[] = [
  {
    id: 'CMAT001',
    classId: 'C1',
    title: 'Lecture 1: Introduction to Python',
    description: 'Slides from the first lecture covering basic Python syntax and concepts.',
    subject: 'Programming Fundamentals',
    fileName: 'lecture1_intro_python.pdf',
    fileUrl: '#',
    fileSize: 1572864, // 1.5 MB
    uploadedBy: '2',
    uploadedByName: 'Arthi Priyadharshini',
    uploadDate: '2023-10-10',
  },
  {
    id: 'CMAT002',
    classId: 'C2',
    title: 'Assignment 3: Big O Notation',
    description: 'Problem set for analyzing algorithm complexity.',
    subject: 'Advanced Algorithms',
    fileName: 'assignment3_big_o.docx',
    fileUrl: '#',
    fileSize: 45056, // 44 KB
    uploadedBy: '2',
    uploadedByName: 'Arthi Priyadharshini',
    uploadDate: '2023-11-01',
  },
  {
    id: 'CMAT003',
    classId: 'C1',
    title: 'Lab 2: SQL Queries',
    description: 'Instructions for the second database lab.',
    subject: 'Database Management',
    fileName: 'lab2_sql_queries.pdf',
    fileUrl: '#',
    fileSize: 819200, // 800 KB
    uploadedBy: '2',
    uploadedByName: 'Arthi Priyadharshini',
    uploadDate: '2023-10-25',
  },
];