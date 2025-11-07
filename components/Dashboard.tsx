

import React, { useState, ReactNode, useEffect, useMemo, useRef, useCallback } from 'react';
import { User, Role, RequestStatus, NoDueRequest, OnDutyRequest, Assignment, Attendance, Feedback, Notification, AttendanceStatus, Message, Announcement, NotificationType, Class, ClassMembership, SubmittedFile, Event } from '../types';
import { MOCK_USERS, MOCK_NODUE_REQUESTS, MOCK_ONDUTY_REQUESTS, MOCK_ASSIGNMENTS, MOCK_ATTENDANCE, MOCK_FEEDBACK, MOCK_NOTIFICATIONS, MOCK_MESSAGES, MOCK_ANNOUNCEMENTS, MOCK_CLASSES, MOCK_CLASS_MEMBERSHIPS, MOCK_EVENTS } from '../constants';
import { Card, Button, StatusBadge, ConfirmationDialog, Modal } from './UI';
import { HomeIcon, AttendanceIcon, AssignmentIcon, RequestIcon, FeedbackIcon, NotificationIcon, LogoutIcon, MenuIcon, CloseIcon, ApproveIcon, RejectIcon, UserIcon, SortAscIcon, SortDescIcon, UploadIcon, MessageIcon, SendIcon, AnnouncementIcon, ReplyIcon, ClassIcon, SunIcon, MoonIcon, SpinnerIcon, SearchIcon, EyeIcon, EditIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, GraduationCapIcon, KeyIcon, SparklesIcon } from './Icons';
import AITools from './AITools';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  updateUser: (user: User) => void;
}

