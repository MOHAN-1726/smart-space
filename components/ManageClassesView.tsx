import React, { useState, useMemo, useEffect } from 'react';
import { User, Role, Class, ClassMembership, Section } from '../types';
import { Card, Button, Modal, ConfirmationDialog, ProfilePicture } from './UI';
import { SearchIcon, ChevronLeftIcon, TrashIcon, UserIcon, EditIcon } from './Icons';

interface ManageClassesViewProps {
  user: User;
  classes: Class[];
  sections: Section[];
  classMemberships: ClassMembership[];
  allUsers: User[];
  onCreateClass: (name: string, description: string) => void;
  onUpdateClass: (classId: string, name: string, description: string) => void;
  onDeleteClass: (classId: string) => void;
  onAddStudents: (classId: string, studentIds: string[], sectionId: string | null) => void;
  onRemoveStudent: (membershipId: string) => void;
  onCreateSection: (classId: string, name: string) => void;
  onUpdateSection: (sectionId: string, name: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAssignStudentToSection: (membershipId: string, sectionId: string | null) => void;
}

const inputClasses = "block w-full p-2 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900";
const searchInputClasses = "pl-10 pr-4 py-2 w-full border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900";

const ManageClassesView: React.FC<ManageClassesViewProps> = (props) => {
  const {
    classes,
    sections,
    classMemberships,
    allUsers,
    onCreateClass,
    onUpdateClass,
    onDeleteClass,
    onAddStudents,
    onRemoveStudent,
    onCreateSection,
    onUpdateSection,
    onDeleteSection,
    onAssignStudentToSection,
  } = props;
  
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Modals visibility state
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  
  // Confirmation dialogs state
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  const [membershipToRemove, setMembershipToRemove] = useState<ClassMembership | null>(null);
  
  // Data for modals
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  // Form fields state
  const [className, setClassName] = useState('');
  const [classDesc, setClassDesc] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  
  useEffect(() => {
    if (editingClass) {
        setClassName(editingClass.name);
        setClassDesc(editingClass.description);
    } else {
        setClassName('');
        setClassDesc('');
    }
  }, [editingClass]);

  useEffect(() => {
    if (editingSection) {
        setSectionName(editingSection.name);
    } else {
        setSectionName('');
    }
  }, [editingSection]);

  const resetFormState = () => {
    setClassName('');
    setClassDesc('');
    setSectionName('');
    setSearchTerm('');
    setSelectedStudentIds([]);
    setTargetSectionId(null);
    setDeleteConfirmationText('');
  };
  
  // Handlers for Class operations
  const handleClassModalOpen = (classToEdit: Class | null = null) => {
    setEditingClass(classToEdit);
    setIsClassModalOpen(true);
  };
  
  const handleClassModalClose = () => {
    setIsClassModalOpen(false);
    setEditingClass(null);
    resetFormState();
  };
  
  const handleClassSubmit = () => {
    if (editingClass) {
        onUpdateClass(editingClass.id, className, classDesc);
        setSelectedClass(prev => prev ? { ...prev, name: className, description: classDesc } : null);
    } else {
        onCreateClass(className, classDesc);
    }
    handleClassModalClose();
  };
  
  const handleDeleteClassConfirm = () => {
    if (classToDelete && deleteConfirmationText === classToDelete.name) {
      onDeleteClass(classToDelete.id);
      setClassToDelete(null);
      setSelectedClass(null);
      resetFormState();
    }
  };
  
  // Handlers for Section operations
  const handleSectionModalOpen = (sectionToEdit: Section | null = null) => {
    setEditingSection(sectionToEdit);
    setIsSectionModalOpen(true);
  };

  const handleSectionModalClose = () => {
    setIsSectionModalOpen(false);
    setEditingSection(null);
    resetFormState();
  };
  
  const handleSectionSubmit = () => {
    if (!selectedClass) return;
    if (editingSection) {
        onUpdateSection(editingSection.id, sectionName);
    } else {
        onCreateSection(selectedClass.id, sectionName);
    }
    handleSectionModalClose();
  };
  
  const handleDeleteSectionConfirm = () => {
    if (sectionToDelete) {
        onDeleteSection(sectionToDelete.id);
        setSectionToDelete(null);
    }
  };

  // Handlers for Student operations
  const handleAddStudentModalOpen = (sectionId: string | null = null) => {
    setTargetSectionId(sectionId);
    setIsAddStudentModalOpen(true);
  };
  
  const handleAddStudentModalClose = () => {
    setIsAddStudentModalOpen(false);
    resetFormState();
  };
  
  const handleAddStudentsSubmit = () => {
    if (selectedClass && selectedStudentIds.length > 0) {
      onAddStudents(selectedClass.id, selectedStudentIds, targetSectionId);
      handleAddStudentModalClose();
    }
  };

  const handleRemoveStudentConfirm = () => {
    if (membershipToRemove) {
        onRemoveStudent(membershipToRemove.id);
        setMembershipToRemove(null);
    }
  };
  
  const availableStudents = useMemo(() => {
    const enrolledStudentIds = selectedClass
      ? classMemberships.filter(cm => cm.classId === selectedClass.id).map(cm => cm.userId)
      : [];

    return allUsers
      .filter(u => u.role === Role.STUDENT && !enrolledStudentIds.includes(u.id))
      .filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.rollNo && student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [allUsers, classMemberships, selectedClass, searchTerm]);

  const classSections = useMemo(() => sections.filter(s => s.classId === selectedClass?.id), [sections, selectedClass]);
  
  const renderClassList = () => (
    <Card className="animate-scaleIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">All Classes</h2>
        <Button onClick={() => handleClassModalOpen()}>Create New Class</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(c => (
          <div key={c.id} onClick={() => setSelectedClass(c)}
            className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all duration-200 hover:shadow-lg hover:scale-105 flex flex-col"
          >
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg text-blue-600 dark:text-blue-400 pr-2 flex-1">{c.name}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClassModalOpen(c);
                  }}
                  className="p-1 text-slate-400 hover:text-blue-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                  aria-label={`Edit ${c.name}`}
                >
                  <EditIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 h-10">{c.description}</p>
            </div>
            <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
              <UserIcon className="w-4 h-4" />
              <span>{classMemberships.filter(cm => cm.classId === c.id && cm.role === Role.STUDENT).length} Students</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderClassDetail = () => {
    if (!selectedClass) return null;
    
    const membershipsInClass = classMemberships.filter(cm => cm.classId === selectedClass.id && cm.role === Role.STUDENT);
    
    const unassignedMemberships = membershipsInClass.filter(cm => !cm.sectionId);

    return (
      <div className="animate-fadeIn">
        <button onClick={() => setSelectedClass(null)} className="mb-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
          <ChevronLeftIcon className="w-4 h-4" /> Back to All Classes
        </button>
        <Card>
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold">{selectedClass.name}</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">{selectedClass.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => handleClassModalOpen(selectedClass)}>Edit Class</Button>
              <Button variant="danger" onClick={() => setClassToDelete(selectedClass)}>Delete Class</Button>
              <Button onClick={() => handleSectionModalOpen()}>Create Section</Button>
            </div>
          </div>
        </Card>
        
        <div className="mt-6 space-y-6">
          {classSections.map(section => {
              const sectionMemberships = membershipsInClass.filter(cm => cm.sectionId === section.id);
              return (
                <Card key={section.id} title={section.name}>
                    <div className="flex justify-end gap-2 -mt-12 mb-4">
                       <Button variant="secondary" size="sm" onClick={() => handleAddStudentModalOpen(section.id)}>Add Students</Button>
                       <Button variant="secondary" size="sm" onClick={() => handleSectionModalOpen(section)}><EditIcon className="w-4 h-4"/></Button>
                       <Button variant="danger" size="sm" onClick={() => setSectionToDelete(section)}><TrashIcon className="w-4 h-4"/></Button>
                    </div>
                    <StudentListTable memberships={sectionMemberships} onRemove={setMembershipToRemove} sections={classSections} onAssignStudentToSection={onAssignStudentToSection} />
                </Card>
              );
          })}
          
           <Card title="Unassigned Students">
                <div className="flex justify-end gap-2 -mt-12 mb-4">
                    <Button variant="secondary" size="sm" onClick={() => handleAddStudentModalOpen(null)}>Add Students</Button>
                </div>
                <StudentListTable memberships={unassignedMemberships} onRemove={setMembershipToRemove} sections={classSections} onAssignStudentToSection={onAssignStudentToSection} />
            </Card>
        </div>
      </div>
    );
  };
  
  const StudentListTable: React.FC<{
    memberships: ClassMembership[];
    onRemove: (membership: ClassMembership) => void;
    sections: Section[];
    onAssignStudentToSection: (membershipId: string, sectionId: string | null) => void;
  }> = ({ memberships, onRemove, sections, onAssignStudentToSection }) => {
    if (memberships.length === 0) {
      return <p className="text-center text-slate-500 dark:text-slate-400 py-8">No students in this section.</p>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead className="text-left text-slate-500 dark:text-slate-400">
                <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Roll Number</th>
                    <th className="p-2 w-48">Section</th>
                    <th className="p-2 text-center">Actions</th>
                </tr>
            </thead>
            <tbody>
                {memberships.map(cm => {
                    const student = allUsers.find(u => u.id === cm.userId);
                    if (!student) return null;
                    return (
                        <tr key={student.id} className="border-t border-slate-200 dark:border-slate-700">
                            <td className="p-2 flex items-center gap-3">
                                <ProfilePicture user={student} size="sm" />
                                <span className="font-medium">{student.name}</span>
                            </td>
                            <td className="p-2">{student.rollNo}</td>
                            <td className="p-2">
                                <select
                                value={cm.sectionId || ''}
                                onChange={(e) => onAssignStudentToSection(cm.id, e.target.value || null)}
                                className="w-full p-1.5 text-sm border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900"
                                >
                                <option value="">-- Unassigned --</option>
                                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </td>
                            <td className="p-2 text-center">
                                <button onClick={() => onRemove(cm)} className="p-1.5 text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" aria-label="Remove Student">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      {selectedClass ? renderClassDetail() : renderClassList()}

      <Modal isOpen={isClassModalOpen} onClose={handleClassModalClose} title={editingClass ? "Edit Class" : "Create New Class"}
        footer={<><Button variant="secondary" onClick={handleClassModalClose}>Cancel</Button><Button onClick={handleClassSubmit}>{editingClass ? "Save Changes" : "Create Class"}</Button></>}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Class Name</label>
            <input type="text" value={className} onChange={e => setClassName(e.target.value)} className={`mt-1 ${inputClasses}`} />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea rows={3} value={classDesc} onChange={e => setClassDesc(e.target.value)} className={`mt-1 ${inputClasses}`} />
          </div>
        </div>
      </Modal>

      <Modal isOpen={isSectionModalOpen} onClose={handleSectionModalClose} title={editingSection ? "Edit Section" : "Create New Section"}
        footer={<><Button variant="secondary" onClick={handleSectionModalClose}>Cancel</Button><Button onClick={handleSectionSubmit}>{editingSection ? "Save Changes" : "Create Section"}</Button></>}
      >
        <div>
          <label className="block text-sm font-medium">Section Name</label>
          <input type="text" value={sectionName} onChange={e => setSectionName(e.target.value)} className={`mt-1 ${inputClasses}`} />
        </div>
      </Modal>

      <Modal isOpen={isAddStudentModalOpen} onClose={handleAddStudentModalClose} title={`Add Students to ${selectedClass?.name}`}
        footer={<><Button variant="secondary" onClick={handleAddStudentModalClose}>Cancel</Button><Button onClick={handleAddStudentsSubmit} disabled={selectedStudentIds.length === 0}>Add Selected ({selectedStudentIds.length})</Button></>}
      >
        <div className="relative mb-4">
          <input type="text" placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={searchInputClasses} />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {availableStudents.map(student => (
            <li key={student.id}>
              <label className="flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => setSelectedStudentIds(p => p.includes(student.id) ? p.filter(id => id !== student.id) : [...p, student.id])} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <ProfilePicture user={student} size="sm" />
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{student.rollNo}</p>
                </div>
              </label>
            </li>
          ))}
        </ul>
      </Modal>

      <ConfirmationDialog isOpen={!!membershipToRemove} onClose={() => setMembershipToRemove(null)} onConfirm={handleRemoveStudentConfirm} title="Remove Student" confirmVariant="danger">
        Are you sure you want to remove this student from the class?
      </ConfirmationDialog>
      
      <ConfirmationDialog isOpen={!!sectionToDelete} onClose={() => setSectionToDelete(null)} onConfirm={handleDeleteSectionConfirm} title="Delete Section" confirmVariant="danger">
        Are you sure you want to delete <strong>{sectionToDelete?.name}</strong>? All students in this section will become unassigned. This action cannot be undone.
      </ConfirmationDialog>

      <ConfirmationDialog isOpen={!!classToDelete} onClose={() => setClassToDelete(null)} onConfirm={handleDeleteClassConfirm} title="Delete Class" confirmVariant="danger" confirmDisabled={deleteConfirmationText !== classToDelete?.name}>
        <p>This will unenroll all students and permanently remove the class and all its sections. This action cannot be undone.</p>
        <div className="mt-4">
          <label className="block text-sm font-medium">To confirm, type <strong className="text-red-500">{classToDelete?.name}</strong> below:</label>
          <input type="text" value={deleteConfirmationText} onChange={(e) => setDeleteConfirmationText(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-500 dark:focus:ring-offset-slate-900" />
        </div>
      </ConfirmationDialog>
    </div>
  );
};

export default ManageClassesView;