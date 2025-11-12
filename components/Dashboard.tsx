import React, { useState, ReactNode, useEffect, useMemo, useRef, useCallback } from 'react';
import { User, Role, RequestStatus, NoDueRequest, OnDutyRequest, Assignment, Attendance, Feedback, Notification, AttendanceStatus, Message, Announcement, NotificationType, Class, ClassMembership, SubmittedFile, Event, Section, LeaveRequest, ClassMaterial, Exam, ExamMark, MarkComment } from '../types';
import { MOCK_USERS, MOCK_NODUE_REQUESTS, MOCK_ONDUTY_REQUESTS, MOCK_ASSIGNMENTS, MOCK_ATTENDANCE, MOCK_FEEDBACK, MOCK_NOTIFICATIONS, MOCK_MESSAGES, MOCK_ANNOUNCEMENTS, MOCK_CLASSES, MOCK_CLASS_MEMBERSHIPS, MOCK_EVENTS, MOCK_SECTIONS, MOCK_LEAVE_REQUESTS, MOCK_CLASS_MATERIALS, MOCK_EXAMS, MOCK_EXAM_MARKS, MOCK_MARK_COMMENTS } from '../constants';
import { Card, Button, StatusBadge, ConfirmationDialog, Modal, ProfilePicture } from './UI';
import { HomeIcon, AttendanceIcon, AssignmentIcon, RequestIcon, FeedbackIcon, NotificationIcon, LogoutIcon, MenuIcon, CloseIcon, ApproveIcon, RejectIcon, UserIcon, SortAscIcon, SortDescIcon, UploadIcon, MessageIcon, SendIcon, AnnouncementIcon, ReplyIcon, ClassIcon, SunIcon, MoonIcon, SpinnerIcon, SearchIcon, EyeIcon, EditIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, GraduationCapIcon, KeyIcon, SparklesIcon, LeaveIcon, DocumentTextIcon, BookOpenIcon, ClipboardCheckIcon } from './Icons';
import ManageClassesView from './ManageClassesView';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  updateUser: (user: User) => void;
  allUsers: User[];
  onUpdateAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const inputClasses = "block w-full p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900";
const searchInputClasses = "pl-10 pr-4 py-2 w-full border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900";