// Sub-components for different views
const OverviewContent: React.FC<{ user: User, setActiveView: (view: string) => void, selectedClassId: string | null, classes: Class[] }> = ({ user, setActiveView, selectedClassId, classes }) => {
  const getStat = (title: string, value: string | number, color: string, index: number) => (
    <Card className={`bg-gradient-to-br ${color} text-white animate-slideInUp !bg-opacity-100`} style={{ animationDelay: `${index * 100}ms` }}>
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
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">{title}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getStat(attendanceTitle, `${attendancePercentage}%`, 'from-primary-500 to-primary-600', 0)}
            {getStat(assignmentsTitle, pendingAssignments, 'from-yellow-500 to-yellow-600', 1)}
            {user.role === Role.STUDENT && getStat('Active Requests', activeRequests, 'from-green-500 to-green-600', 2)}
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
       const assignmentsToGrade = MOCK_ASSIGNMENTS.filter(a => a.status === 'Submitted' && a.classId === selectedClassId).length;
       return (
        <div>
          <h2 className="text-2xl font-bold mb-1">Staff Overview</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">{title}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getStat('Pending No-Due', pendingNoDue, 'from-primary-500 to-primary-600', 0)}
            {getStat('Pending On-Duty', pendingOnDuty, 'from-yellow-500 to-yellow-600', 1)}
            {getStat('Assignments to Grade', assignmentsToGrade, 'from-green-500 to-green-600', 2)}
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
                <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">{selectedClass.name}</h2>
                <p className="text-zinc-600 dark:text-zinc-400 mt-1">{selectedClass.description}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Recent Announcements" className="animate-slideInUp">
                        {classAnnouncements.length > 0 ? (
                            <div className="space-y-4">
                                {classAnnouncements.map(ann => (
                                    <div key={ann.id} className="border-b border-zinc-200 dark:border-white/10 pb-3 last:border-b-0 last:pb-0">
                                        <h4 className="font-semibold text-zinc-800 dark:text-zinc-200">{ann.title}</h4>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{ann.content}</p>
                                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">By {ann.staffName} on {new Date(ann.timestamp).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-zinc-500 dark:text-zinc-400">No announcements for this class.</p>
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
                                    <thead className="text-left text-zinc-500 dark:text-zinc-400">
                                        <tr>
                                            {user.role === Role.STAFF && <th className="p-2">Student</th>}
                                            <th className="p-2">Subject</th>
                                            <th className="p-2">Due Date</th>
                                            <th className="p-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classAssignments.map(asg => (
                                            <tr key={asg.id} className="border-t border-zinc-200 dark:border-white/10">
                                                {user.role === Role.STAFF && <td className="p-2">{MOCK_USERS.find(u => u.id === asg.studentId)?.name}</td>}
                                                <td className="p-2 font-medium text-zinc-800 dark:text-zinc-200">{asg.subject}</td>
                                                <td className="p-2">{asg.dueDate}</td>
                                                <td className="p-2"><StatusBadge status={asg.status} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-zinc-500 dark:text-zinc-400">No assignments for this class.</p>
                        )}
                         <div className="mt-4 flex justify-end">
                            <Button onClick={() => setActiveView('assignments')}>View All</Button>
                        </div>
                    </Card>
                </div>
                
                <div className="space-y-6">
                    <Card title="Members" className="animate-slideInUp" style={{ animationDelay: '200ms' }}>
                         <div>
                            <h4 className="font-semibold text-sm text-zinc-600 dark:text-zinc-400 mb-2">Staff ({staffMembers.length})</h4>
                            <ul className="space-y-2">
                                {staffMembers.map(member => (
                                    <li key={member.id} className="flex items-center gap-3">
                                        <img src={`https://i.pravatar.cc/40?u=${member.id}`} alt={member.name} className="w-8 h-8 rounded-full" />
                                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{member.name}</span>
                                    </li>
                                ))}
                            </ul>
                         </div>
                         <div className="mt-4">
                             <h4 className="font-semibold text-sm text-zinc-600 dark:text-zinc-400 mb-2">Students ({studentMembers.length})</h4>
                            <ul className="space-y-1 -mx-1 pr-1 max-h-60 overflow-y-auto">
                                {studentMembers.map(member => (
                                    <li key={member.id} className="flex items-center gap-3 p-1.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                                        <img src={`https://i.pravatar.cc/40?u=${member.id}`} alt={member.name} className="w-8 h-8 rounded-full flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{member.name}</p>
                                            {(member.rollNo || member.department) && (
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Jump into the class conversation to ask questions or get help.</p>
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

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">My Profile</h2>
            <Card className="animate-scaleIn">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="relative group">
                        <img 
                            src={`https://i.pravatar.cc/150?u=${user.id}`} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full border-4 border-primary-200 dark:border-primary-700"
                        />
                        {isEditing && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <UploadIcon className="w-8 h-8 text-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        {isEditing ? (
                             <input 
                                type="text"
                                value={editableUser.name}
                                onChange={(e) => setEditableUser(prev => ({ ...prev, name: e.target.value }))}
                                className="text-3xl font-bold text-zinc-800 dark:text-zinc-200 bg-transparent border-b-2 border-primary-300 dark:border-primary-700 focus:outline-none"
                            />
                        ) : (
                            <h3 className="text-3xl font-bold text-zinc-800 dark:text-zinc-200">{user.name}</h3>
                        )}

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
                        
                        <div className="mt-6 border-t dark:border-white/10 pt-4">
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Email</dt>
                                    {isEditing ? (
                                        <input 
                                            type="email"
                                            value={editableUser.email}
                                            onChange={(e) => setEditableUser(prev => ({...prev, email: e.target.value}))}
                                            className="mt-1 text-sm text-zinc-900 dark:text-zinc-100 bg-transparent border-b dark:border-zinc-600 focus:outline-none"
                                        />
                                    ): (
                                        <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{user.email}</dd>
                                    )}
                                </div>
                                <div className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Role</dt>
                                    <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100 capitalize">{user.role.toLowerCase()}</dd>
                                </div>
                                {user.role === Role.PARENT && user.studentId && (
                                    <div className="sm:col-span-2">
                                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Child's Name</dt>
                                        <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{MOCK_USERS.find(u => u.id === user.studentId)?.name || 'N/A'}</dd>
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
                        <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">New Password</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Confirm New Password</label>
                        <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600" />
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
                    <thead className="bg-zinc-50 dark:bg-zinc-700/50 text-zinc-600 dark:text-zinc-400">
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
                            <tr key={req.id} className="border-b dark:border-white/10">
                                {user.role !== Role.STUDENT && <td className="px-4 py-2">{req.studentName}</td>}
                                <td className="px-4 py-2">{req.department}</td>
                                <td className="px-4 py-2">{req.requestedDate}</td>
                                <td className="px-4 py-2"><StatusBadge status={req.status} /></td>
                                <td className="px-4 py-2">{req.remarks}</td>
                                {user.role === Role.STAFF && (
                                    <td className="px-4 py-2">
                                        {req.status === RequestStatus.PENDING && (
                                            <div className="flex justify-center items-center gap-2">
                                                <button onClick={() => setConfirmAction({ action: 'Approve', request: req })} className="p-1.5 text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50" aria-label="Approve">
                                                    <ApproveIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => setConfirmAction({ action: 'Reject', request: req })} className="p-1.5 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Reject">
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
            {userRequests.length === 0 && <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">No requests found.</p>}
            
            <Modal
                isOpen={isNewRequestModalOpen}
                onClose={() => setIsNewRequestModalOpen(false)}
                title="New No-Due Request"
                footer={<><Button variant="secondary" onClick={() => setIsNewRequestModalOpen(false)}>Cancel</Button><Button onClick={handleNewRequestSubmit}>Submit Request</Button></>}
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="department" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Department</label>
                        <select
                            id="department"
                            value={newRequestDept}
                            onChange={(e) => setNewRequestDept(e.target.value)}
                            className="w-full p-2 border rounded-md bg-zinc-50 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
                        >
                            <option value="" disabled>Select a department</option>
                            {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="remarks" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Remarks (Optional)</label>
                        <textarea
                            id="remarks"
                            rows={3}
                            value={newRequestRemarks}
                            onChange={(e) => setNewRequestRemarks(e.target.value)}
                            className="w-full p-2 border rounded-md bg-zinc-50 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
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


const OnDutyRequestView: React.FC<{ user: User, requests: OnDutyRequest[] }> = ({ user, requests }) => {
    const studentId = user.role === Role.PARENT ? user.studentId : user.id;

    const userRequests = useMemo(() => {
        if (user.role === Role.STAFF) return requests;
        return requests.filter(r => r.studentId === studentId);
    }, [user, requests, studentId]);

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
                    <thead className="bg-zinc-50 dark:bg-zinc-700/50 text-zinc-600 dark:text-zinc-400">
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
                            <tr key={req.id} className="border-b dark:border-white/10">
                                {user.role !== Role.STUDENT && <td className="px-4 py-2">{req.studentName}</td>}
                                <td className="px-4 py-2">{req.eventName}</td>
                                <td className="px-4 py-2">{req.fromDate} to {req.toDate}</td>
                                <td className="px-4 py-2"><StatusBadge status={req.status} /></td>
                                <td className="px-4 py-2">{req.reason}</td>
                                {user.role === Role.STAFF && (
                                    <td className="px-4 py-2">
                                        {req.status === RequestStatus.PENDING && (
                                            <div className="flex justify-center items-center gap-2">
                                                <button className="p-1.5 text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50" aria-label="Approve">
                                                    <ApproveIcon className="w-5 h-5" />
                                                </button>
                                                <button className="p-1.5 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Reject">
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
            {userRequests.length === 0 && <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">No requests found.</p>}
        </Card>
    );
};

const RequestsView: React.FC<{
  user: User;
  onDutyRequests: OnDutyRequest[];
  noDueRequests: NoDueRequest[];
  onAddNoDueRequest: (department: string, remarks: string) => void;
  onUpdateNoDueRequestStatus: (requestId: string, status: RequestStatus, remarks?: string) => void;
}> = (props) => {
    const [activeTab, setActiveTab] = useState<'onDuty' | 'noDue'>('onDuty');

    const TabButton: React.FC<{ tabName: 'onDuty' | 'noDue'; label: string }> = ({ tabName, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                activeTab === tabName
                    ? 'bg-primary-600 text-white'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Manage Requests</h2>
            <div className="mb-6">
                <div className="flex items-center gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg max-w-min">
                    <TabButton tabName="onDuty" label="On-Duty Requests" />
                    <TabButton tabName="noDue" label="No-Due Requests" />
                </div>
            </div>

            {activeTab === 'onDuty' && (
                <OnDutyRequestView user={props.user} requests={props.onDutyRequests} />
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
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
            <div className="mt-1 text-zinc-800 dark:text-zinc-200">{children}</div>
        </div>
    );
    
    return (
        <Modal isOpen={!!assignment} onClose={onClose} title={`Assignment Details: ${assignment.subject}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {user.role === Role.STAFF && student && (
                    <DetailItem label="Student">
                       <div className="flex items-center gap-2">
                            <img src={`https://i.pravatar.cc/40?u=${student.id}`} alt={student.name} className="w-8 h-8 rounded-full" />
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
                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
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
                             <a href={assignment.gradedFileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
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
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Subject</label>
                    <input
                        type="text"
                        value={editedAssignment.subject}
                        onChange={(e) => setEditedAssignment(prev => prev ? { ...prev, subject: e.target.value } : null)}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Due Date</label>
                    <input
                        type="date"
                        value={editedAssignment.dueDate}
                        onChange={(e) => setEditedAssignment(prev => prev ? { ...prev, dueDate: e.target.value } : null)}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm"
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
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">{file.name}</a>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-zinc-500">No files were submitted.</p>}
                </div>
                 <div>
                    <label className="block text-sm font-medium">Grade</label>
                    <input
                        type="text"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        placeholder="e.g., A+, B-, 85%"
                        className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Upload Graded File (Optional)</label>
                     <input
                        type="file"
                        onChange={(e) => setGradedFile(e.target.files?.[0])}
                        className="mt-1 block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
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
}> = ({ user, selectedClassId, assignments, setAssignments, notifications, setNotifications }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Submitted' | 'Graded'>('All');
    const [submissionFilter, setSubmissionFilter] = useState<'All' | 'With Submission' | 'No Submission'>('All');
    const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(false);
    const [newAssignmentSubject, setNewAssignmentSubject] = useState('');
    const [newAssignmentDueDate, setNewAssignmentDueDate] = useState('');
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
    const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
    const [uploadingAssignment, setUploadingAssignment] = useState<Assignment | null>(null);
    const [gradingAssignment, setGradingAssignment] = useState<Assignment | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const studentId = user.role === Role.PARENT ? user.studentId : user.id;

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

    const handleCreateAssignment = () => {
        if (!newAssignmentSubject || !newAssignmentDueDate || !selectedClassId || selectedClassId === 'ALL') {
            alert("Please select a specific class and fill all fields.");
            return;
        }

        const classStudents = MOCK_CLASS_MEMBERSHIPS
            .filter(cm => cm.classId === selectedClassId && cm.role === Role.STUDENT)
            .map(cm => cm.userId);
        
        const newAssignments: Assignment[] = classStudents.map(studentId => ({
            id: `AS${Date.now()}${Math.random()}`,
            studentId,
            classId: selectedClassId,
            subject: newAssignmentSubject,
            dueDate: newAssignmentDueDate,
            status: 'Pending',
        }));

        setAssignments(prev => [...prev, ...newAssignments]);
        setIsNewAssignmentModalOpen(false);
        setNewAssignmentSubject('');
        setNewAssignmentDueDate('');
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
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600'
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
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-600'
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
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Status:</span>
                        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <StatusButton status="All" />
                            <StatusButton status="Pending" />
                            <StatusButton status="Submitted" />
                            <StatusButton status="Graded" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Submission:</span>
                        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
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
                        className="pl-10 pr-4 py-2 w-full md:w-80 border rounded-lg bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                </div>
                {user.role === Role.STAFF && (
                    <Button onClick={() => setIsNewAssignmentModalOpen(true)} disabled={!selectedClassId || selectedClassId === 'ALL'}>
                        New Assignment
                    </Button>
                )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-700/50 text-zinc-600 dark:text-zinc-400">
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
                            <tr key={asg.id} className="border-b dark:border-white/10">
                                {user.role === Role.STAFF && <td className="px-4 py-2">{MOCK_USERS.find(u => u.id === asg.studentId)?.name}</td>}
                                <td className="px-4 py-2 font-medium">{asg.subject}</td>
                                <td className="px-4 py-2">{asg.dueDate}</td>
                                <td className="px-4 py-2">{asg.submittedOn || '—'}</td>
                                <td className="px-4 py-2"><StatusBadge status={asg.status} /></td>
                                <td className="px-4 py-2">{asg.grade || '—'}</td>
                                <td className="px-4 py-2">
                                    <div className="flex justify-center items-center gap-2">
                                        <button onClick={() => setViewingAssignment(asg)} className="p-1.5 text-zinc-500 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700" aria-label="View Details">
                                            <EyeIcon className="w-5 h-5" />
                                        </button>
                                        {user.role === Role.STAFF && (
                                            <>
                                            <button onClick={() => setEditingAssignment(asg)} className="p-1.5 text-zinc-500 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700" aria-label="Edit Assignment">
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            {asg.status === 'Submitted' && (
                                                <button onClick={() => setGradingAssignment(asg)} className="p-1.5 text-zinc-500 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700" aria-label="Grade Assignment">
                                                    <GraduationCapIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                            </>
                                        )}
                                        {asg.status === 'Pending' && user.role === Role.STUDENT && (
                                            <button onClick={() => handleUploadClick(asg)} className="p-1.5 text-zinc-500 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700" aria-label="Upload Files">
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
                            className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                        >
                            <UploadIcon className="w-10 h-10 text-zinc-400 mb-2"/>
                            <span className="text-sm font-semibold">Click to browse or drag files here</span>
                            <span className="text-xs text-zinc-500">Multiple files are allowed</span>
                        </button>
                    </div>
                    {selectedFiles.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2">Selected Files:</h4>
                            <ul className="space-y-2 max-h-48 overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-md">
                                {selectedFiles.map(file => (
                                    <li key={file.name} className="flex justify-between items-center p-2 rounded-md bg-white dark:bg-zinc-700 shadow-sm">
                                        <div>
                                            <p className="text-sm font-medium">{file.name}</p>
                                            <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(2)} KB</p>
                                        </div>
                                        <button onClick={() => handleRemoveFile(file.name)} className="p-1 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
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
                onClose={() => setIsNewAssignmentModalOpen(false)}
                title="Create New Assignment"
                footer={<><Button variant="secondary" onClick={() => setIsNewAssignmentModalOpen(false)}>Cancel</Button><Button onClick={handleCreateAssignment}>Create</Button></>}
            >
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    This assignment will be created for all students in the selected class: <strong>{MOCK_CLASSES.find(c => c.id === selectedClassId)?.name || 'N/A'}</strong>.
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Subject</label>
                        <input type="text" value={newAssignmentSubject} onChange={e => setNewAssignmentSubject(e.target.value)} className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Due Date</label>
                        <input type="date" value={newAssignmentDueDate} onChange={e => setNewAssignmentDueDate(e.target.value)} className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600" />
                    </div>
                </div>
            </Modal>
        </Card>
    );
};

const AttendanceView: React.FC<{ user: User, selectedClassId: string | null }> = ({ user, selectedClassId }) => {
    const studentId = user.role === Role.PARENT ? user.studentId : user.id;

    const filteredAttendance = useMemo(() => {
        return MOCK_ATTENDANCE
            .filter(a => selectedClassId === 'ALL' || a.classId === selectedClassId)
            .filter(a => user.role === Role.STAFF || a.studentId === studentId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedClassId, user.role, studentId]);

    return (
        <Card className="animate-scaleIn">
            <h2 className="text-xl font-semibold mb-4">Attendance Records</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-700/50 text-zinc-600 dark:text-zinc-400">
                        <tr>
                            {user.role === Role.STAFF && <th className="px-4 py-2">Student</th>}
                            <th className="px-4 py-2">Date</th>
                            <th className="px-4 py-2">Subject</th>
                            <th className="px-4 py-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAttendance.map(att => (
                            <tr key={att.id} className="border-b dark:border-white/10">
                                {user.role === Role.STAFF && <td className="px-4 py-2">{MOCK_USERS.find(u => u.id === att.studentId)?.name}</td>}
                                <td className="px-4 py-2">{att.date}</td>
                                <td className="px-4 py-2">{att.subject}</td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${att.status === 'P' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                        {att.status === 'P' ? 'Present' : 'Absent'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
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
                        className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
                    >
                        <option value="" disabled>Select Staff Member</option>
                        {allStaff.map(staff => <option key={staff.id} value={staff.id}>{staff.name} - {staff.designation}</option>)}
                    </select>
                    <textarea
                        rows={4}
                        placeholder="Share your thoughts..."
                        value={newFeedback}
                        onChange={e => setNewFeedback(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
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
                     <div key={fb.id} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <p className="text-zinc-700 dark:text-zinc-300">{fb.comments}</p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                            To: <strong>{fb.staffName}</strong> on {fb.createdDate}
                        </p>
                    </div>
                )) : (
                    <p className="text-zinc-500 dark:text-zinc-400">No feedback history.</p>
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
            <div className="p-2 bg-zinc-100 dark:bg-zinc-700 rounded-t-lg border-b dark:border-zinc-600 flex justify-between items-center animate-fadeIn">
                <div>
                    <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Replying to {sender?.name}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">"{message.content}"</p>
                </div>
                <button onClick={onCancel} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-600">
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
            <div className={`flex items-start gap-3 w-full animate-slideInUp ${level > 0 ? 'mt-3 pl-6 border-l-2 border-zinc-200 dark:border-zinc-700' : ''}`}
                 onMouseEnter={() => setShowReplyButton(true)} onMouseLeave={() => setShowReplyButton(false)}>
                <img src={`https://i.pravatar.cc/40?u=${sender?.id}`} alt={sender?.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1">
                    <div className="bg-white dark:bg-zinc-800/60 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                            <p className="font-semibold text-zinc-800 dark:text-zinc-200">{sender?.name}</p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                         {parentMessage && parentSender && (
                            <a href={`#message-${parentMessage.id}`} className="mt-2 p-2 block border-l-2 border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700/50 rounded-r-md hover:bg-zinc-100 dark:hover:bg-zinc-600">
                                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Replying to {parentSender.name}</p>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">"{parentMessage.content}"</p>
                            </a>
                        )}
                        <p className="mt-2 text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">{message.content}</p>
                    </div>
                </div>
                 <div className="w-10 flex-shrink-0">
                    {showReplyButton && (
                        <button onClick={() => onReply(message)} className="p-2 text-zinc-400 hover:text-primary-600 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700">
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
                <div className="p-4 border-t dark:border-white/10 bg-zinc-50 dark:bg-zinc-800/50">
                    {replyingTo && <ReplyPreview message={replyingTo} onCancel={() => setReplyingTo(null)} />}
                    <div className="flex items-center gap-2">
                        <textarea
                            rows={1}
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            placeholder="Type a message..."
                            className={`flex-1 p-2 border rounded-lg bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 resize-none ${replyingTo ? 'rounded-t-none' : ''}`}
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

const AnnouncementsView: React.FC<{ user: User, selectedClassId: string | null, classes: Class[] }> = ({ user, selectedClassId, classes }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
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
                                <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">{ann.title}</h3>
                                {ann.classId && <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{classes.find(c => c.id === ann.classId)?.name}</p>}
                            </div>
                             <div className="text-right text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0 ml-4">
                                <p>By {ann.staffName}</p>
                                <p>{new Date(ann.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                        <p className="mt-4 text-zinc-600 dark:text-zinc-300">{ann.content}</p>
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
                        <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Content</label>
                        <textarea rows={5} value={newContent} onChange={e => setNewContent(e.target.value)} className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Audience</label>
                         <select value={newAudience} onChange={e => setNewAudience(e.target.value as any)} className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600">
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

const StudentProfilesView: React.FC<{ user: User, allUsers: User[], onUpdateUser: (user:User) => void }> = ({ user, allUsers, onUpdateUser }) => {
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
        return <StudentProfileDetail student={user} onBack={() => {}} onUpdateUser={onUpdateUser} currentUser={user} />;
    }
     if (user.role === Role.PARENT) {
        const child = allUsers.find(u => u.id === user.studentId);
        if (child) {
            return <StudentProfileDetail student={child} onBack={() => {}} onUpdateUser={onUpdateUser} currentUser={user} />;
        }
        return <Card><p>Could not find student profile.</p></Card>;
    }
    
    if (selectedStudent) {
        return <StudentProfileDetail student={selectedStudent} onBack={() => setSelectedStudent(null)} onUpdateUser={onUpdateUser} currentUser={user} />;
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
                    className="pl-10 pr-4 py-2 w-full border rounded-lg bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {students.length > 0 ? (
                    students.map(student => (
                        <div key={student.id} onClick={() => setSelectedStudent(student)} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg flex items-center gap-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-all duration-200 hover:shadow-lg hover:scale-105">
                            <img src={`https://i.pravatar.cc/40?u=${student.id}`} alt={student.name} className="w-12 h-12 rounded-full" />
                            <div>
                                <p className="font-semibold">{student.name}</p>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">{student.rollNo}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-10">
                        <p className="text-zinc-500 dark:text-zinc-400">No students found matching your search.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

const StudentProfileDetail: React.FC<{ student: User; onBack: () => void, onUpdateUser: (user: User) => void, currentUser: User }> = ({ student, onBack, onUpdateUser, currentUser }) => {
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
                        value={editableStudent[field] as string || ''}
                        onChange={(e) => {
                            const value = field === 'year' ? Number(e.target.value) : e.target.value;
                            setEditableStudent(s => ({ ...s, [field]: value }))
                        }}
                        className="p-1 rounded bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 focus:ring-1 focus:ring-primary-500 focus:outline-none text-sm"
                        autoFocus
                    />
                    <button onClick={handleFieldSave} className="p-1 text-green-600 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50" aria-label="Save">
                        <ApproveIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleFieldCancel} className="p-1 text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Cancel">
                        <RejectIcon className="w-5 h-5" />
                    </button>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2 group">
                <span className="text-primary-600 dark:text-primary-400 font-medium">{student[field] || 'N/A'}</span>
                {currentUser.role === Role.STAFF && (
                    <button 
                        onClick={() => {
                            setEditingField(field);
                            setEditableStudent(student); 
                        }} 
                        className="p-1 text-zinc-400 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" 
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
                <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary-600 hover:underline">
                    <ChevronLeftIcon className="w-4 h-4" /> Back to Student List
                </button>
            )}
            <Card>
                <div className="flex justify-between items-start">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <img src={`https://i.pravatar.cc/150?u=${student.id}`} alt="Profile" className="w-32 h-32 rounded-full" />
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-3xl font-bold">{student.name}</h3>
                            <dl className="mt-2 space-y-1">
                                <div className="flex items-center gap-2">
                                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-24 shrink-0">Roll Number</dt>
                                    <dd className="text-sm">{renderEditableField('rollNo')}</dd>
                                </div>
                                <div className="flex items-center gap-2">
                                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-24 shrink-0">Department</dt>
                                    <dd className="text-sm">{renderEditableField('department')}</dd>
                                </div>
                                <div className="flex items-center gap-2">
                                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400 w-24 shrink-0">Year</dt>
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
                <Card title="Recent Assignments" className="animate-slideInUp" style={{ animationDelay: '300ms' }}>
                     <ul className="space-y-2">
                        {assignments.slice(0,5).map(a => (
                            <li key={a.id} className="flex justify-between items-center">
                                <span>{a.subject} ({a.dueDate})</span>
                                <StatusBadge status={a.status} />
                            </li>
                        ))}
                    </ul>
                </Card>
                 <Card title="Recent Attendance" className="animate-slideInUp" style={{ animationDelay: '400ms' }}>
                    <ul className="space-y-2">
                        {attendance.slice(0,5).map(att => (
                            <li key={att.id} className="flex justify-between items-center">
                                <span>{att.date} - {att.subject}</span>
                                 <span className={`font-semibold ${att.status === 'P' ? 'text-green-600' : 'text-red-600'}`}>{att.status === 'P' ? 'Present' : 'Absent'}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};

const CalendarView: React.FC<{ user: User, events: Event[] }> = ({ user, events }) => {
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
            if (user.role === Role.STAFF) return true; // Staff see all
            if (e.audience === 'ALL') return true;
    
            if (user.role === Role.STUDENT && e.audience === 'STUDENT') {
                return !e.classId || user.classIds.includes(e.classId);
            }
    
            if (user.role === Role.PARENT && e.audience === 'PARENT') {
                return true;
            }
            
            return false;
        });
    }, [events, user]);
    
    const getEventsForDay = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return userEvents.filter(e => dateStr >= e.start && dateStr <= e.end);
    };
    
    const eventColors: Record<Event['color'], string> = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
        purple: 'bg-purple-500',
    };

    return (
        <Card className="animate-scaleIn">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700"><ChevronLeftIcon className="w-6 h-6"/></button>
                    <button onClick={nextMonth} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700"><ChevronRightIcon className="w-6 h-6"/></button>
                    <h2 className="text-xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                </div>
                <Button onClick={goToToday} variant="secondary">Today</Button>
            </div>
            <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:border-white/10 border dark:border-white/10">
                {weekdays.map(day => (
                    <div key={day} className="text-center font-semibold text-sm py-2 bg-white dark:bg-zinc-900/80">{day}</div>
                ))}
                {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-zinc-50 dark:bg-zinc-800/50"></div>
                ))}
                {daysArray.map(day => {
                    const dayEvents = getEventsForDay(day);
                    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                    return (
                        <div key={day} className="relative min-h-[120px] bg-white dark:bg-zinc-800/80 p-2">
                             <span className={`absolute top-2 right-2 text-sm font-semibold ${isToday ? 'bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{day}</span>
                            <div className="mt-8 space-y-1">
                                {dayEvents.map(event => (
                                    <div key={event.id} className={`p-1 ${eventColors[event.color]} text-white rounded-md text-xs truncate`} title={event.title}>
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

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, theme, toggleTheme, updateUser }) => {
  const [activeView, setActiveView] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [onDutyRequests, setOnDutyRequests] = useState<OnDutyRequest[]>(MOCK_ONDUTY_REQUESTS);
  const [noDueRequests, setNoDueRequests] = useState<NoDueRequest[]>(MOCK_NODUE_REQUESTS);

  const [assignments, setAssignments] = useState<Assignment[]>(MOCK_ASSIGNMENTS);

  const [classes, setClasses] = useState<Class[]>(MOCK_CLASSES);
  const [classMemberships, setClassMemberships] = useState<ClassMembership[]>(MOCK_CLASS_MEMBERSHIPS);
  
  const [events, setEvents] = useState<Event[]>(MOCK_EVENTS);
  
  const onUpdateUser = (updatedUser: User) => {
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
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
      setSelectedClassId(classes.length > 0 ? classes[0].id : null);
    } else {
      setSelectedClassId(studentClasses.length > 0 ? studentClasses[0].id : null);
    }
  }, [user.role, classes, studentClasses]);


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

  const menuItems = [
    { name: 'Dashboard', icon: HomeIcon, view: 'overview' },
    { name: 'Class Dashboard', icon: ClassIcon, view: 'classDashboard' },
    { name: 'Assignments', icon: AssignmentIcon, view: 'assignments' },
    { name: 'Attendance', icon: AttendanceIcon, view: 'attendance' },
    { name: 'Requests', icon: RequestIcon, view: 'requests' },
    { name: 'Student Profiles', icon: UserIcon, view: 'profiles', roles: [Role.STUDENT, Role.STAFF, Role.PARENT] },
    { name: 'Messages', icon: MessageIcon, view: 'messages' },
    { name: 'Announcements', icon: AnnouncementIcon, view: 'announcements' },
    { name: 'Calendar', icon: CalendarIcon, view: 'calendar' },
    { name: 'AI Tools', icon: SparklesIcon, view: 'aiTools', roles: [Role.STUDENT, Role.STAFF] },
    { name: 'Feedback', icon: FeedbackIcon, view: 'feedback', roles: [Role.STUDENT] },
  ].filter(item => !item.roles || item.roles.includes(user.role));

  const ActiveIcon = menuItems.find(item => item.view === activeView)?.icon || HomeIcon;

  const renderContent = () => {
    switch (activeView) {
      case 'overview': return <OverviewContent user={user} setActiveView={setActiveView} selectedClassId={selectedClassId} classes={classes} />;
      case 'classDashboard': return <ClassDashboardView user={user} selectedClassId={selectedClassId} setActiveView={setActiveView} classes={classes} classMemberships={classMemberships} />;
      case 'assignments': return <AssignmentView user={user} selectedClassId={selectedClassId} assignments={assignments} setAssignments={setAssignments} notifications={notifications} setNotifications={setNotifications} />;
      case 'attendance': return <AttendanceView user={user} selectedClassId={selectedClassId} />;
      case 'requests': return <RequestsView user={user} onDutyRequests={onDutyRequests} noDueRequests={noDueRequests} onAddNoDueRequest={handleAddNewNoDueRequest} onUpdateNoDueRequestStatus={handleUpdateNoDueRequestStatus} />;
      case 'feedback': return <FeedbackView user={user} />;
      case 'messages': return <MessagesView user={user} selectedClassId={selectedClassId} classes={classes} />;
      case 'announcements': return <AnnouncementsView user={user} selectedClassId={selectedClassId} classes={classes} />;
      case 'profiles': return <StudentProfilesView user={user} allUsers={allUsers} onUpdateUser={onUpdateUser} />;
      case 'calendar': return <CalendarView user={user} events={events} />;
      case 'aiTools': return <AITools user={user} />;
      case 'profile': return <ProfileView user={user} onUpdateUser={onUpdateUser} onChangePassword={handleChangePassword} />;
      default: return <div>Select a view</div>;
    }
  };

  const notificationPopupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationPopupRef.current && !notificationPopupRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read && n.userId === user.id).length;

  const Header = () => (
    <header className="bg-white/80 dark:bg-zinc-900/80 dark:backdrop-blur-lg p-4 flex items-center justify-between border-b border-zinc-200 dark:border-white/10">
      <div className="flex items-center gap-4">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2">
          <MenuIcon />
        </button>
        <div className="flex items-center gap-2">
            <ActiveIcon className="w-6 h-6 text-primary-500" />
            <span className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">{menuItems.find(item => item.view === activeView)?.name}</span>
        </div>
      </div>
       <div className="flex items-center gap-4">
        {user.role === Role.STAFF ? (
          <select value={selectedClassId || ''} onChange={e => setSelectedClassId(e.target.value)}
            className="p-2 border rounded-md bg-zinc-50 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600">
            <option value="ALL">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <select value={selectedClassId || ''} onChange={e => setSelectedClassId(e.target.value)}
            className="p-2 border rounded-md bg-zinc-50 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600">
            {studentClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700">
            {theme === 'light' ? <MoonIcon/> : <SunIcon/>}
        </button>
        <div className="relative" ref={notificationPopupRef}>
            <button onClick={() => setShowNotifications(s => !s)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 relative">
                <NotificationIcon />
                {unreadCount > 0 && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-zinc-800" />}
            </button>
            {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-800/80 dark:backdrop-blur-lg dark:border dark:border-white/10 rounded-lg shadow-lg z-10 animate-scaleIn">
                    <div className="p-3 font-semibold border-b dark:border-white/10">Notifications</div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.filter(n => n.userId === user.id).map(n => (
                             <div key={n.id} className={`p-3 border-b dark:border-white/10 text-sm ${!n.read ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                                <p>{n.message}</p>
                                <p className="text-xs text-zinc-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        <button onClick={() => setActiveView('profile')} className="flex items-center gap-2">
            <img src={`https://i.pravatar.cc/40?u=${user.id}`} alt="Profile" className="w-10 h-10 rounded-full" />
        </button>
      </div>
    </header>
  );

  const Sidebar = () => (
    <aside className={`fixed lg:relative inset-y-0 left-0 w-64 bg-primary-800 dark:bg-zinc-950/80 dark:backdrop-blur-xl dark:border-r dark:border-white/10 text-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out z-40 flex flex-col`}>
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Portal</h1>
        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2">
            <CloseIcon />
        </button>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map(item => (
          <button
            key={item.name}
            onClick={() => { setActiveView(item.view); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transform transition-all duration-200 hover:translate-x-1 ${
              activeView === item.view
                ? 'bg-primary-900 dark:bg-white/10 dark:shadow-glow text-white'
                : 'hover:bg-primary-700 dark:hover:bg-white/5 text-primary-100 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-primary-700 dark:border-white/10">
        <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 dark:hover:bg-white/5 text-primary-100 hover:text-white transform transition-all duration-200 hover:translate-x-1"
        >
            <LogoutIcon className="w-5 h-5" />
            <span>Logout</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-zinc-100 dark:bg-transparent">
           <div key={activeView} className="animate-fadeIn">
             {renderContent()}
           </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;