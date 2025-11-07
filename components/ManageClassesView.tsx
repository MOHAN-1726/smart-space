import React, { useState, useMemo, useEffect } from 'react';
import { User, Role, Class, ClassMembership } from '../types';
import { Card, Button, Modal, ConfirmationDialog } from './UI';
import { SearchIcon, ChevronLeftIcon, TrashIcon, UserIcon, EditIcon } from './Icons';

interface ManageClassesViewProps {
  user: User;
  classes: Class[];
  classMemberships: ClassMembership[];
  allUsers: User[];
  onCreateClass: (name: string, description: string) => void;
  onUpdateClass: (classId: string, name: string, description: string) => void;
  onDeleteClass: (classId: string) => void;
  onAddStudents: (classId: string, studentIds: string[]) => void;
  onRemoveStudent: (classId: string, studentId: string) => void;
}

const ManageClassesView: React.FC<ManageClassesViewProps> = ({
  user,
  classes,
  classMemberships,
  allUsers,
  onCreateClass,
  onUpdateClass,
  onDeleteClass,
  onAddStudents,
  onRemoveStudent,
}) => {
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [removeStudentConfirmationText, setRemoveStudentConfirmationText] = useState('');

  // State for Create/Edit Class Modal
  const [currentClassName, setCurrentClassName] = useState('');
  const [currentClassDesc, setCurrentClassDesc] = useState('');
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  // State for Add Student Modal
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  useEffect(() => {
    if(editingClass) {
        setCurrentClassName(editingClass.name);
        setCurrentClassDesc(editingClass.description);
    } else {
        setCurrentClassName('');
        setCurrentClassDesc('');
    }
  }, [editingClass]);


  const handleCreateClassSubmit = () => {
    if (currentClassName.trim()) {
      onCreateClass(currentClassName, currentClassDesc);
      setIsCreateModalOpen(false);
      setCurrentClassName('');
      setCurrentClassDesc('');
    }
  };

  const handleEditClassSubmit = () => {
    if (editingClass && currentClassName.trim()) {
        onUpdateClass(editingClass.id, currentClassName, currentClassDesc);
        // Optimistically update the selected class to show changes immediately
        setSelectedClass(prev => prev ? {...prev, name: currentClassName, description: currentClassDesc} : null);
        setIsEditModalOpen(false);
        setEditingClass(null);
    }
  };

  const handleAddStudentsSubmit = () => {
    if (selectedClass && selectedStudentIds.length > 0) {
      onAddStudents(selectedClass.id, selectedStudentIds);
      setIsAddStudentModalOpen(false);
      setSearchTerm('');
      setSelectedStudentIds([]);
    }
  };
  
  const openRemoveStudentConfirmation = (student: User) => {
    setStudentToRemove(student);
    setRemoveStudentConfirmationText('');
  };

  const closeRemoveStudentConfirmation = () => {
    setStudentToRemove(null);
    setRemoveStudentConfirmationText('');
  };

  const handleRemoveStudentConfirm = () => {
    if (selectedClass && studentToRemove && removeStudentConfirmationText === 'REMOVE') {
      onRemoveStudent(selectedClass.id, studentToRemove.id);
      closeRemoveStudentConfirmation();
    }
  };
  
  const handleDeleteClassConfirm = () => {
    if (classToDelete && deleteConfirmationText === classToDelete.name) {
      onDeleteClass(classToDelete.id);
      setClassToDelete(null);
      setSelectedClass(null); // Go back to the list view
      setDeleteConfirmationText('');
    }
  };
  
  const openDeleteConfirmation = (classObj: Class) => {
    setClassToDelete(classObj);
    setDeleteConfirmationText('');
  };

  const closeDeleteConfirmation = () => {
    setClassToDelete(null);
    setDeleteConfirmationText('');
  };


  const handleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };
  
  const getEnrolledStudentCount = (classId: string) => {
    return classMemberships.filter(cm => cm.classId === classId && cm.role === Role.STUDENT).length;
  }

  // Memoized list of students for the "Add Student" modal
  const availableStudents = useMemo(() => {
    const enrolledStudentIds = selectedClass
      ? classMemberships
          .filter(cm => cm.classId === selectedClass.id && cm.role === Role.STUDENT)
          .map(cm => cm.userId)
      : [];

    return allUsers
      .filter(u => u.role === Role.STUDENT)
      .map(student => ({
        ...student,
        isEnrolled: enrolledStudentIds.includes(student.id),
      }))
      .filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.rollNo && student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [allUsers, classMemberships, selectedClass, searchTerm]);
  
  // Class List View
  const renderClassList = () => (
    <Card className="animate-scaleIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">All Classes</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>Create New Class</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(c => (
          <div key={c.id} onClick={() => setSelectedClass(c)}
            className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-all duration-200 hover:shadow-lg hover:scale-105 flex flex-col"
          >
            <div className="flex-grow">
              <h3 className="font-semibold text-lg text-primary-700 dark:text-primary-400">{c.name}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2 h-10">{c.description}</p>
            </div>
            <div className="flex items-center gap-2 pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500 dark:text-zinc-400">
              <UserIcon className="w-4 h-4" />
              <span>{getEnrolledStudentCount(c.id)} Students</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  // Class Detail View
  const renderClassDetail = () => {
    if (!selectedClass) return null;
    const enrolledStudents = classMemberships
      .filter(cm => cm.classId === selectedClass.id && cm.role === Role.STUDENT)
      .map(cm => allUsers.find(u => u.id === cm.userId))
      .filter((u): u is User => u !== undefined);

    return (
      <div className="animate-fadeIn">
        <button onClick={() => setSelectedClass(null)} className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary-600 hover:underline">
          <ChevronLeftIcon className="w-4 h-4" /> Back to All Classes
        </button>
        <Card>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold">{selectedClass.name}</h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">{selectedClass.description}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsAddStudentModalOpen(true)}>Add Students</Button>
              <Button variant="secondary" onClick={() => { setEditingClass(selectedClass); setIsEditModalOpen(true); }} className="flex items-center gap-2">
                <EditIcon className="w-4 h-4"/> Edit
              </Button>
              <Button variant="danger" onClick={() => openDeleteConfirmation(selectedClass)} className="flex items-center gap-2">
                <TrashIcon className="w-4 h-4"/> Delete
              </Button>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mb-4">Enrolled Students ({enrolledStudents.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-left text-zinc-500 dark:text-zinc-400">
                    <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Roll Number</th>
                        <th className="p-2">Email</th>
                        <th className="p-2 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {enrolledStudents.map(student => (
                        <tr key={student.id} className="border-t border-zinc-200 dark:border-white/10">
                            <td className="p-2 flex items-center gap-3">
                                <img src={`https://i.pravatar.cc/40?u=${student.id}`} alt={student.name} className="w-8 h-8 rounded-full" />
                                <span className="font-medium">{student.name}</span>
                            </td>
                            <td className="p-2">{student.rollNo}</td>
                            <td className="p-2">{student.email}</td>
                            <td className="p-2 text-center">
                                <button onClick={() => openRemoveStudentConfirmation(student)} className="p-1.5 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50" aria-label="Remove Student">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
           {enrolledStudents.length === 0 && <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">No students enrolled yet.</p>}
        </Card>
      </div>
    );
  };
  
  return (
    <div>
      {selectedClass ? renderClassDetail() : renderClassList()}

      {/* Create Class Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Class"
        footer={<><Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button><Button onClick={handleCreateClassSubmit}>Create Class</Button></>}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="className" className="block text-sm font-medium">Class Name</label>
            <input type="text" id="className" value={currentClassName} onChange={e => setCurrentClassName(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
            />
          </div>
          <div>
            <label htmlFor="classDesc" className="block text-sm font-medium">Description</label>
            <textarea id="classDesc" rows={3} value={currentClassDesc} onChange={e => setCurrentClassDesc(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
            />
          </div>
        </div>
      </Modal>

      {/* Edit Class Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Class"
        footer={<><Button variant="secondary" onClick={() => { setIsEditModalOpen(false); setEditingClass(null); }}>Cancel</Button><Button onClick={handleEditClassSubmit}>Save Changes</Button></>}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="editClassName" className="block text-sm font-medium">Class Name</label>
            <input type="text" id="editClassName" value={currentClassName} onChange={e => setCurrentClassName(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
            />
          </div>
          <div>
            <label htmlFor="editClassDesc" className="block text-sm font-medium">Description</label>
            <textarea id="editClassDesc" rows={3} value={currentClassDesc} onChange={e => setCurrentClassDesc(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
            />
          </div>
        </div>
      </Modal>

      {/* Add Student Modal */}
      <Modal isOpen={isAddStudentModalOpen} onClose={() => setIsAddStudentModalOpen(false)} title={`Add Students to ${selectedClass?.name}`}
        footer={<><Button variant="secondary" onClick={() => setIsAddStudentModalOpen(false)}>Cancel</Button><Button onClick={handleAddStudentsSubmit} disabled={selectedStudentIds.length === 0}>Add Selected Students</Button></>}
      >
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        </div>
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {availableStudents.map(student => (
            <li key={student.id}>
              <label className={`flex items-center gap-3 p-2 rounded-md transition-colors ${student.isEnrolled ? 'opacity-50' : 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}>
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(student.id) || student.isEnrolled}
                  disabled={student.isEnrolled}
                  onChange={() => handleStudentSelection(student.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <img src={`https://i.pravatar.cc/40?u=${student.id}`} alt={student.name} className="w-8 h-8 rounded-full" />
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{student.rollNo}</p>
                </div>
              </label>
            </li>
          ))}
        </ul>
      </Modal>
      
      {/* Remove Student Confirmation */}
      <ConfirmationDialog
        isOpen={!!studentToRemove}
        onClose={closeRemoveStudentConfirmation}
        onConfirm={handleRemoveStudentConfirm}
        title="Remove Student"
        confirmText="Remove"
        confirmVariant="danger"
        confirmDisabled={removeStudentConfirmationText !== 'REMOVE'}
      >
        <p>
          Are you sure you want to remove <strong>{studentToRemove?.name}</strong> from <strong>{selectedClass?.name}</strong>? This action cannot be undone.
        </p>
        <div className="mt-4">
          <label htmlFor="remove-confirm" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            To confirm, type <strong className="text-red-500">REMOVE</strong> below:
          </label>
          <input
            type="text"
            id="remove-confirm"
            value={removeStudentConfirmationText}
            onChange={(e) => setRemoveStudentConfirmationText(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm"
            autoComplete="off"
            autoFocus
          />
        </div>
      </ConfirmationDialog>

      {/* Delete Class Confirmation */}
      <ConfirmationDialog
        isOpen={!!classToDelete}
        onClose={closeDeleteConfirmation}
        onConfirm={handleDeleteClassConfirm}
        title="Delete Class"
        confirmText="Delete"
        confirmVariant="danger"
        confirmDisabled={deleteConfirmationText !== classToDelete?.name}
      >
        <p>
          Are you sure you want to delete <strong>{classToDelete?.name}</strong>? This will unenroll all students and permanently remove the class. This action cannot be undone.
        </p>
        <div className="mt-4">
          <label htmlFor="delete-confirm" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            To confirm, type <strong className="text-red-500">{classToDelete?.name}</strong> below:
          </label>
          <input
            type="text"
            id="delete-confirm"
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm"
            autoComplete="off"
            autoFocus
          />
        </div>
      </ConfirmationDialog>
    </div>
  );
};

export default ManageClassesView;