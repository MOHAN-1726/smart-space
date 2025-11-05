

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { User, Role, RequestStatus, NoDueRequest, OnDutyRequest, Assignment, Attendance, Feedback, AttendanceStatus, Message, Announcement, NotificationType, Class, ClassMembership, SubmittedFile } from '../types';
import type { Notification } from '../types';
import { MOCK_USERS, MOCK_NODUE_REQUESTS, MOCK_ONDUTY_REQUESTS, MOCK_ASSIGNMENTS, MOCK_ATTENDANCE, MOCK_FEEDBACK, MOCK_NOTIFICATIONS, MOCK_MESSAGES, MOCK_ANNOUNCEMENTS, MOCK_CLASSES, MOCK_CLASS_MEMBERSHIPS } from '../constants';
import { Card, Button, StatusBadge, ConfirmationDialog, Modal } from './UI';
import { HomeIcon, AttendanceIcon, AssignmentIcon, RequestIcon, FeedbackIcon, NotificationIcon, LogoutIcon, MenuIcon, CloseIcon, ApproveIcon, RejectIcon, UserIcon, SortAscIcon, SortDescIcon, UploadIcon, MessageIcon, SendIcon, AnnouncementIcon, ReplyIcon, ClassIcon, SunIcon, MoonIcon, SpinnerIcon, SearchIcon, EyeIcon } from './Icons';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  updateUser: (user: User) => void;
}

// Sub-components for different views
const OverviewContent: React.FC<{ user: User, setActiveView: (view: string) => void, selectedClassId: string | null, classes: Class[] }> = ({ user, setActiveView, selectedClassId, classes }) => {
  const getStat = (title: string, value: string | number, color: string) => (
    <Card className={`bg-gradient-to-br ${color} text-white`}>
      <p className="text-sm opacity-80">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </Card>
  );

  const studentId = user.role === Role.PARENT ? user.studentId : user.id;

  const getFilteredData = <T extends { studentId: string; classId: string; }>(data: T[]) => {
    if (!studentId || !selectedClassId) return [];
    return data.filter(item => item.studentId === studentId && item.classId === selectedClassId);
  }

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const title = selectedClass ? `Showing data for ${selectedClass.name}` : 'No class selected';

  switch (user.role) {
    case Role.STUDENT:
    case Role.PARENT: {
        const studentAttendance = getFilteredData(MOCK_ATTENDANCE);
        const attendancePercentage = studentAttendance.length > 0 ?
            (studentAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length / studentAttendance.length * 100).toFixed(0) : 'N/A';
        const pendingAssignments = getFilteredData(MOCK_ASSIGNMENTS).filter(a => a.status === 'Pending').length;
        const activeRequests = MOCK_NODUE_REQUESTS.filter(r => r.studentId === studentId && r.status === RequestStatus.PENDING).length + MOCK_ONDUTY_REQUESTS.filter(r => r.studentId === studentId && r.status === RequestStatus.PENDING).length;

        const roleTitle = user.role === Role.STUDENT ? 'Student Overview' : 'Parent Overview';
        const attendanceTitle = user.role === Role.STUDENT ? 'Attendance' : "Child's Attendance";
        const assignmentsTitle = user.role === Role.STUDENT ? 'Pending Assignments' : "Child's Pending Assignments";
      return (
        <div>
          <h2 className="text-2xl font-bold mb-1">{roleTitle}</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{title}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getStat(attendanceTitle, `${attendancePercentage}%`, 'from-primary-500 to-primary-600')}
            {getStat(assignmentsTitle, pendingAssignments, 'from-yellow-500 to-yellow-600')}
            {user.role === Role.STUDENT && getStat('Active Requests', activeRequests, 'from-green-500 to-green-600')}
          </div>
           {user.role === Role.STUDENT && <div className="mt-8">
            <Card title="Quick Actions">
                <div className="flex flex-wrap gap-4">
                    <Button onClick={() => setActiveView('requests')}>Manage Requests</Button>
                </div>
            </Card>
          </div>}
        </div>
      );
    }
    case Role.STAFF: {
       const pendingNoDue = MOCK_NODUE_REQUESTS.filter(r => r.status === RequestStatus.PENDING).length;
       const pendingOnDuty = MOCK_ONDUTY_REQUESTS.filter(r => r.status === RequestStatus.PENDING).length;
       const assignmentsToGrade = MOCK_ASSIGNMENTS.filter(a => a.status === 'Submitted' && a.classId === selectedClassId).length;
       return (
        <div>
          <h2 className="text-2xl font-bold mb-1">Staff Overview</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{title}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getStat('Pending No-Due', pendingNoDue, 'from-primary-500 to-primary-600')}
            {getStat('Pending On-Duty', pendingOnDuty, 'from-yellow-500 to-yellow-600')}
            {getStat('Assignments to Grade', assignmentsToGrade, 'from-green-500 to-green-600')}
          </div>
        </div>
      );
    }
    default: return null;
  }
};

