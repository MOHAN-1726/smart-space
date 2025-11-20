import React, { useState, ReactNode, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { User, Role, RequestStatus, NoDueRequest, OnDutyRequest, Assignment, Attendance, Feedback, Notification, AttendanceStatus, Message, Announcement, NotificationType, Class, ClassMembership, SubmittedFile, Event, Section, LeaveRequest, ClassMaterial, Exam, ExamMark, MarkComment } from '../types';
import { Card, Button, StatusBadge, ConfirmationDialog, Modal, ProfilePicture } from './UI';
import { HomeIcon, AttendanceIcon, AssignmentIcon, RequestIcon, FeedbackIcon, NotificationIcon, LogoutIcon, MenuIcon, CloseIcon, ApproveIcon, RejectIcon, UserIcon, SortAscIcon, SortDescIcon, UploadIcon, MessageIcon, SendIcon, AnnouncementIcon, ReplyIcon, ClassIcon, SunIcon, MoonIcon, SpinnerIcon, SearchIcon, EyeIcon, EditIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, GraduationCapIcon, KeyIcon, SparklesIcon, LeaveIcon, DocumentTextIcon, BookOpenIcon, ClipboardCheckIcon, DownloadIcon, PaperPlaneIcon } from './Icons';
import { 
    useGetExamsQuery, 
    useLazyGetExamPaperPresignedUrlQuery,
    useRequestExamPaperMutation,
    useUpdateUserMutation
} from '../src/services/api';
import { RootState } from '../src/store';

// ------ PROPS DEFINITION ------
interface DashboardProps {
  user: User;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// ------ SHARED STYLES ------
const inputClasses = "block w-full p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900";
const searchInputClasses = "pl-10 pr-4 py-2 w-full border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900";


// ------ NEW EXAM CARD COMPONENT ------
const DashboardExamCard: React.FC<{ exam: Exam, user: User }> = ({ exam, user }) => {
    const [triggerPresignedUrl, { isFetching: isFetchingUrl, error: presignedUrlError }] = useLazyGetExamPaperPresignedUrlQuery();
    const [requestPaper, { isLoading: isRequesting, isSuccess: isRequestSuccess }] = useRequestExamPaperMutation();

    const handleDownload = async () => {
        // 1. Direct Download
        if (exam.paperUrl) {
            window.open(exam.paperUrl, '_blank');
            return;
        }

        // 2. Presigned URL Download
        try {
            const { data, error } = await triggerPresignedUrl({ examId: exam.id });
            if (error) throw new Error('Failed to get download link.');
            if (data?.url) {
                window.open(data.url, '_blank');
            }
        } catch (err) {
            console.error(err);
            alert('Could not retrieve the download link. Please try again.');
        }
    };

    const handleRequest = () => {
        requestPaper({ examId: exam.id });
    };

    const renderActionButton = () => {
        if (user.role === Role.STAFF) {
            return <Button size="sm" onClick={() => alert('Staff exam management UI not implemented yet')}>Manage</Button>;
        }

        // Student/Parent View
        const status = isRequestSuccess ? 'Requested' : exam.paperStatus;

        switch (status) {
            case 'Available':
                return (
                    <Button 
                        size="sm" 
                        onClick={handleDownload} 
                        disabled={isFetchingUrl}
                        className="flex items-center gap-2"
                    >
                        {isFetchingUrl ? <SpinnerIcon className="animate-spin w-4 h-4" /> : <DownloadIcon className="w-4 h-4" />}
                        Download Paper
                    </Button>
                );
            case 'Requested':
                return <Button size="sm" variant="secondary" disabled>Requested</Button>;
            case 'NotAvailable':
            default:
                return (
                    <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={handleRequest}
                        disabled={isRequesting}
                        className="flex items-center gap-2"
                    >
                        {isRequesting ? <SpinnerIcon className="animate-spin w-4 h-4" /> : <PaperPlaneIcon className="w-4 h-4" />}
                        Request Paper
                    </Button>
                );
        }
    }

    return (
        <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{exam.name}</p>
                <p className="text-sm text-slate-500">Date: {new Date(exam.date).toLocaleDateString()} | Total Marks: {exam.totalMarks}</p>
            </div>
            <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => alert('Viewing marks not implemented yet')}>View Marks</Button>
                {renderActionButton()}
            </div>
        </div>
    );
}


// ------ REFACTORED EXAMS VIEW ------
const ExamsView: React.FC<{
  user: User;
  selectedClassId: string | null;
}> = ({ user, selectedClassId }) => {

    const { data: exams, error, isLoading, isFetching } = useGetExamsQuery(
        { classId: selectedClassId },
        { skip: !selectedClassId || selectedClassId === 'ALL' }
    );

    const renderBody = () => {
        if (!selectedClassId || selectedClassId === 'ALL') {
            return <Card className="animate-scaleIn"><p>Please select a class to view exams.</p></Card>;
        }
        if (isLoading || isFetching) {
            return (
                <div className="flex justify-center items-center p-10">
                    <SpinnerIcon className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="ml-3 text-slate-500">Loading Exams...</p>
                </div>
            );
        }
        if (error) {
             return <Card className="animate-scaleIn border-red-500/50 bg-red-50 dark:bg-red-500/10"><p className="text-red-600 dark:text-red-400">Could not load exams. Please try again later.</p></Card>;
        }
        if (!exams || exams.length === 0) {
            return <Card className="animate-scaleIn"><p className="text-center text-slate-500 py-8">No exams found for this class.</p></Card>;
        }

        return (
             <Card className="animate-scaleIn">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Exams</h2>
                    {user.role === Role.STAFF && <Button onClick={() => alert('Exam creation not implemented')}>Create Exam</Button>}
                </div>
                <div className="space-y-4">
                    {exams.map(exam => (
                       <DashboardExamCard key={exam.id} exam={exam} user={user} />
                    ))}
                </div>
            </Card>
        )
    }

    return (
        <div className="animate-fadeIn">
            {renderBody()}
        </div>
    );
};

// ------ REFACTORED PROFILE VIEW ------
const ProfileView: React.FC<{ user: User }> = ({ user }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editableUser, setEditableUser] = useState(user);
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      setEditableUser(user);
    }, [user]);

    const handleSave = async () => {
        try {
            await updateUser(editableUser).unwrap();
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch {
            alert('Failed to update profile.');
        }
    };
    
    const handleCancel = () => {
        setEditableUser(user);
        setIsEditing(false);
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

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">My Profile</h2>
            <Card className="animate-scaleIn">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="flex flex-col items-center w-32 flex-shrink-0">
                         <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        <ProfilePicture user={editableUser} size="xl" className="border-4 border-blue-200 dark:border-blue-700"/>
                        {isEditing && (
                            <div className="mt-4 w-full">
                                <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} className="w-full">Change Photo</Button>
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
                        
                        {/* ... (user role specific details) ... */}

                        <div className="mt-6 border-t dark:border-slate-700 pt-4">
                           {/* ... (user details dl/dt/dd) ... */}
                        </div>

                        <div className="mt-6 flex gap-4">
                            {isEditing ? (
                                <>
                                    <Button onClick={handleSave} disabled={isUpdating}>{isUpdating ? 'Saving...' : 'Save Changes'}</Button>
                                    <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                                </>
                            ) : (
                                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// ------ STUBBED OUT VIEWS (TO BE REFACTORED) ------
const StubbedView: React.FC<{ title: string }> = ({ title }) => (
    <Card className="animate-scaleIn">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <p className="text-slate-500">This section is under construction. Data fetching and state management will be refactored to use RTK Query.</p>
    </Card>
);


// ------ MAIN DASHBOARD COMPONENT ------
const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, theme, toggleTheme }) => {
  const [activeView, setActiveView] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Data fetching and state management for most views are now handled within the components themselves or are stubbed.
  // This makes the main Dashboard component much cleaner.

  const { data: allUsers = [] } = useSelector((state: RootState) => state.api.queries['getStudents(undefined)'] ?? {});
  const { data: notifications = [] } = useSelector((state: RootState) => state.api.queries['getNotifications(undefined)'] ?? {});
  const { data: classes = [] } = useSelector((state: RootState) => state.api.queries['getClasses(undefined)'] ?? {}); // Assuming a getClasses endpoint exists
 
  const studentClasses = useMemo(() => {
    return classes.filter((c: Class) => user.classIds.includes(c.id));
  }, [classes, user.classIds]);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  useEffect(() => {
    if (user.role === Role.STAFF) {
      setSelectedClassId(classes.length > 0 ? classes[0].id : 'ALL');
    } else {
      setSelectedClassId(studentClasses.length > 0 ? studentClasses[0].id : null);
    }
  }, [user.role, classes, studentClasses]);

  const menuItems = [
    { name: 'Dashboard', icon: HomeIcon, view: 'overview' },
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
    // Staff-only views
    { name: 'Manage Classes', icon: GraduationCapIcon, view: 'manageClasses', roles: [Role.STAFF] },
    { name: 'Manage Requests', icon: DocumentTextIcon, view: 'allRequests', roles: [Role.STAFF] },
  ].filter(item => !item.roles || item.roles.includes(user.role));

  const renderContent = () => {
    switch (activeView) {
      case 'exams': return <ExamsView user={user} selectedClassId={selectedClassId} />;
      case 'profile': return <ProfileView user={user} />;
      case 'overview':
      case 'assignments':
      case 'materials':
      case 'attendance':
      case 'requests':
      case 'profiles':
      case 'messages':
      case 'announcements':
      case 'calendar':
      case 'feedback':
      case 'manageClasses':
      case 'allRequests':
        return <StubbedView title={menuItems.find(item => item.view === activeView)?.name || 'Page'} />;
      default: return <StubbedView title="Dashboard" />;
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
                {['exams'].includes(activeView) && (
                     <select value={selectedClassId || ''} onChange={e => setSelectedClassId(e.target.value)} className="p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none text-sm max-w-[150px] sm:max-w-xs">
                        {user.role === Role.STAFF && <option value="ALL">All Classes</option>}
                        {(user.role === Role.STAFF ? classes : studentClasses).map((c: Class) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                )}

                 <div className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <NotificationIcon className="w-6 h-6" />
                        {/* ... notification indicator ... */}
                    </button>
                     {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border dark:border-slate-700 z-20 animate-scaleIn">
                           {/* ... notifications list ... */}
                        </div>
                    )}
                </div>
                
                <button onClick={toggleTheme} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                    {theme === 'light' ? <MoonIcon className="w-6 h-6"/> : <SunIcon className="w-6 h-6"/>}
                </button>

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