// Sub-components for different views
const OverviewContent: React.FC<{ user: User, setActiveView: (view: string) => void, selectedClassId: string | null, classes: Class[] }> = ({ user, setActiveView, selectedClassId, classes }) => {
  const getStat = (title: string, value: string | number, color: string, index: number) => (
    <Card className={`bg-gradient-to-br ${color} text-white animate-slideInUp !bg-opacity-100`} style={{ animationDelay: `${index * 100}ms` }}>
      <p className="text-sm opacity-80">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </Card>
  );

  const studentId = user.role === Role.PARENT ? user.studentId : user.id;

  const getFilteredData = <T extends { studentId: string; classId?: string; }>(data: T[]) => {
    if (!studentId) return [];
    if (!selectedClassId || selectedClassId === 'ALL') return data.filter(item => item.studentId === studentId);
    return data.filter(item => item.studentId === studentId && item.classId === selectedClassId);
  }

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const title = selectedClassId === 'ALL' ? 'Showing data for All Classes' : (selectedClass ? `Showing data for ${selectedClass.name}` : 'No class selected');

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
            {getStat(attendanceTitle, `${attendancePercentage}%`, 'from-blue-500 to-indigo-600', 0)}
            {getStat(assignmentsTitle, pendingAssignments, 'from-amber-500 to-orange-600', 1)}
            {user.role === Role.STUDENT && getStat('Active Requests', activeRequests, 'from-green-500 to-emerald-600', 2)}
          </div>
           {user.role === Role.STUDENT && <div className="mt-8">
            <Card title="Quick Actions" className="animate-slideInUp" style={{ animationDelay: '400ms' }}>
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
       const assignmentsToGrade = MOCK_ASSIGNMENTS.filter(a => a.status === 'Submitted' && (selectedClassId === 'ALL' || a.classId === selectedClassId)).length;
       return (
        <div>
          <h2 className="text-2xl font-bold mb-1">Staff Overview</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{title}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getStat('Pending No-Due', pendingNoDue, 'from-blue-500 to-indigo-600', 0)}
            {getStat('Pending On-Duty', pendingOnDuty, 'from-amber-500 to-orange-600', 1)}
            {getStat('Assignments to Grade', assignmentsToGrade, 'from-green-500 to-emerald-600', 2)}
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
        return <Card title="No Class Selected" className="animate-scaleIn"><p>Please select a class from the dropdown above to view its dashboard.</p></Card>;
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
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
        .slice(0, 5);

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{selectedClass.name}</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedClass.description}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Recent Announcements" className="animate-slideInUp">
                        {classAnnouncements.length > 0 ? (
                            <div className="space-y-4">
                                {classAnnouncements.map(ann => (
                                    <div key={ann.id} className="border-b border-slate-200 dark:border-white/10 pb-3 last:border-b-0 last:pb-0">
                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{ann.title}</h4>
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

                    <Card title="Recent Assignments" className="animate-slideInUp" style={{ animationDelay: '100ms' }}>
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
                                            <tr key={asg.id} className="border-t border-slate-200 dark:border-white/10">
                                                {user.role === Role.STAFF && <td className="p-2">{MOCK_USERS.find(u => u.id === asg.studentId)?.name}</td>}
                                                <td className="p-2 font-medium text-slate-900 dark:text-slate-100">{asg.subject}</td>
                                                <td className="p-2">{asg.dueDate}</td>
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
                    <Card title="Members" className="animate-slideInUp" style={{ animationDelay: '200ms' }}>
                         <div>
                            <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-2">Staff ({staffMembers.length})</h4>
                            <ul className="space-y-2">
                                {staffMembers.map(member => (
                                    <li key={member.id} className="flex items-center gap-3">
                                        <ProfilePicture user={member} size="sm" />
                                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{member.name}</span>
                                    </li>
                                ))}
                            </ul>
                         </div>
                         <div className="mt-4">
                             <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-400 mb-2">Students ({studentMembers.length})</h4>
                            <ul className="space-y-1 -mx-1 pr-1 max-h-60 overflow-y-auto">
                                {studentMembers.map(member => (
                                    <li key={member.id} className="flex items-center gap-3 p-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <ProfilePicture user={member} size="sm" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{member.name}</p>
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

                    <Card title="Communication" className="animate-slideInUp" style={{ animationDelay: '300ms' }}>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Jump into the class conversation to ask questions or get help.</p>
                        <Button className="w-full" onClick={() => setActiveView('messages')}>Open Messages</Button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const ProfileView: React.FC<{ user: User; onUpdateUser: (user: User) => void, onChangePassword: (oldPass: string, newPass: string) => {success: boolean, message: string} }> = ({ user, onUpdateUser, onChangePassword }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableUser, setEditableUser] = useState(user);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      setEditableUser(user);
    }, [user]);

    const handleSave = () => {
        onUpdateUser(editableUser);
        setIsEditing(false);
    };
    
    const handleCancel = () => {
        setEditableUser(user);
        setIsEditing(false);
    };

    const handlePasswordModalClose = () => {
        setIsPasswordModalOpen(false);
        setPasswordError('');
        setPasswordSuccess('');
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
    };
    
    const handleChangePassword = () => {
      setPasswordError('');
      setPasswordSuccess('');
      if (newPassword !== confirmNewPassword) {
        setPasswordError("New passwords don't match.");
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError("New password must be at least 6 characters long.");
        return;
      }
      const result = onChangePassword(oldPassword, newPassword);
      if(result.success) {
          setPasswordSuccess(result.message);
          setTimeout(handlePasswordModalClose, 2000);
      } else {
          setPasswordError(result.message);
      }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditableUser(prev => ({ ...prev, profilePhotoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setEditableUser(prev => ({ ...prev, profilePhotoUrl: undefined }));
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">My Profile</h2>
            <Card className="animate-scaleIn">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="flex flex-col items-center w-32 flex-shrink-0">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*"
                        />
                        <ProfilePicture user={editableUser} size="xl" className="border-4 border-blue-200 dark:border-blue-700"/>
                        {isEditing && (
                            <div className="mt-4 flex flex-col items-center gap-2 w-full">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full"
                                >
                                    Change Photo
                                </Button>
                                {editableUser.profilePhotoUrl && (
                                    <button
                                        onClick={handleRemovePhoto}
                                        className="text-sm text-red-600 dark:text-red-500 hover:underline"
                                    >
                                        Remove Photo
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        {isEditing ? (
                             <input 
                                type="text"
                                value={editableUser.name}
                                onChange={(e) => setEditableUser(prev => ({ ...prev, name: e.target.value }))}
                                className="text-3xl font-bold text-slate-900 dark:text-slate-100 bg-transparent border-b-2 border-blue-300 dark:border-blue-700 focus:outline-none"
                            />
                        ) : (
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{user.name}</h3>
                        )}

                        {user.role === Role.STUDENT && (
                            <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">
                                {user.rollNo} &bull; {user.department}, Year {user.year}
                            </p>
                        )}
                         {user.role === Role.STAFF && (
                            <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">
                                {user.staffId} &bull; {user.designation}
                            </p>
                        )}
                        
                        <div className="mt-6 border-t dark:border-slate-700 pt-4">
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</dt>
                                    {isEditing ? (
                                        <input 
                                            type="email"
                                            value={editableUser.email}
                                            onChange={(e) => setEditableUser(prev => ({...prev, email: e.target.value}))}
                                            className="mt-1 text-sm text-slate-900 dark:text-slate-100 bg-transparent border-b dark:border-slate-600 focus:outline-none"
                                        />
                                    ): (
                                        <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{user.email}</dd>
                                    )}
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Role</dt>
                                    <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100 capitalize">{user.role.toLowerCase()}</dd>
                                </div>
                                {user.role === Role.PARENT && user.studentId && (
                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Child's Name</dt>
                                        <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{MOCK_USERS.find(u => u.id === user.studentId)?.name || 'N/A'}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        <div className="mt-6 flex gap-4">
                            {isEditing ? (
                                <>
                                    <Button onClick={handleSave}>Save Changes</Button>
                                    <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                                    <Button variant="secondary" onClick={() => setIsPasswordModalOpen(true)} className="flex items-center gap-2">
                                        <KeyIcon className="w-4 h-4" /> Change Password
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <Modal isOpen={isPasswordModalOpen} onClose={handlePasswordModalClose} title="Change Password"
                footer={<><Button variant="secondary" onClick={handlePasswordModalClose}>Cancel</Button><Button onClick={handleChangePassword}>Update Password</Button></>}
            >
                <div className="space-y-4">
                    {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                    {passwordSuccess && <p className="text-green-500 text-sm">{passwordSuccess}</p>}
                    <div>
                        <label className="block text-sm font-medium">Old Password</label>
                        <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className={`mt-1 ${inputClasses}`} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">New Password</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={`mt-1 ${inputClasses}`} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Confirm New Password</label>
                        <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className={`mt-1 ${inputClasses}`} />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const NoDueRequestView: React.FC<{
  user: User;
  requests: NoDueRequest[];
  onAddRequest: (department: string, remarks: string) => void;
  onUpdateStatus: (requestId: string, status: RequestStatus, remarks?: string) => void;
}> = ({ user, requests, onAddRequest, onUpdateStatus }) => {
    const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
    const [newRequestDept, setNewRequestDept] = useState('');
    const [newRequestRemarks, setNewRequestRemarks] = useState('');
    const [confirmAction, setConfirmAction] = useState<{ action: 'Approve' | 'Reject', request: NoDueRequest } | null>(null);

    const studentId = user.role === Role.PARENT ? user.studentId : user.id;

    const userRequests = useMemo(() => {
        if (user.role === Role.STAFF) return requests;
        return requests.filter(r => r.studentId === studentId);
    }, [user, requests, studentId]);

    const handleNewRequestSubmit = () => {
        if (!newRequestDept) return; // Basic validation
        onAddRequest(newRequestDept, newRequestRemarks);
        setIsNewRequestModalOpen(false);
        setNewRequestDept('');
        setNewRequestRemarks('');
    };

    const handleConfirm = () => {
        if (confirmAction) {
            onUpdateStatus(confirmAction.request.id, confirmAction.action === 'Approve' ? RequestStatus.APPROVED : RequestStatus.REJECTED);
            setConfirmAction(null);
        }
    };
    
    const DEPARTMENTS = ['Library', 'Hostel', 'Sports', 'Labs', 'Accounts'];

    return (
        <Card className="animate-slideInUp">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">No-Due Requests</h3>
                {user.role === Role.STUDENT && (
                    <Button onClick={() => setIsNewRequestModalOpen(true)}>New Request</Button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                        <tr>
                            {user.role !== Role.STUDENT && <th className="px-4 py-2">Student Name</th>}
                            <th className="px-4 py-2">Department</th>
                            <th className="px-4 py-2">Requested Date</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Remarks</th>
                            {user.role === Role.STAFF && <th className="px-4 py-2 text-center">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {userRequests.map(req => (
                            <tr key={req.id} className="border-b dark:border-slate-700">
                                {user.role !== Role.STUDENT && <td className="px-4 py-2">{req.studentName}</td>}
                                <td className="px-4 py-2">{req.department}</td>
                                <td className="px-4 py-2">{req.requestedDate}</td>
                                <td className="px-4 py-2"><StatusBadge status={req.status} /></td>
                                <td className="px-4 py-2">{req.remarks}</td>
                                {user.role === Role.STAFF && (
                                    <td className="px-4 py-2">
                                        {req.status === RequestStatus.PENDING && (
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => setConfirmAction({ action: 'Approve', request: req })} className="p-1.5 text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-500/20" aria-label="Approve">
                                                    <ApproveIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => setConfirmAction({ action: 'Reject', request: req })} className="p-1.5 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" aria-label="Reject">
                                                    <RejectIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {userRequests.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-8">No requests found.</p>}
            
            <Modal
                isOpen={isNewRequestModalOpen}
                onClose={() => setIsNewRequestModalOpen(false)}
                title="New No-Due Request"
                footer={<><Button variant="secondary" onClick={() => setIsNewRequestModalOpen(false)}>Cancel</Button><Button onClick={handleNewRequestSubmit}>Submit Request</Button></>}
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="department" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                        <select
                            id="department"
                            value={newRequestDept}
                            onChange={(e) => setNewRequestDept(e.target.value)}
                            className={inputClasses}
                        >
                            <option value="" disabled>Select a department</option>
                            {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="remarks" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks (Optional)</label>
                        <textarea
                            id="remarks"
                            rows={3}
                            value={newRequestRemarks}
                            onChange={(e) => setNewRequestRemarks(e.target.value)}
                            className={inputClasses}
                            placeholder="Enter any additional information..."
                        />
                    </div>
                </div>
            </Modal>
            
            <ConfirmationDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirm}
                title={`${confirmAction?.action} Request`}
                confirmText={confirmAction?.action}
                confirmVariant={confirmAction?.action === 'Approve' ? 'success' : 'danger'}
            >
                Are you sure you want to {confirmAction?.action.toLowerCase()} the no-due request from <strong>{confirmAction?.request.studentName}</strong> for the <strong>{confirmAction?.request.department}</strong> department?
            </ConfirmationDialog>
        </Card>
    );
};


const OnDutyRequestView: React.FC<{
    user: User;
    requests: OnDutyRequest[];
    onUpdateStatus: (requestId: string, status: RequestStatus) => void;
}> = ({ user, requests, onUpdateStatus }) => {
    const [confirmAction, setConfirmAction] = useState<{ action: 'Approve' | 'Reject'; request: OnDutyRequest } | null>(null);
    const studentId = user.role === Role.PARENT ? user.studentId : user.id;

    const userRequests = useMemo(() => {
        if (user.role === Role.STAFF) return requests;
        return requests.filter(r => r.studentId === studentId);
    }, [user, requests, studentId]);

    const handleConfirm = () => {
        if (confirmAction) {
            onUpdateStatus(confirmAction.request.id, confirmAction.action === 'Approve' ? RequestStatus.APPROVED : RequestStatus.REJECTED);
            setConfirmAction(null);
        }
    };

    return (
        <Card className="animate-slideInUp">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">On-Duty Requests</h3>
                {user.role === Role.STUDENT && (
                    <Button onClick={() => alert('New On-Duty Request form not implemented yet.')}>New Request</Button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                        <tr>
                            {user.role !== Role.STUDENT && <th className="px-4 py-2">Student Name</th>}
                            <th className="px-4 py-2">Event</th>
                            <th className="px-4 py-2">Dates</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Reason</th>
                            {user.role === Role.STAFF && <th className="px-4 py-2 text-center">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {userRequests.map(req => (
                            <tr key={req.id} className="border-b dark:border-slate-700">
                                {user.role !== Role.STUDENT && <td className="px-4 py-2">{req.studentName}</td>}
                                <td className="px-4 py-2">{req.eventName}</td>
                                <td className="px-4 py-2">{req.fromDate} to {req.toDate}</td>
                                <td className="px-4 py-2"><StatusBadge status={req.status} /></td>
                                <td className="px-4 py-2">{req.reason}</td>
                                {user.role === Role.STAFF && (
                                    <td className="px-4 py-2">
                                        {req.status === RequestStatus.PENDING && (
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => setConfirmAction({ action: 'Approve', request: req })} className="p-1.5 text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-500/20" aria-label="Approve">
                                                    <ApproveIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => setConfirmAction({ action: 'Reject', request: req })} className="p-1.5 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" aria-label="Reject">
                                                    <RejectIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {userRequests.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-8">No requests found.</p>}

            <ConfirmationDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleConfirm}
                title={`${confirmAction?.action} Request`}
                confirmText={confirmAction?.action}
                confirmVariant={confirmAction?.action === 'Approve' ? 'success' : 'danger'}
            >
                Are you sure you want to {confirmAction?.action.toLowerCase()} the on-duty request from <strong>{confirmAction?.request.studentName}</strong> for the event <strong>{confirmAction?.request.eventName}</strong>?
            </ConfirmationDialog>
        </Card>
    );
};

const LeaveRequestView: React.FC<{
    user: User;
    requests: LeaveRequest[];
    onUpdateStatus: (requestId: string, status: RequestStatus) => void;
    onAddRequest: (request: Omit<LeaveRequest, 'id' | 'status' | 'studentName'>) => void;
}> = ({ user, requests, onUpdateStatus, onAddRequest }) => {
    const [confirmAction, setConfirmAction] = useState<{ action: 'Approve' | 'Reject'; request: LeaveRequest } | null>(null);
    const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
    const [newRequest, setNewRequest] = useState({
        leaveType: 'Casual Leave' as LeaveRequest['leaveType'],
        fromDate: '',
        toDate: '',
        reason: '',
    });

    const studentId = user.role === Role.PARENT ? user.studentId : user.id;
    
    const userRequests = useMemo(() => {
        if (user.role === Role.STAFF) return requests;
        return requests.filter(r => r.studentId === studentId);
    }, [user, requests, studentId]);

    const handleConfirm = () => {
        if (confirmAction) {
            onUpdateStatus(confirmAction.request.id, confirmAction.action === 'Approve' ? RequestStatus.APPROVED : RequestStatus.REJECTED);
            setConfirmAction(null);
        }
    };

    const handleNewRequestSubmit = () => {
        if (!newRequest.fromDate || !newRequest.toDate || !newRequest.reason) {
            alert("Please fill all fields.");
            return;
        }
        onAddRequest({ ...newRequest, studentId: user.id });
        setIsNewRequestModalOpen(false);
        setNewRequest({ leaveType: 'Casual Leave', fromDate: '', toDate: '', reason: '' });
    };

    return (
        <Card className="animate-slideInUp">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Leave Requests</h3>
                {user.role === Role.STUDENT && (
                    <Button onClick={() => setIsNewRequestModalOpen(true)}>New Request</Button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                        <tr>
                            {user.role !== Role.STUDENT && <th className="px-4 py-2">Student Name</th>}
                            <th className="px-4 py-2">Leave Type</th>
                            <th className="px-4 py-2">Dates</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Reason</th>
                            {user.role === Role.STAFF && <th className="px-4 py-2 text-center">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {userRequests.map(req => (
                             <tr key={req.id} className="border-b dark:border-slate-700">
                                {user.role !== Role.STUDENT && <td className="px-4 py-2">{req.studentName}</td>}
                                <td className="px-4 py-2">{req.leaveType}</td>
                                <td className="px-4 py-2">{req.fromDate} to {req.toDate}</td>
                                <td className="px-4 py-2"><StatusBadge status={req.status} /></td>
                                <td className="px-4 py-2">{req.reason}</td>
                                {user.role === Role.STAFF && (
                                    <td className="px-4 py-2">
                                        {req.status === RequestStatus.PENDING && (
                                             <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => setConfirmAction({ action: 'Approve', request: req })} className="p-1.5 text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-500/20" aria-label="Approve"><ApproveIcon className="w-5 h-5" /></button>
                                                <button onClick={() => setConfirmAction({ action: 'Reject', request: req })} className="p-1.5 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" aria-label="Reject"><RejectIcon className="w-5 h-5" /></button>
                                            </div>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {userRequests.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-8">No leave requests found.</p>}
            
            <Modal isOpen={isNewRequestModalOpen} onClose={() => setIsNewRequestModalOpen(false)} title="New Leave Request" footer={<><Button variant="secondary" onClick={() => setIsNewRequestModalOpen(false)}>Cancel</Button><Button onClick={handleNewRequestSubmit}>Submit</Button></>}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Leave Type</label>
                        <select value={newRequest.leaveType} onChange={e => setNewRequest(prev => ({ ...prev, leaveType: e.target.value as LeaveRequest['leaveType'] }))} className={`mt-1 ${inputClasses}`}>
                            <option>Sick Leave</option>
                            <option>Casual Leave</option>
                            <option>Emergency</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">From Date</label>
                            <input type="date" value={newRequest.fromDate} onChange={e => setNewRequest(prev => ({ ...prev, fromDate: e.target.value }))} className={`mt-1 ${inputClasses}`} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">To Date</label>
                            <input type="date" value={newRequest.toDate} onChange={e => setNewRequest(prev => ({ ...prev, toDate: e.target.value }))} className={`mt-1 ${inputClasses}`} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Reason</label>
                        <textarea rows={3} value={newRequest.reason} onChange={e => setNewRequest(prev => ({ ...prev, reason: e.target.value }))} className={`mt-1 ${inputClasses}`} />
                    </div>
                </div>
            </Modal>
            
            <ConfirmationDialog isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} onConfirm={handleConfirm} title={`${confirmAction?.action} Request`} confirmVariant={confirmAction?.action === 'Approve' ? 'success' : 'danger'}>
                Are you sure you want to {confirmAction?.action.toLowerCase()} the leave request from <strong>{confirmAction?.request.studentName}</strong>?
            </ConfirmationDialog>
        </Card>
    );
};

const RequestsView: React.FC<{
  user: User;
  onDutyRequests: OnDutyRequest[];
  noDueRequests: NoDueRequest[];
  leaveRequests: LeaveRequest[];
  onAddNoDueRequest: (department: string, remarks: string) => void;
  onUpdateNoDueRequestStatus: (requestId: string, status: RequestStatus, remarks?: string) => void;
  onUpdateOnDutyRequestStatus: (requestId: string, status: RequestStatus) => void;
  onUpdateLeaveRequestStatus: (requestId: string, status: RequestStatus) => void;
  onAddLeaveRequest: (request: Omit<LeaveRequest, 'id' | 'status' | 'studentName'>) => void;
}> = (props) => {
    const [activeTab, setActiveTab] = useState<'onDuty' | 'noDue' | 'leave'>('onDuty');

    const TabButton: React.FC<{ tabName: 'onDuty' | 'noDue' | 'leave'; label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeTab === tabName
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/50'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">My Requests</h2>
            <div className="mb-6">
                <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-min">
                    <TabButton tabName="onDuty" label="On-Duty" />
                    <TabButton tabName="leave" label="Leave" />
                    <TabButton tabName="noDue" label="No-Due" />
                </div>
            </div>

            {activeTab === 'onDuty' && (
                <OnDutyRequestView
                    user={props.user}
                    requests={props.onDutyRequests}
                    onUpdateStatus={props.onUpdateOnDutyRequestStatus}
                />
            )}
             {activeTab === 'leave' && (
                <LeaveRequestView
                    user={props.user}
                    requests={props.leaveRequests}
                    onUpdateStatus={props.onUpdateLeaveRequestStatus}
                    onAddRequest={props.onAddLeaveRequest}
                />
            )}
            {activeTab === 'noDue' && (
                <NoDueRequestView
                    user={props.user}
                    requests={props.noDueRequests}
                    onAddRequest={props.onAddNoDueRequest}
                    onUpdateStatus={props.onUpdateNoDueRequestStatus}
                />
            )}
        </div>
    );
};

const AssignmentDetailsModal: React.FC<{ assignment: Assignment | null; onClose: () => void; user: User }> = ({ assignment, onClose, user }) => {
    if (!assignment) return null;
    
    const student = MOCK_USERS.find(u => u.id === assignment.studentId);

    const DetailItem: React.FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <div className="mt-1 text-slate-900 dark:text-slate-100">{children}</div>
        </div>
    );
    
    return (
        <Modal isOpen={!!assignment} onClose={onClose} title={`Assignment Details: ${assignment.subject}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {user.role === Role.STAFF && student && (
                    <DetailItem label="Student">
                       <div className="flex items-center gap-2">
                            <ProfilePicture user={student} size="sm" />
                            <span>{student.name} ({student.rollNo})</span>
                        </div>
                    </DetailItem>
                )}
                <DetailItem label="Subject">{assignment.subject}</DetailItem>
                <DetailItem label="Due Date">{assignment.dueDate}</DetailItem>
                <DetailItem label="Status"><StatusBadge status={assignment.status} /></DetailItem>
                <DetailItem label="Grade">{assignment.grade || 'Not Graded'}</DetailItem>
                <DetailItem label="Submitted On">{assignment.submittedOn || 'Not Submitted'}</DetailItem>
               
                <div className="sm:col-span-2">
                    <DetailItem label="Submitted Files">
                        {assignment.submittedFiles && assignment.submittedFiles.length > 0 ? (
                             <ul className="space-y-2">
                                {assignment.submittedFiles.map(file => (
                                    <li key={file.name}>
                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                            {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : 'No files submitted.'}
                    </DetailItem>
                </div>

                <div className="sm:col-span-2">
                    <DetailItem label="Graded File">
                        {assignment.gradedFileUrl ? (
                             <a href={assignment.gradedFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                View Graded File
                            </a>
                        ) : 'No graded file available.'}
                    </DetailItem>
                </div>
            </div>
        </Modal>
    );
};

const AssignmentEditModal: React.FC<{ 
    assignment: Assignment | null; 
    onClose: () => void; 
    onSave: (assignment: Assignment) => void; 
}> = ({ assignment, onClose, onSave }) => {
    const [editedAssignment, setEditedAssignment] = useState<Assignment | null>(null);

    useEffect(() => {
        if (assignment) {
            setEditedAssignment(assignment);
        }
    }, [assignment]);

    if (!editedAssignment) return null;

    const handleSave = () => {
        onSave(editedAssignment);
        onClose();
    };

    return (
        <Modal 
            isOpen={!!assignment} 
            onClose={onClose} 
            title="Edit Assignment"
            footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSave}>Save Changes</Button></>}
        >
             <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subject</label>
                    <input
                        type="text"
                        value={editedAssignment.subject}
                        onChange={(e) => setEditedAssignment(prev => prev ? { ...prev, subject: e.target.value } : null)}
                        className={`mt-1 ${inputClasses}`}
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Due Date</label>
                    <input
                        type="date"
                        value={editedAssignment.dueDate}
                        onChange={(e) => setEditedAssignment(prev => prev ? { ...prev, dueDate: e.target.value } : null)}
                        className={`mt-1 ${inputClasses}`}
                    />
                </div>
            </div>
        </Modal>
    );
};

const AssignmentGradingModal: React.FC<{
    assignment: Assignment | null;
    onClose: () => void;
    onSave: (assignmentId: string, grade: string, gradedFile?: File) => void;
}> = ({ assignment, onClose, onSave }) => {
    const [grade, setGrade] = useState('');
    const [gradedFile, setGradedFile] = useState<File | undefined>();

    useEffect(() => {
        if (assignment) {
            setGrade(assignment.grade || '');
        }
    }, [assignment]);

    if (!assignment) return null;
    
    const handleSave = () => {
        onSave(assignment.id, grade, gradedFile);
        onClose();
    };

    return (
        <Modal
            isOpen={!!assignment}
            onClose={onClose}
            title={`Grade: ${assignment.subject}`}
            footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSave}>Save Grade</Button></>}
        >
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold mb-2">Submitted Files:</h4>
                     {assignment.submittedFiles && assignment.submittedFiles.length > 0 ? (
                         <ul className="space-y-1">
                            {assignment.submittedFiles.map(file => (
                                <li key={file.name}>
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{file.name}</a>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-slate-500">No files were submitted.</p>}
                </div>
                 <div>
                    <label className="block text-sm font-medium">Grade</label>
                    <input
                        type="text"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        placeholder="e.g., A+, B-, 85%"
                        className={`mt-1 ${inputClasses}`}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Upload Graded File (Optional)</label>
                     <input
                        type="file"
                        onChange={(e) => setGradedFile(e.target.files?.[0])}
                        className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>
            </div>
        </Modal>
    );
};

const AssignmentView: React.FC<{ 
    user: User; 
    selectedClassId: string | null; 
    assignments: Assignment[]; 
    setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    allUsers: User[];
    classMemberships: ClassMembership[];
    classes: Class[];
}> = ({ user, selectedClassId, assignments, setAssignments, notifications, setNotifications, allUsers, classMemberships, classes }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Submitted' | 'Graded'>('All');
    const [submissionFilter, setSubmissionFilter] = useState<'All' | 'With Submission' | 'No Submission'>('All');
    const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(false);
    const [newAssignmentSubject, setNewAssignmentSubject] = useState('');
    const [newAssignmentDueDate, setNewAssignmentDueDate] = useState('');
    const [newAssignmentStudentIds, setNewAssignmentStudentIds] = useState<string[]>([]);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
    const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
    const [uploadingAssignment, setUploadingAssignment] = useState<Assignment | null>(null);
    const [gradingAssignment, setGradingAssignment] = useState<Assignment | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const studentId = user.role === Role.PARENT ? user.studentId : user.id;
    
    const studentsInClass = useMemo(() => {
        if (!selectedClassId || selectedClassId === 'ALL') return [];
        
        const studentIdsInClass = classMemberships
            .filter(cm => cm.classId === selectedClassId && cm.role === Role.STUDENT)
            .map(cm => cm.userId);
            
        return allUsers.filter(u => studentIdsInClass.includes(u.id));
    }, [selectedClassId, classMemberships, allUsers]);

    // Send reminders for assignments due in 2 days
    useEffect(() => {
        if (user.role === Role.STUDENT) {
            const twoDaysFromNow = new Date();
            twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

            const upcomingAssignments = assignments.filter(a => 
                a.studentId === user.id &&
                a.status === 'Pending' &&
                new Date(a.dueDate) <= twoDaysFromNow &&
                new Date(a.dueDate) >= new Date()
            );

            upcomingAssignments.forEach(asg => {
                const reminderExists = notifications.some(n => n.message.includes(asg.subject) && n.message.includes('due soon'));
                if (!reminderExists) {
                    const newNotification: Notification = {
                        id: `N-reminder-${asg.id}`,
                        userId: user.id,
                        message: `Reminder: The assignment "${asg.subject}" is due soon on ${asg.dueDate}.`,
                        type: NotificationType.WARNING,
                        timestamp: new Date().toISOString(),
                        read: false,
                    };
                    setNotifications(prev => [newNotification, ...prev]);
                }
            });
        }
    }, [assignments, user.id, user.role, notifications, setNotifications]);


    const filteredAssignments = useMemo(() => {
        return assignments
            .filter(a => selectedClassId === 'ALL' || a.classId === selectedClassId)
            .filter(a => user.role === Role.STAFF || a.studentId === studentId)
            .filter(a => statusFilter === 'All' || a.status === statusFilter)
            .filter(a => {
                if (submissionFilter === 'With Submission') {
                    return a.submittedFiles && a.submittedFiles.length > 0;
                }
                if (submissionFilter === 'No Submission') {
                    return !a.submittedFiles || a.submittedFiles.length === 0;
                }
                return true; // for 'All'
            })
            .filter(a => a.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (user.role === Role.STAFF && MOCK_USERS.find(u => u.id === a.studentId)?.name.toLowerCase().includes(searchTerm.toLowerCase())));
    }, [assignments, selectedClassId, user.role, studentId, searchTerm, statusFilter, submissionFilter]);

    const handleCloseNewAssignmentModal = () => {
        setIsNewAssignmentModalOpen(false);
        setNewAssignmentSubject('');
        setNewAssignmentDueDate('');
        setNewAssignmentStudentIds([]);
    };
    
    const handleOpenNewAssignmentModal = () => {
        setNewAssignmentStudentIds(studentsInClass.map(s => s.id));
        setIsNewAssignmentModalOpen(true);
    };

    const handleCreateAssignment = () => {
        if (!newAssignmentSubject || !newAssignmentDueDate || !selectedClassId || selectedClassId === 'ALL') {
            alert("Please select a specific class and fill all fields.");
            return;
        }

        if (newAssignmentStudentIds.length === 0) {
            alert("Please select at least one student to assign the assignment to.");
            return;
        }
        
        const newAssignments: Assignment[] = newAssignmentStudentIds.map(studentId => ({
            id: `AS${Date.now()}${Math.random()}`,
            studentId,
            classId: selectedClassId,
            subject: newAssignmentSubject,
            dueDate: newAssignmentDueDate,
            status: 'Pending',
        }));

        setAssignments(prev => [...prev, ...newAssignments]);
        handleCloseNewAssignmentModal();
    };
    
    const handleUpdateAssignment = (updatedAssignment: Assignment) => {
        setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));
    };

    const handleGradeAssignment = (assignmentId: string, grade: string, gradedFile?: File) => {
        setAssignments(prev => prev.map(a => {
            if (a.id === assignmentId) {
                return {
                    ...a,
                    status: 'Graded',
                    grade,
                    gradedFileUrl: gradedFile ? `/graded/${gradedFile.name}` : a.gradedFileUrl,
                };
            }
            return a;
        }));
    };

    const handleUploadClick = (assignment: Assignment) => {
        setUploadingAssignment(assignment);
        setSelectedFiles([]);
    };

    const handleCloseUploadModal = () => {
        setUploadingAssignment(null);
        setSelectedFiles([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleRemoveFile = (fileName: string) => {
        setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
    };

    const handleSubmitAssignment = () => {
        if (!uploadingAssignment || selectedFiles.length === 0) return;

        const updatedAssignment = {
            ...uploadingAssignment,
            status: 'Submitted' as const,
            submittedOn: new Date().toLocaleString(),
            submittedFiles: selectedFiles.map(file => ({
                name: file.name,
                url: `/submitted/${file.name}`, // Mock URL
                size: file.size,
            })),
        };

        setAssignments(prev => prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a));
        handleCloseUploadModal();
    };


    const StatusButton: React.FC<{ status: 'All' | 'Pending' | 'Submitted' | 'Graded' }> = ({ status }) => (
        <button
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                statusFilter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
            }`}
        >
            {status}
        </button>
    );

    const SubmissionFilterButton: React.FC<{ filter: 'All' | 'With Submission' | 'No Submission' }> = ({ filter }) => (
        <button
            onClick={() => setSubmissionFilter(filter)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                submissionFilter === filter
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
            }`}
        >
            {filter}
        </button>
    );

    return (
        <Card className="animate-scaleIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <h2 className="text-xl font-semibold">Assignments</h2>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Status:</span>
                        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <StatusButton status="All" />
                            <StatusButton status="Pending" />
                            <StatusButton status="Submitted" />
                            <StatusButton status="Graded" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Submission:</span>
                        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <SubmissionFilterButton filter="All" />
                            <SubmissionFilterButton filter="With Submission" />
                            <SubmissionFilterButton filter="No Submission" />
                        </div>
                    </div>
                </div>
            </div>
             <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div className="relative w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search assignments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`${searchInputClasses} md:w-80`}
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                {user.role === Role.STAFF && (
                    <Button onClick={handleOpenNewAssignmentModal} disabled={!selectedClassId || selectedClassId === 'ALL'}>
                        New Assignment
                    </Button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                        <tr>
                            {user.role === Role.STAFF && <th className="px-4 py-2">Student</th>}
                            <th className="px-4 py-2">Subject</th>
                            <th className="px-4 py-2">Due Date</th>
                            <th className="px-4 py-2">Submitted On</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Grade</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAssignments.map(asg => (
                            <tr key={asg.id} className="border-b dark:border-slate-700">
                                {user.role === Role.STAFF && <td className="px-4 py-2">{MOCK_USERS.find(u => u.id === asg.studentId)?.name}</td>}
                                <td className="px-4 py-2 font-medium">{asg.subject}</td>
                                <td className="px-4 py-2">{asg.dueDate}</td>
                                <td className="px-4 py-2">{asg.submittedOn || '—'}</td>
                                <td className="px-4 py-2"><StatusBadge status={asg.status} /></td>
                                <td className="px-4 py-2">{asg.grade || '—'}</td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-center items-center gap-2">
                                        <button onClick={() => setViewingAssignment(asg)} className="p-1.5 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="View Details">
                                            <EyeIcon className="w-5 h-5" />
                                        </button>
                                        {user.role === Role.STAFF && (
                                            <>
                                            <button onClick={() => setEditingAssignment(asg)} className="p-1.5 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Edit Assignment">
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            {asg.status === 'Submitted' && (
                                                <button onClick={() => setGradingAssignment(asg)} className="p-1.5 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Grade Assignment">
                                                    <GraduationCapIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                            </>
                                        )}
                                        {asg.status === 'Pending' && user.role === Role.STUDENT && (
                                            <button onClick={() => handleUploadClick(asg)} className="p-1.5 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Upload Files">
                                                <UploadIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AssignmentEditModal 
                assignment={editingAssignment} 
                onClose={() => setEditingAssignment(null)} 
                onSave={handleUpdateAssignment}
            />

             <AssignmentGradingModal 
                assignment={gradingAssignment}
                onClose={() => setGradingAssignment(null)}
                onSave={handleGradeAssignment}
            />

            <AssignmentDetailsModal 
                assignment={viewingAssignment} 
                onClose={() => setViewingAssignment(null)} 
                user={user}
            />

            <Modal
                isOpen={!!uploadingAssignment}
                onClose={handleCloseUploadModal}
                title={`Submit: ${uploadingAssignment?.subject}`}
                footer={<><Button variant="secondary" onClick={handleCloseUploadModal}>Cancel</Button><Button onClick={handleSubmitAssignment} disabled={selectedFiles.length === 0}>Submit Assignment</Button></>}
            >
                <div className="space-y-4">
                    <div>
                        <input 
                            type="file" 
                            multiple 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            <UploadIcon className="w-10 h-10 text-slate-400 mb-2"/>
                            <span className="text-sm font-semibold">Click to browse or drag files here</span>
                            <span className="text-xs text-slate-500">Multiple files are allowed</span>
                        </button>
                    </div>
                    {selectedFiles.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2">Selected Files:</h4>
                            <ul className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/50 rounded-md">
                                {selectedFiles.map(file => (
                                    <li key={file.name} className="flex justify-between items-center p-2 rounded-md bg-white dark:bg-slate-700 shadow-sm">
                                        <div>
                                            <p className="text-sm font-medium">{file.name}</p>
                                            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                        <button onClick={() => handleRemoveFile(file.name)} className="p-1 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={isNewAssignmentModalOpen}
                onClose={handleCloseNewAssignmentModal}
                title="Create New Assignment"
                footer={<><Button variant="secondary" onClick={handleCloseNewAssignmentModal}>Cancel</Button><Button onClick={handleCreateAssignment} disabled={newAssignmentStudentIds.length === 0}>Create Assignment</Button></>}
            >
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Create a new assignment for students in <strong>{classes.find(c => c.id === selectedClassId)?.name || 'N/A'}</strong>.
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Subject</label>
                        <input type="text" value={newAssignmentSubject} onChange={e => setNewAssignmentSubject(e.target.value)} className={`mt-1 ${inputClasses}`} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Due Date</label>
                        <input type="date" value={newAssignmentDueDate} onChange={e => setNewAssignmentDueDate(e.target.value)} className={`mt-1 ${inputClasses}`} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Assign to Students</label>
                        <div className="mt-2 border rounded-md max-h-60 overflow-y-auto bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-600">
                            <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                                <label className="flex items-center gap-3 px-2">
                                    <input
                                        type="checkbox"
                                        checked={studentsInClass.length > 0 && newAssignmentStudentIds.length === studentsInClass.length}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setNewAssignmentStudentIds(studentsInClass.map(s => s.id));
                                            } else {
                                                setNewAssignmentStudentIds([]);
                                            }
                                        }}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-medium">Select All ({newAssignmentStudentIds.length}/{studentsInClass.length})</span>
                                </label>
                            </div>
                            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                                {studentsInClass.map(student => (
                                    <li key={student.id}>
                                        <label className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <input
                                                type="checkbox"
                                                checked={newAssignmentStudentIds.includes(student.id)}
                                                onChange={() => {
                                                    setNewAssignmentStudentIds(prev =>
                                                        prev.includes(student.id)
                                                            ? prev.filter(id => id !== student.id)
                                                            : [...prev, student.id]
                                                    );
                                                }}
                                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <ProfilePicture user={student} size="sm" />
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-slate-100">{student.name}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{student.rollNo}</p>
                                            </div>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </Modal>
        </Card>
    );
};

const AttendanceView: React.FC<{
    user: User;
    selectedClassId: string | null;
    attendance: Attendance[];
    classMemberships: ClassMembership[];
    allUsers: User[];
    onMarkAttendance: (classId: string, date: string, subject: string, studentStatuses: Map<string, AttendanceStatus>) => void;
}> = ({ user, selectedClassId, attendance, classMemberships, allUsers, onMarkAttendance }) => {
    const studentId = user.role === Role.PARENT ? user.studentId : user.id;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceSubject, setAttendanceSubject] = useState('');
    const [studentStatuses, setStudentStatuses] = useState<Map<string, AttendanceStatus>>(new Map());

    const studentsInClass = useMemo(() => {
        if (!selectedClassId) return [];
        const studentIds = classMemberships
            .filter(cm => cm.classId === selectedClassId && cm.role === Role.STUDENT)
            .map(cm => cm.userId);
        return allUsers.filter(u => studentIds.includes(u.id)).sort((a,b) => a.name.localeCompare(b.name));
    }, [selectedClassId, classMemberships, allUsers]);

    useEffect(() => {
        if (isModalOpen && selectedClassId) {
            const newStatuses = new Map<string, AttendanceStatus>();
            const existingRecords = attendance.filter(a =>
                a.classId === selectedClassId &&
                a.date === attendanceDate &&
                a.subject.toLowerCase() === attendanceSubject.toLowerCase()
            );

            studentsInClass.forEach(student => {
                const record = existingRecords.find(r => r.studentId === student.id);
                newStatuses.set(student.id, record ? record.status : AttendanceStatus.PRESENT);
            });
            setStudentStatuses(newStatuses);
        }
    }, [isModalOpen, attendanceDate, attendanceSubject, selectedClassId, studentsInClass, attendance]);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setStudentStatuses(new Map(studentStatuses.set(studentId, status)));
    };

    const handleMarkAll = (status: AttendanceStatus) => {
        const newStatuses = new Map<string, AttendanceStatus>();
        studentsInClass.forEach(student => {
            newStatuses.set(student.id, status);
        });
        setStudentStatuses(newStatuses);
    };

    const handleSaveAttendance = () => {
        if (!selectedClassId || !attendanceSubject.trim()) {
            alert("Please enter a subject.");
            return;
        }
        onMarkAttendance(selectedClassId, attendanceDate, attendanceSubject.trim(), studentStatuses);
        setIsModalOpen(false);
    };

    const filteredAttendance = useMemo(() => {
        return attendance
            .filter(a => selectedClassId === 'ALL' || a.classId === selectedClassId)
            .filter(a => user.role === Role.STAFF || a.studentId === studentId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [attendance, selectedClassId, user.role, studentId]);

    return (
        <Card className="animate-scaleIn">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Attendance Records</h2>
                {user.role === Role.STAFF && (
                    <Button onClick={() => setIsModalOpen(true)} disabled={!selectedClassId || selectedClassId === 'ALL'}>
                        Mark Attendance
                    </Button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                        <tr>
                            {user.role === Role.STAFF && <th className="px-4 py-2">Student</th>}
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Subject</th>
                            <th className="px-4 py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAttendance.map(att => (
                            <tr key={att.id} className="border-b dark:border-slate-700">
                                {user.role === Role.STAFF && <td className="px-4 py-2">{MOCK_USERS.find(u => u.id === att.studentId)?.name}</td>}
                                <td className="px-4 py-2">{att.date}</td>
                                <td className="px-4 py-2">{att.subject}</td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${att.status === 'P' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                                        {att.status === 'P' ? 'Present' : 'Absent'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Mark Attendance"
                footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSaveAttendance}>Save Attendance</Button></>}
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Date</label>
                            <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className={`mt-1 ${inputClasses}`} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Subject / Period</label>
                            <input type="text" value={attendanceSubject} onChange={e => setAttendanceSubject(e.target.value)} placeholder="e.g., Physics" className={`mt-1 ${inputClasses}`} />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleMarkAll(AttendanceStatus.PRESENT)}>Mark All Present</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleMarkAll(AttendanceStatus.ABSENT)}>Mark All Absent</Button>
                    </div>
                    <ul className="space-y-2 max-h-80 overflow-y-auto p-2 border rounded-md bg-slate-50 dark:bg-slate-900/50">
                        {studentsInClass.map(student => (
                            <li key={student.id} className="flex justify-between items-center p-2 rounded-md bg-white dark:bg-slate-800 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <ProfilePicture user={student} size="sm" />
                                    <span>{student.name}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleStatusChange(student.id, AttendanceStatus.PRESENT)} className={`px-3 py-1 text-sm rounded-md ${studentStatuses.get(student.id) === AttendanceStatus.PRESENT ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>P</button>
                                    <button onClick={() => handleStatusChange(student.id, AttendanceStatus.ABSENT)} className={`px-3 py-1 text-sm rounded-md ${studentStatuses.get(student.id) === AttendanceStatus.ABSENT ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>A</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </Modal>
        </Card>
    );
};

const FeedbackView: React.FC<{ user: User }> = ({ user }) => {
     const [feedback, setFeedback] = useState<Feedback[]>(MOCK_FEEDBACK);
     const [newFeedback, setNewFeedback] = useState('');
     const [selectedStaff, setSelectedStaff] = useState('');

     const studentId = user.role === Role.PARENT ? user.studentId : user.id;

     const userFeedback = feedback.filter(f => f.studentId === studentId);
     const allStaff = MOCK_USERS.filter(u => u.role === Role.STAFF);

     const handleFeedbackSubmit = () => {
        if (!newFeedback || !selectedStaff) return;
        const staffMember = MOCK_USERS.find(u => u.id === selectedStaff);
        if (!staffMember) return;

        const newEntry: Feedback = {
            id: `FB${Date.now()}`,
            studentId: user.id,
            staffId: selectedStaff,
            classId: 'C1', // This should be dynamic
            staffName: staffMember.name,
            comments: newFeedback,
            createdDate: new Date().toISOString().split('T')[0],
        };
        setFeedback(prev => [newEntry, ...prev]);
        setNewFeedback('');
        setSelectedStaff('');
     };

    return (
        <div>
        <h2 className="text-2xl font-bold mb-6">Feedback</h2>
        {user.role === Role.STUDENT && (
            <Card className="mb-6 animate-slideInUp">
                <h3 className="text-lg font-semibold mb-2">Submit New Feedback</h3>
                <div className="space-y-4">
                     <select 
                        value={selectedStaff} 
                        onChange={e => setSelectedStaff(e.target.value)}
                        className={inputClasses}
                    >
                        <option value="" disabled>Select Staff Member</option>
                        {allStaff.map(staff => <option key={staff.id} value={staff.id}>{staff.name} - {staff.designation}</option>)}
                    </select>
                    <textarea
                        rows={4}
                        placeholder="Share your thoughts..."
                        value={newFeedback}
                        onChange={e => setNewFeedback(e.target.value)}
                        className={inputClasses}
                    />
                    <div className="text-right">
                        <Button onClick={handleFeedbackSubmit} disabled={!newFeedback || !selectedStaff}>Submit</Button>
                    </div>
                </div>
            </Card>
        )}

        <Card className="animate-slideInUp" style={{ animationDelay: user.role === Role.STUDENT ? '100ms' : '0ms' }}>
            <h3 className="text-lg font-semibold mb-4">Feedback History</h3>
            <div className="space-y-4">
                {userFeedback.length > 0 ? userFeedback.map(fb => (
                     <div key={fb.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-slate-700 dark:text-slate-300">{fb.comments}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            To: <strong>{fb.staffName}</strong> on {fb.createdDate}
                        </p>
                    </div>
                )) : (
                    <p className="text-slate-500 dark:text-slate-400">No feedback history.</p>
                )}
            </div>
        </Card>
        </div>
    );
};

const MessagesView: React.FC<{ user: User; selectedClassId: string | null; classes: Class[] }> = ({ user, selectedClassId, classes }) => {
    const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);

    const users = MOCK_USERS;

    const filteredMessages = useMemo(() => {
        if (!selectedClassId || selectedClassId === 'ALL') return [];
        return messages.filter(m => m.classId === selectedClassId);
    }, [messages, selectedClassId]);

    const topLevelMessages = filteredMessages
        .filter(m => !m.parentMessageId)
        .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedClassId || selectedClassId === 'ALL') return;
        const newMsg: Message = {
            id: `M${Date.now()}`,
            senderId: user.id,
            receiverId: 'GROUP', // Simplified for group chat
            classId: selectedClassId,
            content: newMessage,
            timestamp: new Date().toISOString(),
            read: true,
            parentMessageId: replyingTo?.id,
        };
        setMessages(prev => [...prev, newMsg]);
        setNewMessage('');
        setReplyingTo(null);
    };
    
     const ReplyPreview: React.FC<{ message: Message; onCancel: () => void }> = ({ message, onCancel }) => {
        const sender = users.find(u => u.id === message.senderId);
        return (
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-t-lg border-b dark:border-slate-600 flex justify-between items-center animate-fadeIn">
                <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Replying to {sender?.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">"{message.content}"</p>
                </div>
                <button onClick={onCancel} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                    <CloseIcon className="w-4 h-4" />
                </button>
            </div>
        );
    };
    
    const MessageThread: React.FC<{ message: Message; allMessages: Message[]; users: User[]; level?: number, onReply: (message: Message) => void }> = ({ message, allMessages, users, level = 0, onReply }) => {
        const sender = users.find(u => u.id === message.senderId);
        const replies = allMessages.filter(m => m.parentMessageId === message.id).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const parentMessage = message.parentMessageId ? allMessages.find(m => m.id === message.parentMessageId) : null;
        const parentSender = parentMessage ? users.find(u => u.id === parentMessage.senderId) : null;
        
        const [showReplyButton, setShowReplyButton] = useState(false);

        return (
            <div className={`flex items-start gap-3 w-full animate-slideInUp ${level > 0 ? 'mt-3 pl-6 border-l-2 border-slate-200 dark:border-slate-700' : ''}`}
                 onMouseEnter={() => setShowReplyButton(true)} onMouseLeave={() => setShowReplyButton(false)}>
                <ProfilePicture user={sender} size="md" className="flex-shrink-0" />
                <div className="flex-1">
                    <div className="bg-white dark:bg-slate-800/60 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{sender?.name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                         {parentMessage && parentSender && (
                            <a href={`#message-${parentMessage.id}`} className="mt-2 p-2 block border-l-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 rounded-r-md hover:bg-slate-100 dark:hover:bg-slate-600">
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Replying to {parentSender.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">"{parentMessage.content}"</p>
                            </a>
                        )}
                        <p className="mt-2 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{message.content}</p>
                    </div>
                </div>
                 <div className="w-10 flex-shrink-0">
                    {showReplyButton && (
                        <button onClick={() => onReply(message)} className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                            <ReplyIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (!selectedClassId || selectedClassId === 'ALL') {
        return <Card title="Messages" className="animate-scaleIn"><p>Please select a class to view messages.</p></Card>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
            <h2 className="text-2xl font-bold mb-4 px-1">Messages for {classes.find(c => c.id === selectedClassId)?.name}</h2>
            <Card className="flex-1 flex flex-col !p-0 animate-scaleIn">
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    {topLevelMessages.map(msg => (
                         <div id={`message-${msg.id}`} key={msg.id} className="space-y-3">
                            <MessageThread message={msg} allMessages={filteredMessages} users={users} onReply={setReplyingTo}/>
                            {filteredMessages.filter(m => m.parentMessageId === msg.id).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(reply => (
                                <MessageThread key={reply.id} message={reply} allMessages={filteredMessages} users={users} level={1} onReply={setReplyingTo}/>
                            ))}
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    {replyingTo && <ReplyPreview message={replyingTo} onCancel={() => setReplyingTo(null)} />}
                    <div className="flex items-center gap-2">
                        <textarea
                            rows={1}
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            placeholder="Type a message..."
                            className={`flex-1 p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900 ${replyingTo ? 'rounded-t-none' : ''}`}
                        />
                        <Button onClick={handleSendMessage} className="!p-2">
                            <SendIcon className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const AnnouncementsView: React.FC<{ user: User, selectedClassId: string | null, classes: Class[], announcements: Announcement[], setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>> }> = ({ user, selectedClassId, classes, announcements, setAnnouncements }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newAudience, setNewAudience] = useState<'STUDENT' | 'PARENT' | 'ALL'>('STUDENT');

    const filteredAnnouncements = useMemo(() => {
        return announcements
            .filter(a => {
                if (selectedClassId && selectedClassId !== 'ALL') return a.classId === selectedClassId || !a.classId;
                return true;
            })
            .filter(a => {
                 if (user.role === Role.STUDENT) return a.targetAudience === 'STUDENT' || a.targetAudience === 'ALL';
                 if (user.role === Role.PARENT) return a.targetAudience === 'PARENT' || a.targetAudience === 'ALL';
                 return true; // Staff see all
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [announcements, selectedClassId, user.role]);

    const handleCreateAnnouncement = () => {
        if (!newTitle || !newContent) return;
        const newAnn: Announcement = {
            id: `AN${Date.now()}`,
            staffId: user.id,
            staffName: user.name,
            classId: (selectedClassId && selectedClassId !== 'ALL') ? selectedClassId : undefined,
            title: newTitle,
            content: newContent,
            timestamp: new Date().toISOString(),
            targetAudience: newAudience,
        };
        setAnnouncements(prev => [newAnn, ...prev]);
        setIsModalOpen(false);
        setNewTitle('');
        setNewContent('');
        setNewAudience('STUDENT');
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Announcements</h2>
                {user.role === Role.STAFF && <Button onClick={() => setIsModalOpen(true)}>New Announcement</Button>}
            </div>
            <div className="space-y-6">
                {filteredAnnouncements.map((ann, index) => (
                    <Card key={ann.id} className="animate-slideInUp" style={{ animationDelay: `${index * 75}ms` }}>
                        <div className="flex justify-between items-start">
                             <div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{ann.title}</h3>
                                {ann.classId && <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{classes.find(c => c.id === ann.classId)?.name}</p>}
                            </div>
                             <div className="text-right text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-4">
                                <p>By {ann.staffName}</p>
                                <p>{new Date(ann.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                        <p className="mt-4 text-slate-600 dark:text-slate-300">{ann.content}</p>
                    </Card>
                ))}
            </div>

             <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create Announcement"
                footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleCreateAnnouncement}>Post</Button></>}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Title</label>
                        <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className={`mt-1 ${inputClasses}`} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Content</label>
                        <textarea rows={5} value={newContent} onChange={e => setNewContent(e.target.value)} className={`mt-1 ${inputClasses}`} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Audience</label>
                         <select value={newAudience} onChange={e => setNewAudience(e.target.value as any)} className={`mt-1 ${inputClasses}`}>
                            <option value="STUDENT">Students</option>
                            <option value="PARENT">Parents</option>
                            <option value="ALL">All</option>
                        </select>
                    </div>
                    {(!selectedClassId || selectedClassId === 'ALL') && (
                         <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-700 dark:text-yellow-300">
                            No specific class is selected. This will be a global announcement.
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

const StudentProfilesView: React.FC<{ user: User, allUsers: User[], onUpdateUser: (user:User) => void, onDutyRequests: OnDutyRequest[], leaveRequests: LeaveRequest[] }> = ({ user, allUsers, onUpdateUser, onDutyRequests, leaveRequests }) => {
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Debounce search term to avoid re-rendering on every keystroke
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const students = useMemo(() => {
        if (!debouncedSearchTerm) {
             return allUsers.filter(u => u.role === Role.STUDENT);
        }
        const lowercasedTerm = debouncedSearchTerm.toLowerCase();
        return allUsers.filter(u => u.role === Role.STUDENT && 
            (u.name.toLowerCase().includes(lowercasedTerm) || 
             (u.rollNo && u.rollNo.toLowerCase().includes(lowercasedTerm)))
        );
    }, [allUsers, debouncedSearchTerm]);
    
    if (user.role === Role.STUDENT) {
        return <StudentProfileDetail student={user} onBack={() => {}} onUpdateUser={onUpdateUser} currentUser={user} onDutyRequests={onDutyRequests} leaveRequests={leaveRequests} />;
    }
     if (user.role === Role.PARENT) {
        const child = allUsers.find(u => u.id === user.studentId);
        if (child) {
            return <StudentProfileDetail student={child} onBack={() => {}} onUpdateUser={onUpdateUser} currentUser={user} onDutyRequests={onDutyRequests} leaveRequests={leaveRequests} />;
        }
        return <Card><p>Could not find student profile.</p></Card>;
    }
    
    if (selectedStudent) {
        return <StudentProfileDetail student={selectedStudent} onBack={() => setSelectedStudent(null)} onUpdateUser={onUpdateUser} currentUser={user} onDutyRequests={onDutyRequests} leaveRequests={leaveRequests} />;
    }

    return (
        <Card className="animate-scaleIn">
            <h2 className="text-xl font-semibold mb-4">Student Profiles</h2>
            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder="Search students by name or roll number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={searchInputClasses}
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.length > 0 ? (
                    students.map(student => (
                        <div key={student.id} onClick={() => setSelectedStudent(student)} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center gap-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200 hover:shadow-lg hover:scale-105">
                            <ProfilePicture user={student} size="lg" />
                            <div>
                                <p className="font-semibold">{student.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{student.rollNo}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-10">
                        <p className="text-slate-500 dark:text-slate-400">No students found matching your search.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

const StudentProfileDetail: React.FC<{ student: User; onBack: () => void, onUpdateUser: (user: User) => void, currentUser: User, onDutyRequests: OnDutyRequest[], leaveRequests: LeaveRequest[] }> = ({ student, onBack, onUpdateUser, currentUser, onDutyRequests, leaveRequests }) => {
    const [editingField, setEditingField] = useState<keyof User | null>(null);
    const [editableStudent, setEditableStudent] = useState<User>(student);

    useEffect(() => {
        setEditableStudent(student);
        setEditingField(null);
    }, [student]);

    const handleFieldSave = () => {
        onUpdateUser(editableStudent);
        setEditingField(null);
    };

    const handleFieldCancel = () => {
        setEditableStudent(student);
        setEditingField(null);
    };
    
    const renderEditableField = (field: 'rollNo' | 'department' | 'year') => {
        const isCurrentlyEditing = editingField === field;

        if (isCurrentlyEditing && currentUser.role === Role.STAFF) {
            return (
                <div className="flex items-center gap-2">
                    <input
                        type={field === 'year' ? 'number' : 'text'}
                        value={editableStudent[field] as string | ''}
                        onChange={(e) => {
                            const value = field === 'year' ? Number(e.target.value) : e.target.value;
                            setEditableStudent(s => ({ ...s, [field]: value }))
                        }}
                        className="p-1 rounded bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
                        autoFocus
                    />
                    <button onClick={handleFieldSave} className="p-1 text-green-600 rounded-full hover:bg-green-100 dark:hover:bg-green-500/20" aria-label="Save">
                        <ApproveIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleFieldCancel} className="p-1 text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" aria-label="Cancel">
                        <RejectIcon className="w-5 h-5" />
                    </button>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2 group">
                <span className="text-blue-600 dark:text-blue-400 font-medium">{student[field] || 'N/A'}</span>
                {currentUser.role === Role.STAFF && (
                    <button 
                        onClick={() => {
                            setEditingField(field);
                            setEditableStudent(student); 
                        }} 
                        className="p-1 text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" 
                        aria-label={`Edit ${field}`}>
                        <EditIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    };

    const assignments = MOCK_ASSIGNMENTS.filter(a => a.studentId === student.id);
    const attendance = MOCK_ATTENDANCE.filter(a => a.studentId === student.id);
    const attendancePercentage = attendance.length > 0 ? (attendance.filter(a => a.status === 'P').length / attendance.length * 100).toFixed(0) : 'N/A';
    const gradedAssignments = assignments.filter(a => a.status === 'Graded');

    const studentOnDutyHistory = onDutyRequests.filter(r => r.studentId === student.id);
    const studentLeaveHistory = leaveRequests.filter(r => r.studentId === student.id);
    
    const getAverageGrade = () => {
        const gradeMap: {[key: string]: number} = { 'A+': 95, 'A': 90, 'B+': 85, 'B': 80, 'B-': 75, 'C': 70, 'D': 60 };
        const numericGrades = gradedAssignments.map(a => gradeMap[a.grade || ''] || 0).filter(g => g > 0);
        if (numericGrades.length === 0) return 'N/A';
        const avg = numericGrades.reduce((sum, g) => sum + g, 0) / numericGrades.length;
        const gradeEntry = Object.entries(gradeMap).reverse().find(([, value]) => avg >= value);
        return gradeEntry ? gradeEntry[0] : 'N/A';
    }
    
    return (
        <div className="animate-fadeIn">
             {currentUser.role === Role.STAFF && (
                <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
                    <ChevronLeftIcon className="w-4 h-4" /> Back to Student List
                </button>
            )}
            <Card>
                <div className="flex justify-between items-start">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <ProfilePicture user={student} size="xl" />
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-3xl font-bold">{student.name}</h3>
                            <dl className="mt-2 space-y-1">
                                <div className="flex items-center gap-2">
                                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 w-24 shrink-0">Roll Number</dt>
                                    <dd className="text-sm">{renderEditableField('rollNo')}</dd>
                                </div>
                                <div className="flex items-center gap-2">
                                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 w-24 shrink-0">Department</dt>
                                    <dd className="text-sm">{renderEditableField('department')}</dd>
                                </div>
                                <div className="flex items-center gap-2">
                                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 w-24 shrink-0">Year</dt>
                                    <dd className="text-sm">{renderEditableField('year')}</dd>
                                </div>
                            </dl>
                            <p className="mt-2">{student.email}</p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <Card title="Attendance" className="animate-slideInUp"><p className="text-3xl font-bold">{attendancePercentage}%</p></Card>
                <Card title="Assignments Submitted" className="animate-slideInUp" style={{ animationDelay: '100ms' }}><p className="text-3xl font-bold">{assignments.filter(a => a.status !== 'Pending').length}/{assignments.length}</p></Card>
                <Card title="Average Grade" className="animate-slideInUp" style={{ animationDelay: '200ms' }}><p className="text-3xl font-bold">{getAverageGrade()}</p></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card title="On-Duty History" className="animate-slideInUp" style={{ animationDelay: '300ms' }}>
                    <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                            <tbody>
                            {studentOnDutyHistory.map(r => (
                                <tr key={r.id} className="border-b dark:border-slate-700 last:border-b-0">
                                    <td className="py-2 pr-2">{r.eventName}<br/><small className="text-slate-500">{r.fromDate} to {r.toDate}</small></td>
                                    <td className="py-2 pl-2 text-right"><StatusBadge status={r.status} /></td>
                                </tr>
                            ))}
                             {studentOnDutyHistory.length === 0 && <tr><td colSpan={2} className="text-center py-4 text-slate-500">No on-duty history.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <Card title="Leave History" className="animate-slideInUp" style={{ animationDelay: '400ms' }}>
                    <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                            <tbody>
                            {studentLeaveHistory.map(r => (
                                <tr key={r.id} className="border-b dark:border-slate-700 last:border-b-0">
                                    <td className="py-2 pr-2">{r.leaveType}<br/><small className="text-slate-500">{r.fromDate} to {r.toDate}</small></td>
                                    <td className="py-2 pl-2 text-right"><StatusBadge status={r.status} /></td>
                                </tr>
                            ))}
                            {studentLeaveHistory.length === 0 && <tr><td colSpan={2} className="text-center py-4 text-slate-500">No leave history.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const CalendarView: React.FC<{ user: User, events: Event[], allUsers: User[] }> = ({ user, events, allUsers }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay(); // 0 = Sunday, 1 = Monday, ...

    const daysInMonth = endOfMonth.getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const userEvents = useMemo(() => {
        return events.filter(e => {
            if (user.role === Role.STAFF) return true;
            if (e.audience === 'ALL') return true;
    
            const child = user.role === Role.PARENT ? allUsers.find(u => u.id === user.studentId) : null;
            const relevantClassIds = user.role === Role.STUDENT ? user.classIds : (child ? child.classIds : []);
    
            if ((user.role === Role.STUDENT || user.role === Role.PARENT) && e.audience === 'STUDENT') {
                return !e.classId || relevantClassIds.includes(e.classId);
            }
    
            if (user.role === Role.PARENT && e.audience === 'PARENT') {
                return true;
            }
            
            return false;
        });
    }, [events, user, allUsers]);
    
    const getEventsForDay = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return userEvents.filter(e => dateStr >= e.start && dateStr <= e.end);
    };
    
    const eventColors: Record<Event['color'], string> = {
        blue: 'bg-sky-500',
        green: 'bg-green-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
        purple: 'bg-purple-500',
    };

    return (
        <Card className="animate-scaleIn">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeftIcon className="w-6 h-6"/></button>
                    <button onClick={nextMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRightIcon className="w-6 h-6"/></button>
                    <h2 className="text-xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                </div>
                <Button onClick={goToToday} variant="secondary">Today</Button>
            </div>
            <div className="grid grid-cols-7 gap-px bg-slate-200 dark:border-slate-700 border dark:border-slate-700">
                {weekdays.map(day => (
                    <div key={day} className="text-center font-semibold text-sm py-2 bg-white dark:bg-slate-900/80">{day}</div>
                ))}
                {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-slate-50 dark:bg-slate-800/50"></div>
                ))}
                {daysArray.map(day => {
                    const dayEvents = getEventsForDay(day);
                    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                    return (
                        <div key={day} className="relative min-h-[120px] bg-white dark:bg-slate-800/80 p-2">
                             <span className={`absolute top-2 right-2 text-sm font-semibold ${isToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{day}</span>
                            <div className="mt-8 space-y-1">
                                {dayEvents.map(event => (
                                    <div key={event.id} className={`p-1 ${eventColors[event.color]} text-white rounded-md text-xs truncate`} title={`${event.title}: ${event.description}`}>
                                        {event.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

const AllRequestsView: React.FC<{
    onDutyRequests: OnDutyRequest[];
    leaveRequests: LeaveRequest[];
    onUpdateOnDuty: (id: string, status: RequestStatus) => void;
    onUpdateLeave: (id: string, status: RequestStatus) => void;
}> = ({ onDutyRequests, leaveRequests, onUpdateOnDuty, onUpdateLeave }) => {
    
    type CombinedRequest = (OnDutyRequest & { type: 'On-Duty' }) | (LeaveRequest & { type: 'Leave' });
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<RequestStatus | 'All'>('All');
    const [typeFilter, setTypeFilter] = useState<'All' | 'On-Duty' | 'Leave'>('All');
    const [sortConfig, setSortConfig] = useState<{ key: keyof CombinedRequest; direction: 'ascending' | 'descending' } | null>({ key: 'fromDate', direction: 'descending' });
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmAction, setConfirmAction] = useState<{ action: 'Approve' | 'Reject', request: CombinedRequest } | null>(null);

    const ITEMS_PER_PAGE = 10;

    const combinedRequests = useMemo((): CombinedRequest[] => {
        const onDuty = onDutyRequests.map(r => ({ ...r, type: 'On-Duty' as const }));
        const leave = leaveRequests.map(r => ({ ...r, type: 'Leave' as const }));
        return [...onDuty, ...leave];
    }, [onDutyRequests, leaveRequests]);
    
    const filteredAndSortedRequests = useMemo(() => {
        let filtered = combinedRequests
            .filter(r => statusFilter === 'All' || r.status === statusFilter)
            .filter(r => typeFilter === 'All' || r.type === typeFilter)
            .filter(r => r.studentName.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                // @ts-ignore
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
                // @ts-ignore
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [combinedRequests, statusFilter, typeFilter, searchTerm, sortConfig]);

    const paginatedRequests = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedRequests, currentPage]);

    const totalPages = Math.ceil(filteredAndSortedRequests.length / ITEMS_PER_PAGE);

    const requestSort = (key: keyof CombinedRequest) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleConfirm = () => {
        if (!confirmAction) return;
        const { action, request } = confirmAction;
        const newStatus = action === 'Approve' ? RequestStatus.APPROVED : RequestStatus.REJECTED;
        if (request.type === 'On-Duty') {
            onUpdateOnDuty(request.id, newStatus);
        } else {
            onUpdateLeave(request.id, newStatus);
        }
        setConfirmAction(null);
    };
    
    const SortableHeader: React.FC<{ sortKey: keyof CombinedRequest; children: ReactNode; }> = ({ sortKey, children }) => (
        <th onClick={() => requestSort(sortKey)} className="px-4 py-2 cursor-pointer">
            <div className="flex items-center gap-1">
                {children}
                {sortConfig?.key === sortKey && (sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />)}
            </div>
        </th>
    );

    return (
        <Card className="animate-scaleIn">
            <h2 className="text-2xl font-bold mb-4">Manage All Student Requests</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                 <div className="relative">
                    <input type="text" placeholder="Search by student name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={searchInputClasses} />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className={inputClasses}>
                    <option value="All">All Types</option>
                    <option value="On-Duty">On-Duty</option>
                    <option value="Leave">Leave</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className={inputClasses}>
                    <option value="All">All Statuses</option>
                    <option value={RequestStatus.PENDING}>Pending</option>
                    <option value={RequestStatus.APPROVED}>Approved</option>
                    <option value={RequestStatus.REJECTED}>Rejected</option>
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                        <tr>
                            <SortableHeader sortKey="studentName">Student</SortableHeader>
                            <SortableHeader sortKey="type">Type</SortableHeader>
                            <SortableHeader sortKey="fromDate">Dates</SortableHeader>
                            <th className="px-4 py-2">Reason/Event</th>
                            <SortableHeader sortKey="status">Status</SortableHeader>
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRequests.map(req => (
                            <tr key={`${req.type}-${req.id}`} className="border-b dark:border-slate-700">
                                <td className="px-4 py-2">{req.studentName}</td>
                                <td className="px-4 py-2 font-medium">{req.type === 'Leave' ? req.leaveType : req.type}</td>
                                <td className="px-4 py-2">{req.fromDate}{req.fromDate !== req.toDate && ` to ${req.toDate}`}</td>
                                <td className="px-4 py-2 truncate max-w-xs">{req.type === 'On-Duty' ? req.eventName : req.reason}</td>
                                <td className="px-4 py-2"><StatusBadge status={req.status} /></td>
                                <td className="px-4 py-2">
                                    {req.status === RequestStatus.PENDING && (
                                        <div className="flex justify-center items-center gap-2">
                                            <button onClick={() => setConfirmAction({ action: 'Approve', request: req })} className="p-1.5 text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-500/20" aria-label="Approve"><ApproveIcon className="w-5 h-5" /></button>
                                            <button onClick={() => setConfirmAction({ action: 'Reject', request: req })} className="p-1.5 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" aria-label="Reject"><RejectIcon className="w-5 h-5" /></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-slate-500">
                    Showing {paginatedRequests.length} of {filteredAndSortedRequests.length} requests
                </span>
                <div className="flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                    <Button size="sm" variant="secondary" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                </div>
            </div>
            
            <ConfirmationDialog isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} onConfirm={handleConfirm} title={`${confirmAction?.action} Request`} confirmVariant={confirmAction?.action === 'Approve' ? 'success' : 'danger'}>
                Are you sure you want to {confirmAction?.action.toLowerCase()} this request from <strong>{confirmAction?.request.studentName}</strong>?
            </ConfirmationDialog>
        </Card>
    );
};

const MaterialsView: React.FC<{
  user: User;
  selectedClassId: string | null;
  materials: ClassMaterial[];
  setMaterials: React.Dispatch<React.SetStateAction<ClassMaterial[]>>;
  classes: Class[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
}> = ({ user, selectedClassId, materials, setMaterials, classes, setAnnouncements }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ClassMaterial | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<ClassMaterial | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');

  const filteredMaterials = useMemo(() => {
    return materials
      .filter(m => selectedClassId === 'ALL' || m.classId === selectedClassId)
      .filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.subject.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  }, [materials, selectedClassId, searchTerm]);

  const handleModalOpen = (material: ClassMaterial | null = null) => {
    setEditingMaterial(material);
    if (material) {
      setTitle(material.title);
      setDescription(material.description);
      setSubject(material.subject);
      setFileName(material.fileName);
    }
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingMaterial(null);
    setTitle('');
    setDescription('');
    setSubject('');
    setFile(null);
    setFileName('');
  };

  const handleSubmit = () => {
    if (!title || !subject || (!file && !editingMaterial)) {
      alert('Please fill all required fields and select a file.');
      return;
    }

    if (editingMaterial) {
      const updatedMaterial: ClassMaterial = {
        ...editingMaterial,
        title,
        description,
        subject,
        fileName: file ? file.name : editingMaterial.fileName,
        fileSize: file ? file.size : editingMaterial.fileSize,
        fileUrl: file ? URL.createObjectURL(file) : editingMaterial.fileUrl,
      };
      setMaterials(materials.map(m => m.id === editingMaterial.id ? updatedMaterial : m));
    } else if (selectedClassId && selectedClassId !== 'ALL' && file) {
      const newMaterial: ClassMaterial = {
        id: `CMAT${Date.now()}`,
        classId: selectedClassId,
        title,
        description,
        subject,
        fileName: file.name,
        fileSize: file.size,
        fileUrl: URL.createObjectURL(file), // Mock URL for display
        uploadedBy: user.id,
        uploadedByName: user.name,
        uploadDate: new Date().toISOString().split('T')[0],
      };
      setMaterials(prev => [newMaterial, ...prev]);

      const newAnnouncement: Announcement = {
        id: `AN-mat-${Date.now()}`,
        staffId: user.id,
        staffName: user.name,
        classId: selectedClassId,
        title: `New Material Uploaded: ${title}`,
        content: `A new file "${file.name}" for the subject "${subject}" has been uploaded to the Class Materials section.`,
        timestamp: new Date().toISOString(),
        targetAudience: 'STUDENT',
      };
      setAnnouncements(prev => [newAnnouncement, ...prev]);
    }
    handleModalClose();
  };
  
  const handleDeleteConfirm = () => {
    if (deletingMaterial) {
      setMaterials(materials.filter(m => m.id !== deletingMaterial.id));
      setDeletingMaterial(null);
    }
  };

  return (
    <Card className="animate-scaleIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold">Class Materials</h2>
        {user.role === Role.STAFF && (
          <Button onClick={() => handleModalOpen()} disabled={!selectedClassId || selectedClassId === 'ALL'}>
            Upload New Material
          </Button>
        )}
      </div>
      <div className="relative mb-4">
        <input type="text" placeholder="Search by title or subject..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={searchInputClasses} />
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2">Title / Subject</th>
              <th className="px-4 py-2">Uploaded By</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">File</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map(material => (
              <tr key={material.id} className="border-b dark:border-slate-700">
                <td className="px-4 py-2">
                  <p className="font-semibold">{material.title}</p>
                  <p className="text-xs text-slate-500">{material.subject}</p>
                </td>
                <td className="px-4 py-2">{material.uploadedByName}</td>
                <td className="px-4 py-2">{material.uploadDate}</td>
                <td className="px-4 py-2">
                    {material.fileName} <span className="text-slate-400">({(material.fileSize / 1024 / 1024).toFixed(2)} MB)</span>
                </td>
                <td className="px-4 py-2 text-center">
                  {user.role === Role.STAFF ? (
                    <div className="flex justify-center items-center gap-2">
                      <button onClick={() => handleModalOpen(material)} className="p-1.5 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Edit"><EditIcon className="w-5 h-5" /></button>
                      <button onClick={() => setDeletingMaterial(material)} className="p-1.5 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" aria-label="Delete"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                  ) : (
                    <a href={material.fileUrl} download={material.fileName} className="inline-block">
                      <Button size="sm">Download</Button>
                    </a>
                  )}
                </td>
              </tr>
            ))}
             {filteredMaterials.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500 dark:text-slate-400">No materials found.</td>
                </tr>
             )}
          </tbody>
        </table>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={editingMaterial ? "Edit Material" : "Upload New Material"}
        footer={<><Button variant="secondary" onClick={handleModalClose}>Cancel</Button><Button onClick={handleSubmit}>{editingMaterial ? "Save Changes" : "Upload"}</Button></>}
      >
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={`mt-1 ${inputClasses}`} />
            </div>
            <div>
                <label className="block text-sm font-medium">Subject</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className={`mt-1 ${inputClasses}`} />
            </div>
            <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className={`mt-1 ${inputClasses}`} />
            </div>
             <div>
                <label className="block text-sm font-medium">File</label>
                <input
                    type="file"
                    onChange={(e) => {
                        if(e.target.files?.[0]) {
                            setFile(e.target.files[0]);
                            setFileName(e.target.files[0].name);
                        }
                    }}
                    className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {fileName && <p className="text-sm text-slate-500 mt-2">Selected: {fileName}</p>}
            </div>
        </div>
      </Modal>

      <ConfirmationDialog isOpen={!!deletingMaterial} onClose={() => setDeletingMaterial(null)} onConfirm={handleDeleteConfirm} title="Delete Material" confirmVariant="danger">
        Are you sure you want to delete the material "<strong>{deletingMaterial?.title}</strong>"? This action cannot be undone.
      </ConfirmationDialog>
    </Card>
  );
};

const ExamsView: React.FC<{
  user: User;
  selectedClassId: string | null;
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  examMarks: ExamMark[];
  setExamMarks: React.Dispatch<React.SetStateAction<ExamMark[]>>;
  markComments: MarkComment[];
  setMarkComments: React.Dispatch<React.SetStateAction<MarkComment[]>>;
  classes: Class[];
  classMemberships: ClassMembership[];
  allUsers: User[];
}> = ({ user, selectedClassId, exams, setExams, examMarks, setExamMarks, markComments, setMarkComments, classes, classMemberships, allUsers }) => {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTotalMarks, setExamTotalMarks] = useState(100);
  const [examPaperFile, setExamPaperFile] = useState<File | null>(null);
  const [marksToSave, setMarksToSave] = useState<Map<string, number | null>>(new Map());
  const [answerSheetsToSave, setAnswerSheetsToSave] = useState<Map<string, File>>(new Map());
  const [viewingCommentsFor, setViewingCommentsFor] = useState<ExamMark | null>(null);
  const [newComment, setNewComment] = useState('');
  
  const studentId = user.role === Role.PARENT ? user.studentId : user.id;

  const filteredExams = useMemo(() => {
    if (!selectedClassId || selectedClassId === 'ALL') return [];
    return exams.filter(e => e.classId === selectedClassId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [exams, selectedClassId]);

  const studentsInClass = useMemo(() => {
    if (!selectedClassId) return [];
    const studentIds = classMemberships
        .filter(cm => cm.classId === selectedClassId && cm.role === Role.STUDENT)
        .map(cm => cm.userId);
    return allUsers.filter(u => studentIds.includes(u.id)).sort((a,b) => a.name.localeCompare(b.name));
  }, [selectedClassId, classMemberships, allUsers]);

  useEffect(() => {
    if (selectedExam && user.role === Role.STAFF) {
        const initialMarks = new Map();
        studentsInClass.forEach(student => {
            const mark = examMarks.find(m => m.examId === selectedExam.id && m.studentId === student.id);
            initialMarks.set(student.id, mark ? mark.marksObtained : null);
        });
        setMarksToSave(initialMarks);
        setAnswerSheetsToSave(new Map());
    }
  }, [selectedExam, studentsInClass, examMarks, user.role]);

  const handleExamModalOpen = (exam: Exam | null = null) => {
    setEditingExam(exam);
    if (exam) {
        setExamName(exam.name);
        setExamDate(exam.date);
        setExamTotalMarks(exam.totalMarks);
    } else {
        setExamName('');
        setExamDate(new Date().toISOString().split('T')[0]);
        setExamTotalMarks(100);
    }
    setExamPaperFile(null);
    setIsExamModalOpen(true);
  };

  const handleExamSubmit = () => {
    if (!examName || !examDate || !selectedClassId || selectedClassId === 'ALL') {
        alert("Please fill all required fields.");
        return;
    }

    if (editingExam) {
        setExams(exams.map(e => e.id === editingExam.id ? { ...e, name: examName, date: examDate, totalMarks: examTotalMarks, paperUrl: examPaperFile ? URL.createObjectURL(examPaperFile) : e.paperUrl } : e));
    } else {
        const newExam: Exam = {
            id: `EX${Date.now()}`,
            classId: selectedClassId,
            name: examName,
            date: examDate,
            totalMarks: examTotalMarks,
            paperUrl: examPaperFile ? URL.createObjectURL(examPaperFile) : undefined,
        };
        setExams(prev => [newExam, ...prev]);
    }
    setIsExamModalOpen(false);
  };

  const handleSaveMarksAndSheets = () => {
    if (!selectedExam) return;

    const updatedMarksList = examMarks.filter(m => m.examId !== selectedExam.id);

    studentsInClass.forEach(student => {
        const marks = marksToSave.get(student.id);
        const sheetFile = answerSheetsToSave.get(student.id);
        const existingMark = examMarks.find(m => m.examId === selectedExam.id && m.studentId === student.id);

        if (marks !== null && marks !== undefined) { // If marks are entered
            if (existingMark) {
                updatedMarksList.push({
                    ...existingMark,
                    marksObtained: marks,
                    answerSheetUrl: sheetFile ? URL.createObjectURL(sheetFile) : existingMark.answerSheetUrl
                });
            } else {
                updatedMarksList.push({
                    id: `EM${Date.now()}${student.id}`,
                    examId: selectedExam.id,
                    studentId: student.id,
                    marksObtained: marks,
                    answerSheetUrl: sheetFile ? URL.createObjectURL(sheetFile) : undefined,
                });
            }
        } else if (sheetFile) { // If only sheet is uploaded without marks yet
             if (existingMark) {
                updatedMarksList.push({ ...existingMark, answerSheetUrl: URL.createObjectURL(sheetFile) });
            } else {
                 updatedMarksList.push({
                    id: `EM${Date.now()}${student.id}`,
                    examId: selectedExam.id,
                    studentId: student.id,
                    marksObtained: null,
                    answerSheetUrl: URL.createObjectURL(sheetFile),
                });
            }
        } else if (existingMark) {
            updatedMarksList.push(existingMark);
        }
    });
    
    setExamMarks(updatedMarksList);
    setAnswerSheetsToSave(new Map());
    alert("Marks and sheets saved successfully!");
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !viewingCommentsFor) return;
    const newComm: MarkComment = {
        id: `MC${Date.now()}`,
        markId: viewingCommentsFor.id,
        userId: user.id,
        comment: newComment,
        timestamp: new Date().toISOString(),
    };
    setMarkComments(prev => [...prev, newComm]);
    setNewComment('');
  };

  if (!selectedClassId || selectedClassId === 'ALL') {
    return <Card className="animate-scaleIn"><p>Please select a class to view exams and marks.</p></Card>;
  }

  if (selectedExam) {
    const userMark = (user.role === Role.STUDENT || user.role === Role.PARENT) ? examMarks.find(m => m.examId === selectedExam.id && m.studentId === studentId) : null;
    return (
        <div className="animate-fadeIn">
            <button onClick={() => setSelectedExam(null)} className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
                <ChevronLeftIcon className="w-4 h-4" /> Back to Exam List
            </button>
            <Card>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold">{selectedExam.name}</h2>
                        <p className="text-slate-500">Date: {selectedExam.date} | Total Marks: {selectedExam.totalMarks}</p>
                    </div>
                    {selectedExam.paperUrl && <Button onClick={() => window.open(selectedExam.paperUrl, '_blank')}>Download Paper</Button>}
                </div>

                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Marks</h3>
                    {user.role === Role.STAFF ? (
                        <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-left bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                                    <tr>
                                        <th className="p-2">Student</th>
                                        <th className="p-2">Marks Obtained</th>
                                        <th className="p-2">Answer Sheet</th>
                                        <th className="p-2 text-center">Comments</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentsInClass.map(student => {
                                        const mark = examMarks.find(m => m.examId === selectedExam.id && m.studentId === student.id);
                                        const uploadedFile = answerSheetsToSave.get(student.id);
                                        return (
                                            <tr key={student.id} className="border-t dark:border-slate-700">
                                                <td className="p-2">{student.name} ({student.rollNo})</td>
                                                <td className="p-2">
                                                    <input type="number" value={marksToSave.get(student.id) ?? ''} onChange={e => {
                                                        const newMarks = new Map(marksToSave);
                                                        const value = e.target.value;
                                                        const marksNum = value === '' ? null : Number(value);
                                                        if (marksNum === null || (!isNaN(marksNum) && marksNum >= 0 && marksNum <= selectedExam.totalMarks)) {
                                                            newMarks.set(student.id, marksNum);
                                                            setMarksToSave(newMarks);
                                                        }
                                                    }} className="w-24 p-1 rounded bg-slate-100 dark:bg-slate-700 border" />
                                                    <span> / {selectedExam.totalMarks}</span>
                                                </td>
                                                <td className="p-2">
                                                    {mark?.answerSheetUrl && !uploadedFile ? (
                                                        <a href={mark.answerSheetUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-xs">View Uploaded</a>
                                                    ): null}
                                                    <input type="file" id={`sheet-${student.id}`} className="hidden" onChange={e => e.target.files?.[0] && setAnswerSheetsToSave(prev => new Map(prev.set(student.id, e.target.files![0])))} />
                                                    <label htmlFor={`sheet-${student.id}`} className="ml-2 text-xs cursor-pointer bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded-md hover:bg-slate-300">
                                                        {uploadedFile ? uploadedFile.name : (mark?.answerSheetUrl ? 'Replace' : 'Upload')}
                                                    </label>
                                                </td>
                                                <td className="p-2 text-center">
                                                    <Button size="sm" variant="secondary" onClick={() => mark && setViewingCommentsFor(mark)} disabled={!mark}>View</Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <Button onClick={handleSaveMarksAndSheets}>Save All</Button>
                        </div>
                        </>
                    ) : (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
                           <p><strong>Marks Obtained:</strong> {userMark ? `${userMark.marksObtained} / ${selectedExam.totalMarks}` : 'Not Marked Yet'}</p>
                           {userMark?.answerSheetUrl && <a href={userMark.answerSheetUrl} target="_blank" rel="noreferrer"><Button variant='secondary'>Download Answer Sheet</Button></a>}
                           {userMark && <Button onClick={() => setViewingCommentsFor(userMark)}>View/Add Comments</Button>}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
  }

  return (
    <>
    <Card className="animate-scaleIn">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Exams for {classes.find(c => c.id === selectedClassId)?.name}</h2>
            {user.role === Role.STAFF && <Button onClick={() => handleExamModalOpen()}>Create Exam</Button>}
        </div>
        <div className="space-y-4">
            {filteredExams.map(exam => (
                <div key={exam.id} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{exam.name}</p>
                        <p className="text-sm text-slate-500">Date: {exam.date} | Total Marks: {exam.totalMarks}</p>
                    </div>
                    <div className="flex gap-2">
                        {user.role === Role.STAFF && <Button variant="secondary" size="sm" onClick={() => handleExamModalOpen(exam)}>Edit</Button>}
                        <Button size="sm" onClick={() => setSelectedExam(exam)}>View Marks</Button>
                    </div>
                </div>
            ))}
            {filteredExams.length === 0 && <p className="text-center text-slate-500 py-8">No exams found for this class.</p>}
        </div>
    </Card>

    <Modal isOpen={isExamModalOpen} onClose={() => setIsExamModalOpen(false)} title={editingExam ? "Edit Exam" : "Create Exam"} footer={<><Button variant="secondary" onClick={() => setIsExamModalOpen(false)}>Cancel</Button><Button onClick={handleExamSubmit}>Save</Button></>}>
        <div className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={examName} onChange={e => setExamName(e.target.value)} className={inputClasses}/></div>
            <div><label className="block text-sm font-medium mb-1">Date</label><input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className={inputClasses}/></div>
            <div><label className="block text-sm font-medium mb-1">Total Marks</label><input type="number" value={examTotalMarks} onChange={e => setExamTotalMarks(Number(e.target.value))} className={inputClasses}/></div>
            <div><label className="block text-sm font-medium mb-1">Question Paper (Optional)</label><input type="file" onChange={e => setExamPaperFile(e.target.files ? e.target.files[0] : null)} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/></div>
        </div>
    </Modal>
    
    <Modal isOpen={!!viewingCommentsFor} onClose={() => setViewingCommentsFor(null)} title="Comments" footer={<Button onClick={() => setViewingCommentsFor(null)}>Close</Button>}>
        <div className="space-y-4 max-h-72 overflow-y-auto p-1">
            {markComments.filter(c => c.markId === viewingCommentsFor?.id).length > 0 ? markComments.filter(c => c.markId === viewingCommentsFor?.id).map(comment => {
                const commenter = allUsers.find(u => u.id === comment.userId);
                return (
                    <div key={comment.id} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-md">
                        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                           <span className="font-semibold">{commenter?.name} ({commenter?.role.toLowerCase()})</span>
                           <span>{new Date(comment.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 text-sm">{comment.comment}</p>
                    </div>
                )
            }) : <p className="text-sm text-slate-500 text-center py-4">No comments yet.</p>}
        </div>
        <div className="mt-4 border-t dark:border-slate-700 pt-4">
            <h4 className="font-semibold mb-2">Add a comment</h4>
            <textarea rows={3} value={newComment} onChange={e => setNewComment(e.target.value)} className={inputClasses} placeholder="Type your comment or re-evaluation request..."/>
            <div className="text-right mt-2">
                <Button onClick={handleAddComment}>Post Comment</Button>
            </div>
        </div>
    </Modal>
    </>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, theme, toggleTheme, updateUser, allUsers, onUpdateAllUsers }) => {
  const [activeView, setActiveView] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [onDutyRequests, setOnDutyRequests] = useState<OnDutyRequest[]>(MOCK_ONDUTY_REQUESTS);
  const [noDueRequests, setNoDueRequests] = useState<NoDueRequest[]>(MOCK_NODUE_REQUESTS);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(MOCK_LEAVE_REQUESTS);

  const [assignments, setAssignments] = useState<Assignment[]>(MOCK_ASSIGNMENTS);
  const [attendance, setAttendance] = useState<Attendance[]>(MOCK_ATTENDANCE);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);

  const [classes, setClasses] = useState<Class[]>(MOCK_CLASSES);
  const [classMemberships, setClassMemberships] = useState<ClassMembership[]>(MOCK_CLASS_MEMBERSHIPS);
  const [sections, setSections] = useState<Section[]>(MOCK_SECTIONS);
  
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  const [classMaterials, setClassMaterials] = useState<ClassMaterial[]>(MOCK_CLASS_MATERIALS);
  const [exams, setExams] = useState<Exam[]>(MOCK_EXAMS);
  const [examMarks, setExamMarks] = useState<ExamMark[]>(MOCK_EXAM_MARKS);
  const [markComments, setMarkComments] = useState<MarkComment[]>(MOCK_MARK_COMMENTS);
  
  const onUpdateUser = (updatedUser: User) => {
    onUpdateAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if(updatedUser.id === user.id) {
        updateUser(updatedUser);
    }
  };

  const handleChangePassword = (oldPass: string, newPass: string) => {
    if (user.password !== oldPass) {
        return { success: false, message: 'Incorrect old password.'};
    }
    const updatedUser = { ...user, password: newPass };
    onUpdateUser(updatedUser);
    return { success: true, message: 'Password updated successfully!' };
  };

  const studentClasses = useMemo(() => {
    return classes.filter(c => user.classIds.includes(c.id));
  }, [classes, user.classIds]);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(studentClasses.length > 0 ? studentClasses[0].id : null);
  
  useEffect(() => {
    if (user.role === Role.STAFF) {
      setSelectedClassId(classes.length > 0 ? classes[0].id : 'ALL');
    } else {
      setSelectedClassId(studentClasses.length > 0 ? studentClasses[0].id : null);
    }
  }, [user.role, classes, studentClasses]);

  // Send reminders for events starting in 3 days
  useEffect(() => {
    if (user.role === Role.STAFF) return; // Reminders are for students/parents

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const relevantEvents = events.filter(e => {
        if (e.audience === 'ALL') return true;
        
        const child = user.role === Role.PARENT ? allUsers.find(u => u.id === user.studentId) : null;
        const relevantClassIds = user.role === Role.STUDENT ? user.classIds : (child ? child.classIds : []);

        if ((user.role === Role.STUDENT || user.role === Role.PARENT) && e.audience === 'STUDENT') {
            return !e.classId || relevantClassIds.includes(e.classId);
        }

        if (user.role === Role.PARENT && e.audience === 'PARENT') {
            return true;
        }
        
        return false;
    });

    const upcomingEvents = relevantEvents.filter(e => {
      const eventDate = new Date(e.start);
      const today = new Date();
      today.setHours(0,0,0,0);
      return eventDate <= threeDaysFromNow && eventDate >= today;
    });

    const notificationsToAdd: Notification[] = [];
    upcomingEvents.forEach(event => {
        const message = `Upcoming Event: ${event.title} is starting on ${event.start}.`;
        const reminderExists = notifications.some(n => n.message === message);
        if (!reminderExists) {
            notificationsToAdd.push({
                id: `N-reminder-event-${event.id}`,
                userId: user.id,
                message: message,
                type: NotificationType.INFO,
                timestamp: new Date().toISOString(),
                read: false,
            });
        }
    });

    if (notificationsToAdd.length > 0) {
        setNotifications(prev => [...notificationsToAdd, ...prev]);
    }
  }, [events, user, allUsers, notifications, setNotifications]);


  const handleAddNewNoDueRequest = (department: string, remarks: string) => {
        const newRequest: NoDueRequest = {
            id: `ND${Date.now()}`,
            studentId: user.id,
            studentName: user.name,
            department,
            status: RequestStatus.PENDING,
            remarks,
            requestedDate: new Date().toISOString().split('T')[0],
        };
        setNoDueRequests(prev => [newRequest, ...prev]);

        // Notify all staff
        const staffUsers = allUsers.filter(u => u.role === Role.STAFF);
        const newNotifications: Notification[] = staffUsers.map(staff => ({
             id: `N${Date.now()}${staff.id}`,
             userId: staff.id,
             message: `New No-Due request from ${user.name} for the ${department} department.`,
             type: NotificationType.INFO,
             timestamp: new Date().toISOString(),
             read: false,
        }));
        setNotifications(prev => [...newNotifications, ...prev]);
    };

    const handleUpdateNoDueRequestStatus = (requestId: string, status: RequestStatus) => {
        let studentId = '';
        setNoDueRequests(prev => prev.map(req => {
            if (req.id === requestId) {
                studentId = req.studentId;
                return { ...req, status };
            }
            return req;
        }));

        if (studentId) {
            const student = allUsers.find(u => u.id === studentId);
            const request = noDueRequests.find(r => r.id === requestId);
            if (student && request) {
                const newNotification: Notification = {
                    id: `N${Date.now()}${student.id}`,
                    userId: student.id,
                    message: `Your No-Due request for ${request.department} has been ${status.toLowerCase()}.`,
                    type: status === RequestStatus.APPROVED ? NotificationType.SUCCESS : NotificationType.ERROR,
                    timestamp: new Date().toISOString(),
                    read: false,
                };
                setNotifications(prev => [newNotification, ...prev]);
            }
        }
    };

    const handleUpdateOnDutyRequestStatus = (requestId: string, status: RequestStatus) => {
        let studentId = '';
        setOnDutyRequests(prev => prev.map(req => {
            if (req.id === requestId) {
                studentId = req.studentId;
                return { ...req, status };
            }
            return req;
        }));

        if (studentId) {
            const student = allUsers.find(u => u.id === studentId);
            const request = onDutyRequests.find(r => r.id === requestId);
            if (student && request) {
                const newNotification: Notification = {
                    id: `N-od-${Date.now()}${student.id}`,
                    userId: student.id,
                    message: `Your On-Duty request for "${request.eventName}" has been ${status.toLowerCase()}.`,
                    type: status === RequestStatus.APPROVED ? NotificationType.SUCCESS : NotificationType.ERROR,
                    timestamp: new Date().toISOString(),
                    read: false,
                };
                setNotifications(prev => [newNotification, ...prev]);
            }
        }
    };

     const handleAddNewLeaveRequest = (requestData: Omit<LeaveRequest, 'id' | 'status' | 'studentName'>) => {
        const newRequest: LeaveRequest = {
            ...requestData,
            id: `LR${Date.now()}`,
            studentName: user.name,
            status: RequestStatus.PENDING,
        };
        setLeaveRequests(prev => [newRequest, ...prev]);

        const staffUsers = allUsers.filter(u => u.role === Role.STAFF);
        const newNotifications: Notification[] = staffUsers.map(staff => ({
             id: `N-lr-${Date.now()}${staff.id}`,
             userId: staff.id,
             message: `New Leave request from ${user.name}.`,
             type: NotificationType.INFO,
             timestamp: new Date().toISOString(),
             read: false,
        }));
        setNotifications(prev => [...newNotifications, ...prev]);
    };

    const handleUpdateLeaveRequestStatus = (requestId: string, status: RequestStatus) => {
        let studentId = '';
        setLeaveRequests(prev => prev.map(req => {
            if (req.id === requestId) {
                studentId = req.studentId;
                return { ...req, status };
            }
            return req;
        }));

        if (studentId) {
            const student = allUsers.find(u => u.id === studentId);
            const request = leaveRequests.find(r => r.id === requestId);
            if (student && request) {
                const newNotification: Notification = {
                    id: `N-lr-update-${Date.now()}${student.id}`,
                    userId: student.id,
                    message: `Your ${request.leaveType} request for ${request.fromDate} has been ${status.toLowerCase()}.`,
                    type: status === RequestStatus.APPROVED ? NotificationType.SUCCESS : NotificationType.ERROR,
                    timestamp: new Date().toISOString(),
                    read: false,
                };
                setNotifications(prev => [newNotification, ...prev]);
            }
        }
    };
    
    const handleMarkAttendance = (classId: string, date: string, subject: string, studentStatuses: Map<string, AttendanceStatus>) => {
        const updatedAttendance = [...attendance];
        
        studentStatuses.forEach((status, studentId) => {
            const existingIndex = updatedAttendance.findIndex(a => 
                a.classId === classId && 
                a.date === date && 
                a.subject === subject &&
                a.studentId === studentId
            );

            if (existingIndex !== -1) {
                updatedAttendance[existingIndex] = { ...updatedAttendance[existingIndex], status };
            } else {
                updatedAttendance.push({
                    id: `AT-${Date.now()}-${studentId}`,
                    studentId,
                    classId,
                    date,
                    status,
                    subject,
                });
            }
        });
        setAttendance(updatedAttendance);
    };

    const handleCreateClass = (name: string, description: string) => {
      const newClass: Class = {
        id: `C${Date.now()}`,
        name,
        description,
      };
      setClasses(prev => [...prev, newClass]);
    };
  
    const handleAddStudentsToClass = (classId: string, studentIds: string[], sectionId: string | null) => {
      const newMemberships: ClassMembership[] = studentIds.map(studentId => ({
        id: `CM${Date.now()}${Math.random()}`,
        userId: studentId,
        classId,
        sectionId,
        role: Role.STUDENT,
      }));
      setClassMemberships(prev => [...prev, ...newMemberships]);
  
      onUpdateAllUsers(prevUsers => prevUsers.map(u => {
        if (studentIds.includes(u.id)) {
          if (!u.classIds.includes(classId)) {
            const updatedUser = { ...u, classIds: [...u.classIds, classId] };
            if (u.id === user.id) updateUser(updatedUser); // Update current user if they are the one being updated
            return updatedUser;
          }
        }
        return u;
      }));
    };
  
    const handleRemoveStudentFromClass = (membershipId: string) => {
        const membership = classMemberships.find(cm => cm.id === membershipId);
        if(!membership) return;

        // Find if user is in other classes, if not, remove class from user's classIds
        const otherMemberships = classMemberships.filter(cm => cm.userId === membership.userId && cm.id !== membership.id);
        const inOtherClasses = otherMemberships.some(cm => cm.classId === membership.classId);

        setClassMemberships(prev => prev.filter(cm => cm.id !== membershipId));
        
        if (!inOtherClasses) {
             onUpdateAllUsers(prevUsers => prevUsers.map(u => {
                if (u.id === membership.userId) {
                const updatedUser = { ...u, classIds: u.classIds.filter(id => id !== membership.classId) };
                if (u.id === user.id) updateUser(updatedUser);
                return updatedUser;
                }
                return u;
            }));
        }
    };

    const handleUpdateClass = (classId: string, name: string, description: string) => {
        setClasses(prev => prev.map(c => 
          c.id === classId ? { ...c, name, description } : c
        ));
    };
    
    const handleDeleteClass = (classId: string) => {
      // If the currently selected class is the one being deleted, reset selection
      if (selectedClassId === classId) {
        setSelectedClassId(null);
      }
    
      // 1. Remove the class from state
      setClasses(prev => prev.filter(c => c.id !== classId));
    
      // 2. Remove all memberships associated with that class
      setClassMemberships(prev => prev.filter(cm => cm.classId !== classId));

      // 3. Remove all sections associated with that class
      setSections(prev => prev.filter(s => s.classId !== classId));
    
      // 4. Update all users to remove the deleted classId from their classIds array
      onUpdateAllUsers(prevUsers => prevUsers.map(u => {
        if (u.classIds.includes(classId)) {
          const updatedUser = { ...u, classIds: u.classIds.filter(id => id !== classId) };
          // If the currently logged-in user is affected, update their state
          if (u.id === user.id) {
            updateUser(updatedUser);
          }
          return updatedUser;
        }
        return u;
      }));
    };

    const handleCreateSection = (classId: string, name: string) => {
        const newSection: Section = {
            id: `S${Date.now()}`,
            name,
            classId,
        };
        setSections(prev => [...prev, newSection]);
    };

    const handleUpdateSection = (sectionId: string, name: string) => {
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, name } : s));
    };

    const handleDeleteSection = (sectionId: string) => {
        setSections(prev => prev.filter(s => s.id !== sectionId));
        // Unassign students from this section
        setClassMemberships(prev => prev.map(cm => cm.sectionId === sectionId ? { ...cm, sectionId: null } : cm));
    };

    const handleAssignStudentToSection = (membershipId: string, sectionId: string | null) => {
        setClassMemberships(prev => prev.map(cm => cm.id === membershipId ? { ...cm, sectionId } : cm));
    };

  const menuItems = [
    { name: 'Dashboard', icon: HomeIcon, view: 'overview' },
    { name: 'Class Dashboard', icon: ClassIcon, view: 'classDashboard' },
    { name: 'Manage Classes', icon: GraduationCapIcon, view: 'manageClasses', roles: [Role.STAFF] },
    { name: 'Manage Requests', icon: DocumentTextIcon, view: 'allRequests', roles: [Role.STAFF] },
    { name: 'Assignments', icon: AssignmentIcon, view: 'assignments' },
    { name: 'Exams & Marks', icon: ClipboardCheckIcon, view: 'exams' },
    { name: 'Class Materials', icon: BookOpenIcon, view: 'materials' },
    { name: 'Attendance', icon: AttendanceIcon, view: 'attendance' },
    { name: 'My Requests', icon: RequestIcon, view: 'requests', roles: [Role.STUDENT, Role.PARENT] },
    { name: 'Student Profiles', icon: UserIcon, view: 'profiles' },
    { name: 'Messages', icon: MessageIcon, view: 'messages' },
    { name: 'Announcements', icon: AnnouncementIcon, view: 'announcements' },
    { name: 'Calendar', icon: CalendarIcon, view: 'calendar' },
    { name: 'Feedback', icon: FeedbackIcon, view: 'feedback', roles: [Role.STUDENT] },
  ].filter(item => !item.roles || item.roles.includes(user.role));

  const ActiveIcon = menuItems.find(item => item.view === activeView)?.icon || HomeIcon;

  const renderContent = () => {
    switch (activeView) {
      case 'overview': return <OverviewContent user={user} setActiveView={setActiveView} selectedClassId={selectedClassId} classes={classes} />;
      case 'classDashboard': return <ClassDashboardView user={user} selectedClassId={selectedClassId} setActiveView={setActiveView} classes={classes} classMemberships={classMemberships} />;
      case 'manageClasses': return <ManageClassesView user={user} classes={classes} sections={sections} classMemberships={classMemberships} allUsers={allUsers} onCreateClass={handleCreateClass} onAddStudents={handleAddStudentsToClass} onRemoveStudent={handleRemoveStudentFromClass} onUpdateClass={handleUpdateClass} onDeleteClass={handleDeleteClass} onCreateSection={handleCreateSection} onUpdateSection={handleUpdateSection} onDeleteSection={handleDeleteSection} onAssignStudentToSection={handleAssignStudentToSection} />;
      case 'allRequests': return <AllRequestsView onDutyRequests={onDutyRequests} leaveRequests={leaveRequests} onUpdateOnDuty={handleUpdateOnDutyRequestStatus} onUpdateLeave={handleUpdateLeaveRequestStatus} />;
      case 'assignments': return <AssignmentView user={user} selectedClassId={selectedClassId} assignments={assignments} setAssignments={setAssignments} notifications={notifications} setNotifications={setNotifications} allUsers={allUsers} classMemberships={classMemberships} classes={classes} />;
      case 'exams': return <ExamsView user={user} selectedClassId={selectedClassId} exams={exams} setExams={setExams} examMarks={examMarks} setExamMarks={setExamMarks} markComments={markComments} setMarkComments={setMarkComments} classes={classes} classMemberships={classMemberships} allUsers={allUsers} />;
      case 'materials': return <MaterialsView user={user} selectedClassId={selectedClassId} materials={classMaterials} setMaterials={setClassMaterials} classes={classes} setAnnouncements={setAnnouncements} />;
      case 'attendance': return <AttendanceView user={user} selectedClassId={selectedClassId} attendance={attendance} classMemberships={classMemberships} allUsers={allUsers} onMarkAttendance={handleMarkAttendance} />;
      case 'requests': return <RequestsView user={user} onDutyRequests={onDutyRequests} noDueRequests={noDueRequests} leaveRequests={leaveRequests} onAddNoDueRequest={handleAddNewNoDueRequest} onUpdateNoDueRequestStatus={handleUpdateNoDueRequestStatus} onUpdateOnDutyRequestStatus={handleUpdateOnDutyRequestStatus} onUpdateLeaveRequestStatus={handleUpdateLeaveRequestStatus} onAddLeaveRequest={handleAddNewLeaveRequest} />;
      case 'profiles': return <StudentProfilesView user={user} allUsers={allUsers} onUpdateUser={onUpdateUser} onDutyRequests={onDutyRequests} leaveRequests={leaveRequests} />;
      case 'messages': return <MessagesView user={user} selectedClassId={selectedClassId} classes={classes} />;
      case 'announcements': return <AnnouncementsView user={user} selectedClassId={selectedClassId} classes={classes} announcements={announcements} setAnnouncements={setAnnouncements} />;
      case 'calendar': return <CalendarView user={user} events={events} allUsers={allUsers} />;
      case 'feedback': return <FeedbackView user={user} />;
      case 'profile': return <ProfileView user={user} onUpdateUser={onUpdateUser} onChangePassword={handleChangePassword} />;
      default: return <OverviewContent user={user} setActiveView={setActiveView} selectedClassId={selectedClassId} classes={classes} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-800 shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex-shrink-0 flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700 flex-shrink-0">
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-500">Student Portal</h1>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                <CloseIcon className="w-6 h-6" />
            </button>
        </div>
        <nav className="flex-1 mt-4 p-2 space-y-1 overflow-y-auto">
            {menuItems.map(item => (
                <a key={item.name} href="#" onClick={(e) => { e.preventDefault(); setActiveView(item.view); setIsSidebarOpen(false); }}
                   className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeView === item.view ? 'bg-blue-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                </a>
            ))}
        </nav>
        <div className="p-4 border-t dark:border-slate-700 flex-shrink-0">
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveView('profile'); setIsSidebarOpen(false); }} className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <ProfilePicture user={user} size="md" />
                <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate text-slate-900 dark:text-slate-100">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role.toLowerCase()}</p>
                </div>
            </a>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-white dark:bg-slate-800 shadow-md z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1 text-slate-500">
                    <MenuIcon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-semibold hidden md:block">{menuItems.find(item => item.view === activeView)?.name || 'My Profile'}</h2>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Class Selector */}
                {(user.role !== Role.PARENT) && ['overview', 'classDashboard', 'assignments', 'materials', 'attendance', 'messages', 'exams'].includes(activeView) && (
                    <select value={selectedClassId || ''} onChange={e => setSelectedClassId(e.target.value)} className="p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none text-sm max-w-[150px] sm:max-w-xs">
                        {user.role === Role.STAFF && <option value="ALL">All Classes</option>}
                        {(user.role === Role.STAFF ? classes : studentClasses).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}

                {/* Notifications */}
                <div className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <NotificationIcon className="w-6 h-6" />
                        {notifications.filter(n => !n.read).length > 0 && (
                            <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800"></span>
                        )}
                    </button>
                     {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border dark:border-slate-700 z-20 animate-scaleIn">
                            <div className="p-3 font-semibold border-b dark:border-slate-700 flex justify-between items-center">
                                <span>Notifications</span>
                                <button onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))} className="text-xs font-medium text-blue-600 hover:underline">Mark all as read</button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? notifications.map(n => (
                                    <div key={n.id} className={`p-3 border-b dark:border-slate-700 last:border-b-0 ${!n.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                                        <p className="text-sm text-slate-800 dark:text-slate-200">{n.message}</p>
                                        <p className="text-xs text-slate-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                                    </div>
                                )) : <p className="p-4 text-sm text-slate-500">No new notifications.</p>}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Theme Toggle */}
                <button onClick={toggleTheme} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                    {theme === 'light' ? <MoonIcon className="w-6 h-6"/> : <SunIcon className="w-6 h-6"/>}
                </button>

                {/* Logout */}
                <button onClick={onLogout} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                    <LogoutIcon className="w-6 h-6" />
                </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;