const ClassDashboardView: React.FC<{ user: User, selectedClassId: string | null, setActiveView: (view: string) => void, classes: Class[], classMemberships: ClassMembership[] }> = ({ user, selectedClassId, setActiveView, classes, classMemberships }) => {
    const selectedClass = classes.find(c => c.id === selectedClassId);

    if (!selectedClass) {
        return <Card title="No Class Selected"><p>Please select a class from the dropdown above to view its dashboard.</p></Card>;
    }

    const currentClassMemberships = classMemberships.filter(cm => cm.classId === selectedClass.id);
    const classMembers = currentClassMemberships.map(cm => {
        const memberUser = MOCK_USERS.find(u => u.id === cm.userId);
        return { ...memberUser, roleInClass: cm.role };
    }).filter(m => m.id); // Filter out any potential undefined users

    const staffMembers = classMembers.filter(m => m.roleInClass === Role.STAFF);
    const studentMembers = classMembers.filter(m => m.roleInClass === Role.STUDENT);

    const classAnnouncements = MOCK_ANNOUNCEMENTS
        .filter(a => a.classId === selectedClass.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 3);
        
    const studentId = user.role === Role.PARENT ? user.studentId : user.id;
    const classAssignments = (user.role === Role.STAFF ? MOCK_ASSIGNMENTS : MOCK_ASSIGNMENTS.filter(a => a.studentId === studentId))
        .filter(a => a.classId === selectedClass.id)
        .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
        .slice(0, 5);

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">{selectedClass.name}</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedClass.description}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Recent Announcements">
                        {classAnnouncements.length > 0 ? (
                            <div className="space-y-4">
                                {classAnnouncements.map(ann => (
                                    <div key={ann.id} className="border-b border-slate-200 dark:border-slate-700 pb-3 last:border-b-0 last:pb-0">
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">{ann.title}</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{ann.content}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">By {ann.staffName} on {new Date(ann.timestamp).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400">No announcements for this class.</p>
                        )}
                        <div className="mt-4 flex justify-end">
                            {user.role === Role.STAFF && <Button variant="secondary" onClick={() => setActiveView('announcements')}>New Announcement</Button>}
                            <Button className="ml-2" onClick={() => setActiveView('announcements')}>View All</Button>
                        </div>
                    </Card>

                    <Card title="Recent Assignments">
                        {classAssignments.length > 0 ? (
                             <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-slate-500 dark:text-slate-400">
                                        <tr>
                                            {user.role === Role.STAFF && <th className="p-2">Student</th>}
                                            <th className="p-2">Subject</th>
                                            <th className="p-2">Due Date</th>
                                            <th className="p-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classAssignments.map(asg => (
                                            <tr key={asg.id} className="border-t border-slate-200 dark:border-slate-700">
                                                {user.role === Role.STAFF && <td className="p-2">{MOCK_USERS.find(u => u.id === asg.studentId)?.name}</td>}
                                                <td className="p-2 font-medium text-slate-800 dark:text-slate-200">{asg.subject}</td>
                                                <td className="p-2">{asg.submissionDate}</td>
                                                <td className="p-2"><StatusBadge status={asg.status} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400">No assignments for this class.</p>
                        )}
                         <div className="mt-4 flex justify-end">
                            <Button onClick={() => setActiveView('assignments')}>View All</Button>
                        </div>
                    </Card>
                </div>
                
                <div className="space-y-6">
                    <Card title="Members">
                         <div>
                            <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-2">Staff ({staffMembers.length})</h4>
                            <ul className="space-y-2">
                                {staffMembers.map(member => (
                                    <li key={member.id} className="flex items-center gap-3">
                                        <img src={`https://i.pravatar.cc/40?u=${member.id}`} alt={member.name} className="w-8 h-8 rounded-full" />
                                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{member.name}</span>
                                    </li>
                                ))}
                            </ul>
                         </div>
                         <div className="mt-4">
                             <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-2">Students ({studentMembers.length})</h4>
                            <ul className="space-y-1 -mx-1 pr-1 max-h-60 overflow-y-auto">
                                {studentMembers.map(member => (
                                    <li key={member.id} className="flex items-center gap-3 p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <img src={`https://i.pravatar.cc/40?u=${member.id}`} alt={member.name} className="w-8 h-8 rounded-full flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{member.name}</p>
                                            {(member.rollNo || member.department) && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {member.rollNo}{member.rollNo && member.department && ' • '}{member.department}
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                         </div>
                    </Card>

                    <Card title="Communication">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Jump into the class conversation to ask questions or get help.</p>
                        <Button className="w-full" onClick={() => setActiveView('messages')}>Open Messages</Button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const ProfileView: React.FC<{ user: User }> = ({ user }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">My Profile</h2>
            <Card>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <img 
                        src={`https://i.pravatar.cc/150?u=${user.id}`} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-full border-4 border-primary-200 dark:border-primary-700"
                    />
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-200">{user.name}</h3>
                        {user.role === Role.STUDENT && (
                            <p className="text-primary-600 dark:text-primary-400 font-medium mt-1">
                                {user.rollNo} &bull; {user.department}, Year {user.year}
                            </p>
                        )}
                         {user.role === Role.STAFF && (
                            <p className="text-primary-600 dark:text-primary-400 font-medium mt-1">
                                {user.staffId} &bull; {user.designation}
                            </p>
                        )}
                        
                        <div className="mt-6 border-t dark:border-slate-700 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-semibold text-slate-500 dark:text-slate-400">Email Address</p>
                                <p className="text-slate-700 dark:text-slate-300">{user.email}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-500 dark:text-slate-400">Contact Number</p>
                                <p className="text-slate-700 dark:text-slate-300">+1 234 567 8900 (Demo)</p>
                            </div>
                             <div className="sm:col-span-2">
                                <p className="font-semibold text-slate-500 dark:text-slate-400">Address</p>
                                <p className="text-slate-700 dark:text-slate-300">123 University Lane, Campus City, 12345 (Demo)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const AttendanceView: React.FC<{ user: User, selectedClassId: string | null }> = ({ user, selectedClassId }) => {
    const studentId = user.role === Role.PARENT ? user.studentId : user.id;
    const attendanceRecords = MOCK_ATTENDANCE.filter(a => a.studentId === studentId && a.classId === selectedClassId);
    return (
        <Card title="Attendance Records">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Subject</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendanceRecords.map(record => (
                            <tr key={record.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">{record.date}</td>
                                <td className="px-6 py-4">{record.subject}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${record.status === 'P' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                        {record.status === 'P' ? 'Present' : 'Absent'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {attendanceRecords.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-4">No attendance records found for this class.</p>}
            </div>
        </Card>
    );
};

const AssignmentView: React.FC<{
    user: User,
    selectedClassId: string | null,
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
}> = ({ user, selectedClassId, addNotification }) => {
    const studentId = user.role === Role.PARENT ? user.studentId : user.id;
    
    const getInitialAssignments = () => {
        const allAssignments = user.role === Role.STAFF 
            ? MOCK_ASSIGNMENTS 
            : MOCK_ASSIGNMENTS.filter(a => a.studentId === studentId);
        return allAssignments.filter(a => a.classId === selectedClassId);
    };

    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
    const [submissionConfirm, setSubmissionConfirm] = useState<Assignment | null>(null);
    const [statusFilters, setStatusFilters] = useState<string[]>(['Pending', 'Submitted', 'Graded']);
    const [fileUploadProgress, setFileUploadProgress] = useState<{ [key: string]: number }>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);

    const ALL_STATUSES = ['Pending', 'Submitted', 'Graded'] as const;

    useEffect(() => {
        setAssignments(getInitialAssignments());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClassId, user.role, studentId]);

    const handleConfirmSubmission = () => {
        if (submissionConfirm) {
            setAssignments(prevAssignments =>
                prevAssignments.map(assignment =>
                    assignment.id === submissionConfirm.id
                        ? { ...assignment, status: 'Submitted' }
                        : assignment
                )
            );
             if (user.role === Role.STUDENT) {
                addNotification({
                    userId: user.id,
                    message: `Successfully submitted assignment: "${submissionConfirm.subject}".`,
                    type: NotificationType.SUCCESS,
                });
            }
            setSubmissionConfirm(null);
        }
    };

    const handleGradeChange = (assignmentId: string, newGrade: string) => {
        setAssignments(prevAssignments =>
            prevAssignments.map(assignment => {
                if (assignment.id === assignmentId) {
                    const newStatus = newGrade ? 'Graded' : (assignment.status === 'Graded' ? 'Submitted' : assignment.status);
                    return { ...assignment, grade: newGrade, status: newStatus as 'Submitted' | 'Pending' | 'Graded' };
                }
                return assignment;
            })
        );
    };

    const handleUploadClick = (assignmentId: string) => {
        setSelectedAssignmentId(assignmentId);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !selectedAssignmentId) return;
        const assignmentId = selectedAssignmentId;
        
        if (user.role === Role.STUDENT) {
            const files = Array.from(e.target.files) as File[];
            files.forEach(file => {
                const uniqueFileKey = `${assignmentId}-${file.name}`;
                setFileUploadProgress(prev => ({ ...prev, [uniqueFileKey]: 0 }));

                const interval = setInterval(() => {
                    setFileUploadProgress(prev => {
                        const current = prev[uniqueFileKey] ?? 0;
                        const next = Math.min(current + 10, 100);
                        if (next === 100) {
                            clearInterval(interval);
                            const reader = new FileReader();
                            reader.onloadend = (event) => {
                                const fileUrl = event.target?.result as string;
                                setAssignments(prevAssignments => prevAssignments.map(a =>
                                    a.id === assignmentId
                                        ? { ...a, submittedFiles: [...(a.submittedFiles || []), { name: file.name, url: fileUrl, size: file.size }] }
                                        : a
                                ));
                                setFileUploadProgress(currentProgress => {
                                    const newProgress = { ...currentProgress };
                                    delete newProgress[uniqueFileKey];
                                    return newProgress;
                                });
                            };
                            reader.readAsDataURL(file);
                        }
                        return { ...prev, [uniqueFileKey]: next };
                    });
                }, 200);
            });
        } else if (user.role === Role.STAFF) {
             const file = e.target.files[0] as File | undefined;
             if (!file) return;
             const uniqueFileKey = `${assignmentId}-${file.name}`;
             setFileUploadProgress({ [uniqueFileKey]: 0 });

             const interval = setInterval(() => {
                 setFileUploadProgress(prev => {
                     const current = prev[uniqueFileKey] ?? 0;
                     const next = Math.min(current + 10, 100);
                     if (next === 100) {
                         clearInterval(interval);
                         const reader = new FileReader();
                         reader.onloadend = (event) => {
                             const fileUrl = event.target?.result as string;
                             setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, gradedFileUrl: fileUrl } : a));
                             setFileUploadProgress({});
                         };
                         reader.readAsDataURL(file);
                     }
                     return { ...prev, [uniqueFileKey]: next };
                 });
             }, 200);
        }

        setSelectedAssignmentId(null);
        if (e.target) e.target.value = '';
    };

    const handleRemoveFile = (assignmentId: string, fileName: string) => {
        setAssignments(prev => prev.map(a =>
            a.id === assignmentId
                ? { ...a, submittedFiles: a.submittedFiles?.filter(f => f.name !== fileName) }
                : a
        ));
    };

    const handleFilterChange = (statusToToggle: string) => {
        if (statusToToggle === 'All') {
            if (statusFilters.length === ALL_STATUSES.length) {
                setStatusFilters([]);
            } else {
                setStatusFilters([...ALL_STATUSES]);
            }
            return;
        }
        setStatusFilters(prevFilters =>
            prevFilters.includes(statusToToggle)
                ? prevFilters.filter(s => s !== statusToToggle)
                : [...prevFilters, statusToToggle]
        );
    };

    const filteredAssignments = useMemo(() => {
        return assignments.filter(assignment =>
            statusFilters.includes(assignment.status) &&
            assignment.subject.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [assignments, statusFilters, searchTerm]);

    const AssignmentDetailsModal: React.FC<{
        assignment: Assignment;
        isOpen: boolean;
        onClose: () => void;
        userRole: Role;
    }> = ({ assignment, isOpen, onClose, userRole }) => {
        const student = userRole === Role.STAFF ? MOCK_USERS.find(u => u.id === assignment.studentId) : null;
        
        const DetailItem: React.FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
            <div>
                <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="mt-1 text-sm text-slate-900 dark:text-slate-200">{children}</dd>
            </div>
        );

        return (
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`Details for "${assignment.subject}"`}
            >
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    {student && <DetailItem label="Student">{student.name}</DetailItem>}
                    <div className={student ? '' : 'sm:col-span-2'}>
                       <DetailItem label="Subject">{assignment.subject}</DetailItem>
                    </div>
                    <DetailItem label="Due Date">{assignment.submissionDate}</DetailItem>
                    <DetailItem label="Status"><StatusBadge status={assignment.status} /></DetailItem>
                    <DetailItem label="Grade">{assignment.grade || 'Not Graded'}</DetailItem>
                    <div className="sm:col-span-2">
                        <DetailItem label="Submitted Files">
                           {(assignment.submittedFiles && assignment.submittedFiles.length > 0) ? (
                               <ul className="list-disc list-inside space-y-1">
                                   {assignment.submittedFiles.map(file => (
                                       <li key={file.name}>
                                           <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-600 hover:text-primary-500 hover:underline">
                                                {file.name}
                                           </a>
                                       </li>
                                   ))}
                               </ul>
                           ) : ('No files submitted.')}
                        </DetailItem>
                    </div>
                    {assignment.gradedFileUrl && (
                        <div className="sm:col-span-2">
                            <DetailItem label="Graded File">
                                <a href={assignment.gradedFileUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-600 hover:text-primary-500 hover:underline">
                                    View Graded File
                                </a>
                            </DetailItem>
                        </div>
                    )}
                </dl>
            </Modal>
        );
    };

    return (
        <>
            <Card title="Assignments">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".pdf,.doc,.docx,.txt,.zip"
                    multiple={user.role === Role.STUDENT}
                />
                <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mr-2">Filter:</span>
                         <button
                            onClick={() => handleFilterChange('All')}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
                                statusFilters.length === ALL_STATUSES.length
                                    ? 'bg-primary-600 text-white shadow'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                        >
                            All
                        </button>
                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                        {ALL_STATUSES.map(status => (
                            <button
                                key={status}
                                onClick={() => handleFilterChange(status)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
                                    statusFilters.includes(status)
                                        ? 'bg-primary-600 text-white shadow'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-grow max-w-xs ml-auto">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by subject..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                {user.role === Role.STAFF && <th scope="col" className="px-6 py-3">Student</th>}
                                <th scope="col" className="px-6 py-3">Subject</th>
                                <th scope="col" className="px-6 py-3">Due Date</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Grade</th>
                                <th scope="col" className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAssignments.map(item => {
                                const student = user.role === Role.STAFF ? MOCK_USERS.find(u => u.id === item.studentId) : null;
                                const uploadsForThisAssignment = Object.entries(fileUploadProgress)
                                    .filter(([key]) => key.startsWith(`${item.id}-`))
                                    .map(([key, value]) => ({ name: key.substring(item.id.length + 1), progress: value }));

                                return (
                                    <tr key={item.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                        {user.role === Role.STAFF && <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">{student?.name || 'N/A'}</td>}
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{item.subject}</td>
                                        <td className="px-6 py-4">{item.submissionDate}</td>
                                        <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                                        <td className="px-6 py-4 align-top">
                                            {item.status !== 'Pending' && user.role === Role.STAFF ? (
                                                <select
                                                    value={item.grade || ''}
                                                    onChange={(e) => handleGradeChange(item.id, e.target.value)}
                                                    className="mt-1 block w-24 px-2 py-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                >
                                                    <option value="">-</option>
                                                    <option value="A+">A+</option>
                                                    <option value="A">A</option>
                                                    <option value="B+">B+</option>
                                                    <option value="B">B</option>
                                                    <option value="C">C</option>
                                                    <option value="D">D</option>
                                                    <option value="F">F</option>
                                                </select>
                                            ) : (
                                                item.grade || '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <div className="flex items-start gap-2">
                                                <button onClick={() => setViewingAssignment(item)} className="text-slate-500 hover:text-primary-600 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" title="View details">
                                                    <EyeIcon className="w-5 h-5" />
                                                </button>
                                                <div className="space-y-2 w-full max-w-xs">
                                                
                                                {/* Student Actions */}
                                                {user.role === Role.STUDENT && (
                                                    <>
                                                        {item.submittedFiles?.map(file => (
                                                            <div key={file.name} className="bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-between text-sm">
                                                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-700 dark:text-slate-300 pl-3 pr-2 py-1.5 truncate flex-grow hover:underline" title={file.name}>
                                                                    {file.name}
                                                                </a>
                                                                {item.status !== 'Submitted' && (
                                                                    <button onClick={() => handleRemoveFile(item.id, file.name)} className="text-slate-500 hover:text-red-600 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 mr-1 flex-shrink-0" title="Remove file">
                                                                        <CloseIcon className="w-3 h-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {uploadsForThisAssignment.map(upload => (
                                                            <div key={upload.name} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate pr-2" title={upload.name}>{upload.name}</span>
                                                                    <span className="text-xs font-semibold text-primary-600">{upload.progress}%</span>
                                                                </div>
                                                                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                                                                    <div className="bg-primary-600 h-1.5 rounded-full transition-all duration-200" style={{ width: `${upload.progress}%` }}></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        
                                                        <div className="flex items-center gap-2 pt-1">
                                                            {['Pending', 'Submitted'].includes(item.status) && (
                                                                <button onClick={() => handleUploadClick(item.id)} className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-semibold disabled:opacity-50 disabled:cursor-not-allowed" disabled={uploadsForThisAssignment.length > 0}>
                                                                    <UploadIcon className="w-4 h-4" />
                                                                    <span>{(item.submittedFiles?.length ?? 0) > 0 ? 'Add More' : 'Upload Files'}</span>
                                                                </button>
                                                            )}
                                                            {item.status === 'Pending' && (item.submittedFiles?.length ?? 0) > 0 && (
                                                                <Button onClick={() => setSubmissionConfirm(item)} className="!py-1 !px-2.5 !text-xs ml-auto" disabled={uploadsForThisAssignment.length > 0}>
                                                                    Submit
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}

                                                {/* Staff Actions */}
                                                {user.role === Role.STAFF && (
                                                    <div className="text-sm">
                                                        {(item.submittedFiles?.length ?? 0) > 0 ? (
                                                            <ul className="list-disc list-inside">
                                                                {item.submittedFiles?.map(f => <li key={f.name}><a href={f.url} className="text-primary-600 hover:underline">{f.name}</a></li>)}
                                                            </ul>
                                                        ) : <p className="text-slate-500">No submission.</p>}
                                                        <div className="mt-2">
                                                            {item.gradedFileUrl ? (
                                                                <a href={item.gradedFileUrl} className="font-semibold text-green-600 hover:underline">View Graded File</a>
                                                            ) : (
                                                                <button onClick={() => handleUploadClick(item.id)} className="flex items-center gap-1.5 text-primary-600 hover:text-primary-800 font-semibold">
                                                                    <UploadIcon className="w-4 h-4" />
                                                                    <span>Upload Graded File</span>
                                                                </button>
                                                            )}
                                                            {uploadsForThisAssignment.map(upload => <div key={upload.name}>{upload.name} uploading...</div>)}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Parent Actions */}
                                                {user.role === Role.PARENT && (
                                                    <div className="text-sm">
                                                        {item.gradedFileUrl ? (
                                                            <a href={item.gradedFileUrl} className="font-semibold text-green-600 hover:underline">View Graded File</a>
                                                        ) : ((item.submittedFiles?.length ?? 0) > 0 ? (
                                                            <ul className="list-disc list-inside">
                                                                {item.submittedFiles?.map(f => <li key={f.name}><a href={f.url} className="text-primary-600 hover:underline">{f.name}</a></li>)}
                                                            </ul>
                                                        ) : (
                                                             <p className="text-slate-500">No submission.</p>
                                                        ))}
                                                    </div>
                                                )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                     {assignments.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-4">No assignments found for this class.</p>}
                     {assignments.length > 0 && filteredAssignments.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-4">No assignments match the current filters.</p>}
                </div>
            </Card>
            <ConfirmationDialog
                isOpen={!!submissionConfirm}
                onClose={() => setSubmissionConfirm(null)}
                onConfirm={handleConfirmSubmission}
                title="Confirm Submission"
                confirmText="Submit"
            >
                {submissionConfirm && <p>Are you sure you want to submit the assignment for <strong>{submissionConfirm.subject}</strong>? You will not be able to make changes after this.</p>}
            </ConfirmationDialog>
            
            {viewingAssignment && (
                <AssignmentDetailsModal
                    assignment={viewingAssignment}
                    isOpen={!!viewingAssignment}
                    onClose={() => setViewingAssignment(null)}
                    userRole={user.role}
                />
            )}
        </>
    );
};

interface RequestFormProps {
    type: 'No-Due' | 'On-Duty';
    onSubmit: () => void;
    onBack?: () => void;
}

const RequestForm: React.FC<RequestFormProps> = ({ type, onSubmit, onBack }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`${type} request submitted successfully! (Demo)`);
        onSubmit();
    };
    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md";
    const labelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-300";

    return (
        <Card title={`Apply for ${type}`}>
            <form onSubmit={handleSubmit}>
                {type === 'No-Due' && (
                     <>
                        <div className="mb-4">
                            <label htmlFor="department" className={labelClasses}>Department</label>
                            <select id="department" className={inputClasses} required>
                                <option>Library</option>
                                <option>Hostel</option>
                                <option>Labs</option>
                            </select>
                        </div>
                        <div className="mb-4">
                           <label htmlFor="requested-date" className={labelClasses}>Requested Date</label>
                           <input type="date" id="requested-date" className={inputClasses} required/>
                        </div>
                     </>
                )}
                 {type === 'On-Duty' && (
                    <>
                        <div className="mb-4">
                            <label htmlFor="event" className={labelClasses}>Event Name</label>
                            <input type="text" id="event" className={inputClasses} required/>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label htmlFor="from-date" className={labelClasses}>From Date</label>
                                <input type="date" id="from-date" className={inputClasses} required/>
                            </div>
                            <div>
                                <label htmlFor="to-date" className={labelClasses}>To Date</label>
                                <input type="date" id="to-date" className={inputClasses} required/>
                            </div>
                        </div>
                    </>
                )}
                <div className="mb-4">
                    <label htmlFor="remarks" className={labelClasses}>Reason / Remarks</label>
                    <textarea id="remarks" rows={4} className={inputClasses} required></textarea>
                </div>
                <div className="flex items-center gap-4">
                    <Button type="submit">Submit Request</Button>
                    {onBack && <Button type="button" variant="secondary" onClick={onBack}>Back</Button>}
                </div>
            </form>
        </Card>
    );
}

const StudentRequestView: React.FC = () => {
    const [formType, setFormType] = useState<'No-Due' | 'On-Duty' | null>(null);

    const handleFormSubmit = () => {
        setFormType(null);
    };

    if (formType) {
        return <RequestForm type={formType} onSubmit={handleFormSubmit} onBack={() => setFormType(null)} />;
    }

    return (
        <Card title="Manage Requests">
            <p className="mb-6 text-slate-600 dark:text-slate-400">Select the type of request you would like to submit.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button 
                    onClick={() => setFormType('No-Due')} 
                    className="p-6 bg-slate-50 hover:bg-primary-50 dark:bg-slate-700/50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">No-Due Request</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Submit a request for clearance from various departments like Library, Hostel, etc.</p>
                </button>
                <button 
                    onClick={() => setFormType('On-Duty')} 
                    className="p-6 bg-slate-50 hover:bg-primary-50 dark:bg-slate-700/50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">On-Duty Request</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Apply for leave for participating in events, symposiums, or sports.</p>
                </button>
            </div>
        </Card>
    );
};


const RequestListView: React.FC<{ user: User }> = () => {
    type SortConfig = { key: string; direction: 'ascending' | 'descending' } | null;

    const [noDueRequests, setNoDueRequests] = useState(MOCK_NODUE_REQUESTS);
    const [onDutyRequests, setOnDutyRequests] = useState(MOCK_ONDUTY_REQUESTS);
    const [noDueSortConfig, setNoDueSortConfig] = useState<SortConfig>({ key: 'requestedDate', direction: 'descending' });
    const [onDutySortConfig, setOnDutySortConfig] = useState<SortConfig>({ key: 'fromDate', direction: 'descending' });
    const [confirmAction, setConfirmAction] = useState<{
        action: () => void;
        title: string;
        message: React.ReactNode;
        variant: 'success' | 'danger';
        confirmText: string;
    } | null>(null);


    const sortedNoDueRequests = useMemo(() => {
        const sortableItems = [...noDueRequests];
        if (noDueSortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[noDueSortConfig.key as keyof NoDueRequest];
                const bValue = b[noDueSortConfig.key as keyof NoDueRequest];
                if (aValue < bValue) return noDueSortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return noDueSortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [noDueRequests, noDueSortConfig]);

    const sortedOnDutyRequests = useMemo(() => {
        const sortableItems = [...onDutyRequests];
        if (onDutySortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[onDutySortConfig.key as keyof OnDutyRequest];
                const bValue = b[onDutySortConfig.key as keyof OnDutyRequest];
                if (aValue < bValue) return onDutySortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return onDutySortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [onDutyRequests, onDutySortConfig]);

    const handleSort = (key: string, currentConfig: SortConfig, setConfig: React.Dispatch<React.SetStateAction<SortConfig>>) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (currentConfig && currentConfig.key === key && currentConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setConfig({ key, direction });
    };

    const handleRequestUpdate = <T extends {id: string}>(
        id: string, 
        status: RequestStatus, 
        list: T[], 
        setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
        setter(list.map(req => req.id === id ? { ...req, status } : req));
    };

    const handleConfirm = () => {
        if (confirmAction) {
            confirmAction.action();
            setConfirmAction(null);
        }
    };

    const handleCancel = () => {
        setConfirmAction(null);
    };

    const RequestTable = <T extends { id: string; studentName: string; status: RequestStatus; [key: string]: any }>({ title, data, onUpdate, headers, sortConfig, onSort, sortableKeys }: { title: string, data: T[], onUpdate: (id: string, status: RequestStatus) => void, headers: {key: string, label: string}[], sortConfig: SortConfig, onSort: (key: string) => void, sortableKeys: string[] }) => (
        <Card title={title} className="mb-8">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            {headers.map(h => 
                                <th key={h.key} scope="col" className="px-6 py-3">
                                    {sortableKeys.includes(h.key) ? (
                                        <button onClick={() => onSort(h.key)} className="flex items-center gap-1.5 py-1 -my-1 font-semibold text-slate-700 dark:text-slate-300 uppercase hover:text-primary-600 transition-colors">
                                            <span>{h.label}</span>
                                            {sortConfig?.key === h.key && (
                                                sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />
                                            )}
                                        </button>
                                    ) : (
                                        h.label
                                    )}
                                </th>
                            )}
                            <th scope="col" className="px-6 py-3">
                                <button onClick={() => onSort('status')} className="flex items-center gap-1.5 py-1 -my-1 font-semibold text-slate-700 dark:text-slate-300 uppercase hover:text-primary-600 transition-colors">
                                    <span>Status</span>
                                    {sortConfig?.key === 'status' && (
                                        sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />
                                    )}
                                </button>
                            </th>
                            <th scope="col" className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(req => (
                            <tr key={req.id} className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
                                {headers.map(h => <td key={h.key} className="px-6 py-4">{req[h.key]}</td>)}
                                <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button onClick={() => setConfirmAction({
                                        action: () => onUpdate(req.id, RequestStatus.APPROVED),
                                        title: 'Confirm Approval',
                                        message: <p>Are you sure you want to approve the request from <strong>{req.studentName}</strong>?</p>,
                                        variant: 'success',
                                        confirmText: 'Approve',
                                    })} className="text-green-600 hover:text-green-800"><ApproveIcon className="w-5 h-5"/></button>
                                    <button onClick={() => setConfirmAction({
                                        action: () => onUpdate(req.id, RequestStatus.REJECTED),
                                        title: 'Confirm Rejection',
                                        message: <p>Are you sure you want to reject the request from <strong>{req.studentName}</strong>?</p>,
                                        variant: 'danger',
                                        confirmText: 'Reject',
                                    })} className="text-red-600 hover:text-red-800"><RejectIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    return (
        <>
            <RequestTable 
                title="No-Due Requests"
                data={sortedNoDueRequests}
                onUpdate={(id, status) => handleRequestUpdate(id, status, noDueRequests, setNoDueRequests)}
                headers={[{key: 'studentName', label: 'Student'}, {key: 'department', label: 'Department'}, {key: 'requestedDate', label: 'Date'}]}
                sortConfig={noDueSortConfig}
                onSort={(key) => handleSort(key, noDueSortConfig, setNoDueSortConfig)}
                sortableKeys={['studentName', 'requestedDate']}
            />
            <RequestTable 
                title="On-Duty Requests"
                data={sortedOnDutyRequests}
                onUpdate={(id, status) => handleRequestUpdate(id, status, onDutyRequests, setOnDutyRequests)}
                headers={[{key: 'studentName', label: 'Student'}, {key: 'eventName', label: 'Event'}, {key: 'fromDate', label: 'From'}, {key: 'toDate', label: 'To'}]}
                sortConfig={onDutySortConfig}
                onSort={(key) => handleSort(key, onDutySortConfig, setOnDutySortConfig)}
                sortableKeys={['studentName', 'fromDate']}
            />
             {confirmAction && (
                <ConfirmationDialog
                    isOpen={!!confirmAction}
                    onClose={handleCancel}
                    onConfirm={handleConfirm}
                    title={confirmAction.title}
                    confirmText={confirmAction.confirmText}
                    confirmVariant={confirmAction.variant}
                >
                    {confirmAction.message}
                </ConfirmationDialog>
            )}
        </>
    );
}

const FeedbackView: React.FC<{ user: User, selectedClassId: string | null }> = ({ user, selectedClassId }) => {
    const studentId = user.role === Role.PARENT ? user.studentId : user.id;
    const feedbacks = MOCK_FEEDBACK.filter(f => f.studentId === studentId && f.classId === selectedClassId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Feedback submitted successfully! (Demo)');
        (e.target as HTMLFormElement).reset();
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm";
    const labelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-300";

    return (
        <div>
            {user.role === Role.STUDENT && (
                <Card title="Submit Feedback" className="mb-8">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="staff" className={labelClasses}>Staff Member</label>
                            <select id="staff" className={inputClasses} required>
                                <option>Dr. Robert Smith</option>
                                <option>Prof. Jane Doe</option>
                            </select>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="comments" className={labelClasses}>Comments</label>
                            <textarea id="comments" rows={4} className={inputClasses} required></textarea>
                        </div>
                        <Button type="submit">Submit</Button>
                    </form>
                </Card>
            )}
             <Card title="Feedback History">
                {feedbacks.length > 0 ? (
                    <ul className="space-y-4">
                        {feedbacks.map(fb => (
                            <li key={fb.id} className="p-4 border dark:border-slate-700 rounded-lg">
                               <p className="font-semibold text-slate-800 dark:text-slate-200">Feedback for {fb.staffName}</p>
                               <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">"{fb.comments}"</p>
                               <p className="text-xs text-slate-400 dark:text-slate-500 text-right mt-2">{fb.createdDate}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">No feedback found for this class.</p>
                )}
            </Card>
        </div>
    );
};

const NotificationView: React.FC<{ notifications: Notification[], user: User }> = ({ notifications, user }) => {
    const userNotifications = notifications.filter(n => n.userId === user.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return (
        <Card title="Notifications">
             <div className="space-y-3">
                {userNotifications.length > 0 ? userNotifications.map(n => (
                    <div key={n.id} className={`p-4 rounded-lg flex items-start gap-4 ${!n.read ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-white dark:bg-slate-800'}`}>
                        <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-primary-500" hidden={n.read}></div>
                        <div className="flex-grow">
                            <p className="text-sm text-slate-700 dark:text-slate-300">{n.message}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                )) : (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">You have no notifications.</p>
                )}
            </div>
        </Card>
    );
};

interface MessagesViewProps {
    user: User;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    selectedClassId: string | null;
}

const MessagesView: React.FC<MessagesViewProps> = ({ user, messages, setMessages, addNotification, selectedClassId }) => {
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const childUser = user.role === Role.PARENT ? MOCK_USERS.find(u => u.id === user.studentId) : null;
    const [searchTerm, setSearchTerm] = useState('');

    // Fix: Define a recursive type for messages with replies to correctly type the threaded conversation data structure.
    type MessageWithReplies = Message & { replies: MessageWithReplies[] };

    const conversations = useMemo(() => {
        if (!selectedClassId) return [];

        const classMessages = messages.filter(m => m.classId === selectedClassId);
        const convos: { [key: string]: { user: User; messages: Message[]; lastMessage: Message; isChildsChat?: boolean } } = {};
        const childId = user.role === Role.PARENT ? user.studentId : null;
    
        classMessages.forEach(message => {
            let otherUserId: string | null = null;
            let isChildsChat = false;

            if (message.senderId === user.id || message.receiverId === user.id) {
                otherUserId = message.senderId === user.id ? message.receiverId : message.senderId;
            } else if (childId && (message.senderId === childId || message.receiverId === childId)) {
                const otherPartyId = message.senderId === childId ? message.receiverId : message.senderId;
                const otherPartyUser = MOCK_USERS.find(u => u.id === otherPartyId);
                if (otherPartyUser && otherPartyUser.role === Role.STAFF) {
                    otherUserId = otherPartyId;
                    isChildsChat = true;
                }
            }
                
            if (otherUserId) {
                const otherUser = MOCK_USERS.find(u => u.id === otherUserId);
                if (otherUser) {
                    const convoKey = isChildsChat ? `${otherUserId}-child` : otherUserId;

                    if (!convos[convoKey]) {
                        convos[convoKey] = { user: otherUser, messages: [], lastMessage: message, isChildsChat };
                    }
                    convos[convoKey].messages.push(message);
                }
            }
        });

        Object.values(convos).forEach(convo => {
            convo.messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            convo.lastMessage = convo.messages[convo.messages.length - 1];
        });

        const allConvos = Object.values(convos)
            .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());

        if (!searchTerm.trim()) {
            return allConvos;
        }

        return allConvos.filter(convo =>
            convo.user.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

    }, [messages, user.id, user.role, user.studentId, selectedClassId, searchTerm]);

    useEffect(() => {
        const firstConvo = conversations.length > 0 ? conversations[0] : null;
        const newActiveId = firstConvo ? (firstConvo.isChildsChat ? `${firstConvo.user.id}-child` : firstConvo.user.id) : null;
        setActiveConversationId(newActiveId);
    }, [conversations]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, activeConversationId]);

    const activeConversation = conversations.find(c => (c.isChildsChat ? `${c.user.id}-child` : c.user.id) === activeConversationId);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && activeConversation && selectedClassId) {
            const newMsg: Message = {
                id: `MSG${Date.now()}`,
                senderId: user.id,
                receiverId: activeConversation.user.id,
                classId: selectedClassId,
                content: newMessage.trim(),
                timestamp: new Date().toISOString(),
                read: false,
                parentMessageId: replyingTo?.id,
            };
            setMessages(prev => [...prev, newMsg]);
            setNewMessage('');
            setReplyingTo(null);

            // Simulate reply and push notification
            setTimeout(() => {
                const replyContent = "Thanks for your message. I will get back to you shortly.";
                const replyMsg: Message = {
                    id: `MSG${Date.now() + 1}`,
                    senderId: activeConversation.user.id,
                    receiverId: user.id,
                    classId: selectedClassId,
                    content: replyContent,
                    timestamp: new Date().toISOString(),
                    read: false,
                    parentMessageId: newMsg.id,
                };
                setMessages(prev => [...prev, replyMsg]);
                
                const notificationPayload = {
                    userId: user.id,
                    message: `New message from ${activeConversation.user.name}`,
                    type: NotificationType.INFO,
                };
                addNotification(notificationPayload);

                if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification(`New message from ${activeConversation.user.name}`, {
                        body: replyContent,
                        icon: '/vite.svg',
                    });
                }
            }, 2000);
        }
    };

    const buildMessageTree = (convoMessages: Message[]): MessageWithReplies[] => {
        const messageMap: { [key: string]: MessageWithReplies } = {};
        convoMessages.forEach(msg => {
            messageMap[msg.id] = { ...msg, replies: [] };
        });

        const tree: MessageWithReplies[] = [];
        convoMessages.forEach(msg => {
            if (msg.parentMessageId && messageMap[msg.parentMessageId]) {
                messageMap[msg.parentMessageId].replies.push(messageMap[msg.id]);
            } else {
                tree.push(messageMap[msg.id]);
            }
        });
        return tree;
    };
    
    const MessageThread: React.FC<{ message: MessageWithReplies; level: number }> = ({ message, level }) => {
        const sender = MOCK_USERS.find(u => u.id === message.senderId);
        const isMyMessage = sender?.id === user.id;
    
        let alignmentClass = '';
        let bubbleClass = '';
        let nameBlock: React.ReactNode = null;
    
        const roleStyles: { [key in Role]?: { bubble: string; name: string; darkBubble: string; darkName: string; } } = {
            [Role.STAFF]: { bubble: 'bg-blue-100 text-blue-900', name: 'text-blue-800 font-bold', darkBubble: 'dark:bg-blue-900/50 dark:text-blue-200', darkName: 'dark:text-blue-300 font-bold' },
            [Role.STUDENT]: { bubble: 'bg-green-100 text-green-900', name: 'text-green-800 font-bold', darkBubble: 'dark:bg-green-900/50 dark:text-green-200', darkName: 'dark:text-green-300 font-bold' },
            [Role.PARENT]: { bubble: 'bg-indigo-100 text-indigo-900', name: 'text-indigo-800 font-bold', darkBubble: 'dark:bg-indigo-900/50 dark:text-indigo-200', darkName: 'dark:text-indigo-300 font-bold' },
        };
    
        if (activeConversation?.isChildsChat) {
            const isStaffMessage = sender?.role === Role.STAFF;
            alignmentClass = isStaffMessage ? 'justify-start' : 'justify-end';
            
            if (sender?.role && roleStyles[sender.role]) {
                const style = roleStyles[sender.role]!;
                bubbleClass = `${style.bubble} ${style.darkBubble}`;
                nameBlock = <p className={`text-xs mb-1 ${style.name} ${style.darkName}`}>{sender.name}</p>;
            } else {
                bubbleClass = 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm';
            }
        } else {
            alignmentClass = isMyMessage ? 'justify-end' : 'justify-start';
            
            if (isMyMessage) {
                bubbleClass = 'bg-primary-600 text-white';
            } else if (sender?.role && roleStyles[sender.role]) {
                const style = roleStyles[sender.role]!;
                bubbleClass = `${style.bubble} ${style.darkBubble}`;
                nameBlock = <p className={`text-xs mb-1 ${style.name} ${style.darkName}`}>{sender.name}</p>;
            } else {
                bubbleClass = 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 shadow-sm';
            }
        }
    
        const repliedToMessage = message.parentMessageId ? messages.find(m => m.id === message.parentMessageId) : null;
    
        return (
            <div className="flex flex-col">
                <div className={`flex items-start gap-3 ${alignmentClass}`}>
                    <div className="flex-grow-0">
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-xl group ${bubbleClass}`}>
                             <div className="px-4 py-2">
                                {nameBlock}
                                {repliedToMessage && (
                                    <div className="text-xs opacity-70 border-l-2 border-opacity-50 pl-2 mb-1">
                                        <p className="font-semibold">{MOCK_USERS.find(u => u.id === repliedToMessage.senderId)?.name}</p>
                                        <p className="truncate">{repliedToMessage.content}</p>
                                    </div>
                                )}
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                <p className={`text-xs mt-1 ${bubbleClass.includes('text-white') ? 'text-primary-200' : 'text-slate-400 dark:text-slate-500'} text-right`}>
                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    </div>
                    {!activeConversation?.isChildsChat && (
                        <button onClick={() => setReplyingTo(message)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-primary-600 p-1 self-center">
                            <ReplyIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
                 {message.replies.length > 0 && (
                    <div className={`border-l-2 ml-4 pl-4 mt-2 space-y-3 ${alignmentClass === 'justify-end' ? 'border-primary-200 dark:border-primary-700' : 'border-slate-200 dark:border-slate-700'}`}>
                        {message.replies.map(reply => <MessageThread key={reply.id} message={reply} level={level + 1} />)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card title="Messages" className="!p-0">
            <div className="flex h-[calc(100vh-12rem)]">
                <div className="w-1/3 border-r border-slate-200 dark:border-slate-700 flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="w-5 h-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {conversations.map(convo => {
                            const convoId = convo.isChildsChat ? `${convo.user.id}-child` : convo.user.id;
                            const unreadCount = convo.messages.filter(m => !m.read && (m.receiverId === user.id || m.receiverId === user.studentId)).length;
                            return (
                                <button
                                    key={convoId}
                                    onClick={() => setActiveConversationId(convoId)}
                                    className={`w-full text-left p-4 flex gap-3 items-center border-l-4 ${activeConversationId === convoId ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                >
                                    <img src={`https://i.pravatar.cc/48?u=${convo.user.id}`} alt={convo.user.name} className="w-12 h-12 rounded-full flex-shrink-0" />
                                    <div className="flex-grow overflow-hidden">
                                        <div className="flex justify-between items-center">
                                            <p className={`font-semibold truncate ${convo.isChildsChat ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {convo.isChildsChat && childUser ? `${childUser.name} <> ${convo.user.name}` : convo.user.name}
                                            </p>
                                            {unreadCount > 0 && <span className="text-xs bg-primary-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">{unreadCount}</span>}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{convo.lastMessage.content}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="w-2/3 flex flex-col bg-slate-50 dark:bg-slate-800/50">
                    {activeConversation ? (
                        <>
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                                <img src={`https://i.pravatar.cc/40?u=${activeConversation.user.id}`} alt={activeConversation.user.name} className="w-10 h-10 rounded-full" />
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-200">{activeConversation.user.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{activeConversation.user.role}</p>
                                </div>
                            </div>
                            <div className="flex-grow p-4 overflow-y-auto space-y-4">
                                {buildMessageTree(activeConversation.messages).map(msg => <MessageThread key={msg.id} message={msg} level={0} />)}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                                {replyingTo && (
                                    <div className="bg-slate-100 dark:bg-slate-700 rounded-t-lg p-2 text-sm text-slate-600 dark:text-slate-300 flex justify-between items-center">
                                        <div>
                                            Replying to <span className="font-semibold">{MOCK_USERS.find(u => u.id === replyingTo.senderId)?.name}</span>
                                            <p className="truncate italic">"{replyingTo.content}"</p>
                                        </div>
                                        <button onClick={() => setReplyingTo(null)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                                            <CloseIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className={`block w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${replyingTo ? 'rounded-b-lg' : 'rounded-lg'}`}
                                        disabled={activeConversation.isChildsChat}
                                    />
                                    <Button type="submit" className="!p-2.5" disabled={!newMessage.trim() || activeConversation.isChildsChat}>
                                        <SendIcon className="w-5 h-5" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                            <MessageIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-lg font-semibold">Select a conversation</p>
                            <p>Or start a new one from a user profile.</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

const AnnouncementsView: React.FC<{ user: User, selectedClassId: string | null }> = ({ user, selectedClassId }) => {
    // Announcements for the selected class, or global ones if no class is selected or if they are targeted to all.
    const relevantAnnouncements = MOCK_ANNOUNCEMENTS.filter(a => {
        const isClassMatch = !a.classId || a.classId === selectedClassId;
        const isAudienceMatch = a.targetAudience === 'ALL' || a.targetAudience === user.role;
        return isClassMatch && isAudienceMatch;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <Card title="Announcements">
            <div className="space-y-6">
                {relevantAnnouncements.map(ann => (
                    <div key={ann.id} className="p-4 border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20 rounded-r-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{ann.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    By {ann.staffName} on {new Date(ann.timestamp).toLocaleDateString()}
                                    {ann.classId && ` for ${MOCK_CLASSES.find(c => c.id === ann.classId)?.name}`}
                                </p>
                            </div>
                            <span className="text-xs font-semibold px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-full">{ann.targetAudience}</span>
                        </div>
                        <p className="mt-3 text-slate-700 dark:text-slate-300">{ann.content}</p>
                    </div>
                ))}
            </div>
            {relevantAnnouncements.length === 0 && <p className="text-center py-4 text-slate-500 dark:text-slate-400">No announcements found.</p>}
        </Card>
    );
};

const ClassesView: React.FC<{ user: User, classes: Class[], classMemberships: ClassMembership[], onSelectClass: (classId: string) => void, setActiveView: (view: string) => void }> = ({ user, classes, classMemberships, onSelectClass, setActiveView }) => {
    
    const getClassStudents = (classId: string) => {
        const studentMemberships = classMemberships.filter(cm => cm.classId === classId && cm.role === Role.STUDENT);
        return studentMemberships.map(cm => MOCK_USERS.find(u => u.id === cm.userId)).filter((u): u is User => !!u);
    };

    const handleClassClick = (classId: string) => {
        onSelectClass(classId);
        setActiveView('class-dashboard');
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Manage Classes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {classes.map(cls => {
                    const students = getClassStudents(cls.id);
                    return (
                        <div key={cls.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md dark:shadow-slate-700/50 overflow-hidden flex flex-col">
                            <div className="p-6 flex-grow flex flex-col">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{cls.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex-grow">{cls.description}</p>
                                
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold text-slate-600 dark:text-slate-400 mb-2">Students ({students.length})</h4>
                                    {students.length > 0 ? (
                                        <div className="overflow-y-auto max-h-48 pr-2 -mr-2">
                                            <ul className="space-y-2">
                                                {students.map(student => (
                                                    <li key={student.id} className="flex items-center gap-3">
                                                        <img src={`https://i.pravatar.cc/32?u=${student.id}`} alt={student.name} className="w-8 h-8 rounded-full" />
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{student.name}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{student.rollNo}</p>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">No students enrolled.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4">
                                <Button className="w-full" onClick={() => handleClassClick(cls.id)}>View Dashboard</Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Main Dashboard Component
const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, theme, toggleTheme, updateUser }) => {
  const [activeView, setActiveView] = useState('overview');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [classes, setClasses] = useState(MOCK_CLASSES);
  const [classMemberships, setClassMemberships] = useState(MOCK_CLASS_MEMBERSHIPS);
  const userClasses = classes.filter(c => user.classIds.includes(c.id));
  const [selectedClassId, setSelectedClassId] = useState<string | null>(userClasses.length > 0 ? userClasses[0].id : null);

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `N${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const navItems = {
    [Role.STUDENT]: [
      { name: 'Overview', icon: HomeIcon, view: 'overview' },
      { name: 'Class Dashboard', icon: ClassIcon, view: 'class-dashboard' },
      { name: 'Attendance', icon: AttendanceIcon, view: 'attendance' },
      { name: 'Assignments', icon: AssignmentIcon, view: 'assignments' },
      { name: 'Requests', icon: RequestIcon, view: 'requests' },
      { name: 'Messages', icon: MessageIcon, view: 'messages' },
      { name: 'Feedback', icon: FeedbackIcon, view: 'feedback' },
      { name: 'Announcements', icon: AnnouncementIcon, view: 'announcements' },
    ],
    [Role.STAFF]: [
      { name: 'Overview', icon: HomeIcon, view: 'overview' },
      { name: 'Class Dashboard', icon: ClassIcon, view: 'class-dashboard' },
      { name: 'Manage Classes', icon: ClassIcon, view: 'classes' },
      { name: 'Manage Requests', icon: RequestIcon, view: 'requests-list' },
      { name: 'Assignments', icon: AssignmentIcon, view: 'assignments' },
      { name: 'Messages', icon: MessageIcon, view: 'messages' },
      { name: 'Announcements', icon: AnnouncementIcon, view: 'announcements' },
    ],
    [Role.PARENT]: [
      { name: 'Overview', icon: HomeIcon, view: 'overview' },
      { name: 'Class Dashboard', icon: ClassIcon, view: 'class-dashboard' },
      { name: 'Attendance', icon: AttendanceIcon, view: 'attendance' },
      { name: 'Assignments', icon: AssignmentIcon, view: 'assignments' },
      { name: 'Messages', icon: MessageIcon, view: 'messages' },
      { name: 'Announcements', icon: AnnouncementIcon, view: 'announcements' },
    ],
  };

  const renderContent = () => {
    switch (activeView) {
      case 'overview': return <OverviewContent user={user} setActiveView={setActiveView} selectedClassId={selectedClassId} classes={classes} />;
      case 'class-dashboard': return <ClassDashboardView user={user} selectedClassId={selectedClassId} setActiveView={setActiveView} classes={classes} classMemberships={classMemberships} />;
      case 'attendance': return user.role !== Role.STAFF && <AttendanceView user={user} selectedClassId={selectedClassId} />;
      case 'assignments': return <AssignmentView user={user} selectedClassId={selectedClassId} addNotification={addNotification} />;
      case 'requests': return user.role === Role.STUDENT && <StudentRequestView />;
      case 'requests-list': return user.role === Role.STAFF && <RequestListView user={user} />;
      case 'feedback': return user.role === Role.STUDENT && <FeedbackView user={user} selectedClassId={selectedClassId} />;
      case 'notifications': return <NotificationView notifications={notifications} user={user} />;
      case 'messages': return <MessagesView user={user} messages={messages} setMessages={setMessages} addNotification={addNotification} selectedClassId={selectedClassId} />;
      case 'announcements': return <AnnouncementsView user={user} selectedClassId={selectedClassId} />;
      case 'profile': return <ProfileView user={user} />;
      case 'classes': return user.role === Role.STAFF && <ClassesView user={user} classes={classes} classMemberships={classMemberships} onSelectClass={setSelectedClassId} setActiveView={setActiveView} />;
      default: return <OverviewContent user={user} setActiveView={setActiveView} selectedClassId={selectedClassId} classes={classes} />;
    }
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl font-bold text-primary-700 dark:text-primary-400">Student Portal</h1>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1">
          <CloseIcon />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems[user.role].map(item => (
          <button
            key={item.view}
            onClick={() => { setActiveView(item.view); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeView === item.view
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => { setActiveView('profile'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <UserIcon className="w-5 h-5" />
            <span>My Profile</span>
          </button>
      </div>
    </>
  );

  const unreadNotifications = notifications.filter(n => n.userId === user.id && !n.read).length;
  
  const getRelevantClassesForDropdown = () => {
    if (user.role === Role.STAFF) {
        return classes; // Staff can see all classes
    }
    return userClasses; // Students/Parents see only their assigned classes
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col`}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-slate-700/50 flex items-center justify-between p-4 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1 text-slate-600 dark:text-slate-300">
                <MenuIcon />
            </button>
            <div className="relative">
                <select 
                    value={selectedClassId || ''} 
                    onChange={e => setSelectedClassId(e.target.value)}
                    className="appearance-none bg-slate-100 dark:bg-slate-700 border-none rounded-lg pl-4 pr-10 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    {getRelevantClassesForDropdown().map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                     <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                {theme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
            </button>
            <button onClick={() => setActiveView('notifications')} className="relative p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <NotificationIcon className="w-6 h-6"/>
                {unreadNotifications > 0 && <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800"></span>}
            </button>
            <div className="flex items-center gap-3">
              <img src={`https://i.pravatar.cc/40?u=${user.id}`} alt="User" className="w-10 h-10 rounded-full" />
              <div>
                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.role}</p>
              </div>
            </div>
            <button onClick={onLogout} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" title="Logout">
              <LogoutIcon className="w-6 h-6"/>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
