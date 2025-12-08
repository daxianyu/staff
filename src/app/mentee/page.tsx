'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ChatBubbleBottomCenterTextIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  CheckIcon,
  EllipsisVerticalIcon,
  ArrowDownTrayIcon,
  StopIcon,
  XCircleIcon,
  AcademicCapIcon as GraduateIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import {
  getMenteeStudents,
  updateStudent,
  updateComplaint,
  viewStudentReport,
  getEvaluateSelect,
  type MenteeStudent,
  type EvaluateSelect,
} from '@/services/auth';

interface StudentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: MenteeStudent | null;
  onConfirm: (statusData: any) => void;
  operationType?: string;
}

const StudentStatusModal: React.FC<StudentStatusModalProps> = ({
  isOpen,
  onClose,
  student,
  onConfirm,
  operationType = '',
}) => {
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [university, setUniversity] = useState('');

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen && student) {
      setReason('');
      setComment('');
      setUniversity('');
    }
  }, [isOpen, student, operationType]);

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Set status type based on operation
    let postType = 0;
    if (operationType === 'suspend') {
      postType = 1;
    } else if (operationType === 'dropout') {
      postType = 2;
    } else if (operationType === 'graduate') {
      postType = 3;
    }

    const statusData: any = {
      post_type: postType,
      student_id: student.student_id,
      student_name: student.student_name,
    };

    if (operationType === 'suspend' || operationType === 'dropout') {
      // suspend or drop out
      statusData.reason = reason;
      statusData.comment = comment;
    } else if (operationType === 'graduate') {
      // graduate
      statusData.university = university;
    }

    // Call onConfirm to show confirmation modal
    onConfirm(statusData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {operationType === 'suspend' ? 'Suspend Student' :
              operationType === 'dropout' ? 'Drop Out Student' :
                operationType === 'graduate' ? 'Graduate Student' : 'Update Student Status'} - {student.student_name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {(operationType === 'suspend' || operationType === 'dropout') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </>
          )}

          {operationType === 'graduate' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                University
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Update Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: MenteeStudent | null;
  onConfirm: (complaint: string) => void;
}

interface OperationsMenuProps {
  student: MenteeStudent;
  onOperationSelect: (operation: string, student: MenteeStudent) => void;
  canManageStatus: boolean;
  canAddComplaint: boolean;
  evaluateOptions: EvaluateSelect | null;
}

interface ReportSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: MenteeStudent | null;
  reportType: 'academic' | 'mock';
  evaluateOptions: EvaluateSelect | null;
  onReportSelect: (title: string, grade: string) => void;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmButtonClass?: string;
}

const ReportSelectionModal: React.FC<ReportSelectionModalProps> = ({
  isOpen,
  onClose,
  student,
  reportType,
  evaluateOptions,
  onReportSelect,
}) => {
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');

  // Get available titles for the student
  const availableTitles = React.useMemo(() => {
    if (!evaluateOptions || !student) return [];
    return reportType === 'academic'
      ? evaluateOptions.student_evaluate?.[student.student_id] || []
      : evaluateOptions.mock_evaluate?.[student.student_id] || [];
  }, [evaluateOptions, student, reportType]);

  const gradeEntries = React.useMemo(() => {
    return evaluateOptions ? Object.entries(evaluateOptions.grade_list || {}) : [];
  }, [evaluateOptions]);

  React.useEffect(() => {
    if (availableTitles.length > 0) {
      setSelectedTitle(availableTitles[0]);
    }
    // Only set grade for academic reports
    if (reportType === 'academic' && gradeEntries.length > 0) {
      setSelectedGrade(gradeEntries[0][0]);
    } else if (reportType === 'mock') {
      setSelectedGrade('');
    }
  }, [availableTitles, gradeEntries, reportType]);

  if (!isOpen || !student || !evaluateOptions) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTitle && (reportType === 'mock' || selectedGrade)) {
      onReportSelect(selectedTitle, reportType === 'mock' ? '' : selectedGrade);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Select {reportType === 'academic' ? 'Academic' : 'Mock Exam'} Report - {student.student_name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Title
            </label>
            <select
              value={selectedTitle}
              onChange={(e) => setSelectedTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {availableTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          {/* Only show grade selection for academic reports */}
          {reportType === 'academic' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {gradeEntries.map(([gradeKey, gradeValue]) => (
                  <option key={gradeKey} value={gradeKey}>
                    {gradeValue}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Generate Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ComplaintModal: React.FC<ComplaintModalProps> = ({
  isOpen,
  onClose,
  student,
  onConfirm,
}) => {
  const [complaint, setComplaint] = useState('');

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (complaint.trim()) {
      onConfirm(complaint.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Add Complaint - {student.student_name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complaint Details
            </label>
            <textarea
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter complaint details..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add Complaint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OperationsMenu: React.FC<OperationsMenuProps> = ({
  student,
  onOperationSelect,
  canManageStatus,
  canAddComplaint,
  evaluateOptions,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Check if student has available reports
  const hasAcademicReport = (evaluateOptions?.student_evaluate && evaluateOptions.student_evaluate[student.student_id] && evaluateOptions.student_evaluate[student.student_id].length > 0) || false;
  const hasMockReport = (evaluateOptions?.mock_evaluate && evaluateOptions.mock_evaluate[student.student_id] && evaluateOptions.mock_evaluate[student.student_id].length > 0) || false;

  const operations = [
    { id: 'suspend', label: 'Suspend', icon: StopIcon, permission: canManageStatus, className: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
    { id: 'dropout', label: 'Drop out', icon: XCircleIcon, permission: canManageStatus, className: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
    { id: 'graduate', label: 'Graduate', icon: GraduateIcon, permission: canManageStatus, className: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
    { id: 'academic-report', label: 'Academic Report', icon: DocumentTextIcon, permission: hasAcademicReport, className: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
    { id: 'mock-report', label: 'Mock Exam Report', icon: ClipboardDocumentListIcon, permission: hasMockReport, className: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
    { id: 'graduation-wishes', label: 'Graduation Wishes', icon: HeartIcon, permission: canAddComplaint, className: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
  ];

  const availableOperations = operations.filter(op => op.permission);

  if (availableOperations.length === 0) return null;

  return (
    <div className="flex flex-col space-y-2">
      {/* Desktop: Show all operations as buttons */}
      <div className="hidden md:flex flex-wrap gap-2">
        {availableOperations.map((operation) => {
          const Icon = operation.icon;
          return (
            <button
              key={operation.id}
              onClick={() => onOperationSelect(operation.id, student)}
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium ${operation.className}`}
            >
              <Icon className="h-4 w-4" />
              <span>{operation.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile: Show dropdown menu */}
      <div className="md:hidden relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors flex items-center justify-center"
          title="Operations"
        >
          <EllipsisVerticalIcon className="h-4 w-4" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
              <div className="py-1">
                {availableOperations.map((operation) => {
                  const Icon = operation.icon;
                  return (
                    <button
                      key={operation.id}
                      onClick={() => {
                        onOperationSelect(operation.id, student);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 transition-colors ${operation.className.replace('bg-', 'text-').replace('-100', '').replace('-200', '')} hover:bg-gray-50`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{operation.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmButtonClass = 'bg-red-600 hover:bg-red-700',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-3 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-4 py-3 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MenteePage() {
  const { hasPermission } = useAuth();
  const [students, setStudents] = useState<MenteeStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<MenteeStudent | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    title: string;
    message: string;
    confirmText: string;
    action: () => void;
    confirmButtonClass?: string;
  } | null>(null);
  const [evaluateOptions, setEvaluateOptions] = useState<EvaluateSelect | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [currentOperation, setCurrentOperation] = useState<string>('');
  const [showReportSelectionModal, setShowReportSelectionModal] = useState(false);
  const [reportSelectionData, setReportSelectionData] = useState<{
    student: MenteeStudent | null;
    reportType: 'academic' | 'mock';
    availableTitles: string[];
    grades: Record<string, string>;
  } | null>(null);

  // 权限检查
  const canView = hasPermission(PERMISSIONS.VIEW_MENTEE);
  const canEdit = hasPermission(PERMISSIONS.EDIT_MENTEE);
  const canManageStatus = hasPermission(PERMISSIONS.MANAGE_STUDENT_STATUS);
  const canAddComplaint = hasPermission(PERMISSIONS.ADD_STUDENT_COMPLAINT);

  // 如果没有查看权限，显示无权限页面
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有访问此页面的权限</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadStudents();
    loadEvaluateOptions();
  }, []);

  const loadEvaluateOptions = async () => {
    try {
      const response = await getEvaluateSelect();
      if (response.code === 200 && response.data) {
        setEvaluateOptions(response.data);
      }
    } catch (error) {
      console.error('Error loading evaluate options:', error);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await getMenteeStudents();
      if (response.code === 200) {
        setStudents(response.data || []);
      } else {
        console.error('Failed to load students:', response.message);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (statusData: any) => {
    // Set confirmation data and show confirmation modal
    const postType = statusData.post_type;
    const confirmationTitle = postType === 1 ? 'Suspend Student' :
      postType === 2 ? 'Drop Out Student' : 'Graduate Student';
    const confirmationMessage = postType === 1 ?
      `Are you sure you want to suspend ${selectedStudent?.student_name}?` :
      postType === 2 ?
        `Are you sure you want to mark ${selectedStudent?.student_name} as dropped out? This action cannot be easily undone.` :
        `Are you sure you want to mark ${selectedStudent?.student_name} as graduated? This will change their status to graduated.`;

    setConfirmationData({
      title: confirmationTitle,
      message: confirmationMessage,
      confirmText: postType === 1 ? 'Suspend' : postType === 2 ? 'Drop Out' : 'Graduate',
      confirmButtonClass: postType === 1 ? 'bg-yellow-600 hover:bg-yellow-700' :
        postType === 2 ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700',
      action: () => performStatusUpdate(statusData),
    });
    setShowConfirmationModal(true);
  };

  const handleAddComplaint = async (complaint: string) => {
    if (!selectedStudent) return;

    try {
      const response = await updateComplaint({
        student_id: selectedStudent.student_id,
        complaint: complaint,
      });
      if (response.code === 200) {
        alert('Complaint added successfully');
        setShowComplaintModal(false);
        setSelectedStudent(null);
      } else {
        alert('Failed to add complaint: ' + response.message);
      }
    } catch (error) {
      console.error('Error adding complaint:', error);
      alert('Failed to add complaint');
    }
  };

  // 过滤和分页
  const filteredStudents = students.filter((student) =>
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredStudents.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // 搜索重置
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleOperationSelect = (operation: string, student: MenteeStudent) => {
    setSelectedStudent(student);
    setCurrentOperation(operation);

    switch (operation) {
      case 'suspend':
      case 'dropout':
      case 'graduate':
        // For status updates, show the status modal first to collect additional information
        setShowStatusModal(true);
        break;

      case 'academic-report':
        handleReportGeneration(student, 'academic');
        break;

      case 'mock-report':
        handleReportGeneration(student, 'mock');
        break;

      case 'graduation-wishes':
        setConfirmationData({
          title: 'Send Graduation Wishes',
          message: `Are you sure you want to send graduation wishes to ${student.student_name}?`,
          confirmText: 'Send Wishes',
          confirmButtonClass: 'bg-pink-600 hover:bg-pink-700',
          action: () => handleGraduationWishes(student),
        });
        setShowConfirmationModal(true);
        break;
    }
  };

  const performStatusUpdate = async (statusData: any) => {
    try {
      const response = await updateStudent(statusData);
      if (response.code === 200) {
        alert('Student status updated successfully');
        loadStudents(); // Reload the list
        // Reset states
        setShowStatusModal(false);
        setShowConfirmationModal(false);
        setSelectedStudent(null);
        setCurrentOperation('');
        setConfirmationData(null);
      } else {
        alert('Failed to update student status: ' + response.message);
      }
    } catch (error) {
      console.error('Error updating student status:', error);
      alert('Failed to update student status');
    } finally {
      setShowConfirmationModal(false);
      setConfirmationData(null);
    }
  };

  const handleReportSelection = (title: string, grade: string) => {
    if (!reportSelectionData?.student) return;

    const gradeDisplay = reportSelectionData.reportType === 'mock' ? 'N/A' : (reportSelectionData.grades[grade] || grade);
    const message = reportSelectionData.reportType === 'mock'
      ? `Generate ${reportSelectionData.reportType} report for ${reportSelectionData.student.student_name}?\n\nTitle: ${title}`
      : `Generate ${reportSelectionData.reportType} report for ${reportSelectionData.student.student_name}?\n\nTitle: ${title}\nGrade: ${gradeDisplay}`;

    setConfirmationData({
      title: `Generate ${reportSelectionData.reportType === 'academic' ? 'Academic' : 'Mock Exam'} Report`,
      message: message,
      confirmText: 'Generate Report',
      confirmButtonClass: reportSelectionData.reportType === 'academic' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700',
      action: () => downloadReport(reportSelectionData.student!.student_id, title, grade),
    });
    setShowConfirmationModal(true);
    setShowReportSelectionModal(false);
    setReportSelectionData(null);
  };

  const handleReportGeneration = (student: MenteeStudent, reportType: 'academic' | 'mock') => {
    if (!evaluateOptions) {
      alert('Evaluation options not loaded. Please try again.');
      return;
    }

    const studentKey = student.student_id;
    let availableTitles: string[] = [];

    if (reportType === 'academic') {
      availableTitles = evaluateOptions.student_evaluate?.[studentKey] || [];
    } else {
      availableTitles = evaluateOptions.mock_evaluate?.[studentKey] || [];
    }

    if (availableTitles.length === 0) {
      alert(`No ${reportType} reports available for this student.`);
      return;
    }

    // Show report selection modal
    setReportSelectionData({
      student,
      reportType,
      availableTitles,
      grades: evaluateOptions.grade_list || {},
    });
    setShowReportSelectionModal(true);
  };

  const downloadReport = async (studentId: number, title: string, grade: string) => {
    try {
      const payload: any = {
        student_id: studentId,
        title: title,
      };

      // Only include grade for academic reports
      if (grade && grade !== '') {
        payload.grade = grade;
      }

      const response = await viewStudentReport(payload);

      if (response.code === 200 && response.data?.file_path) {
        // Splice the full URL for the file path
        const fullUrl = `https://www.huayaopudong.com/${response.data.file_path}`;
        window.open(fullUrl, '_blank', 'noopener');
        alert('Report generated successfully');
      } else {
        alert(response.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setShowConfirmationModal(false);
      setConfirmationData(null);
    }
  };

  const handleGraduationWishes = async (student: MenteeStudent) => {
    try {
      // This would typically call a specific API for graduation wishes
      // For now, we'll use the complaint API as a placeholder
      const wishMessage = `Congratulations on your graduation, ${student.student_name}! Wishing you all the best in your future endeavors.`;

      const response = await updateComplaint({
        student_id: student.student_id,
        complaint: wishMessage,
      });

      if (response.code === 200) {
        alert('Graduation wishes sent successfully');
      } else {
        alert('Failed to send graduation wishes: ' + response.message);
      }
    } catch (error) {
      console.error('Error sending graduation wishes:', error);
      alert('Failed to send graduation wishes');
    } finally {
      setShowConfirmationModal(false);
      setConfirmationData(null);
    }
  };

  const handleConfirmOperation = () => {
    if (confirmationData?.action) {
      confirmationData.action();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mentee Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your mentee students and their information
          </p>
        </div>

        {/* 搜索和操作栏 */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 学生列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Operations
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedStudents.map((student) => (
                      <tr key={student.student_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <Link
                                href={`/mentee/student-detail?id=${student.student_id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {student.student_name} (毕业：{student.graduation_date})
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <OperationsMenu
                            student={student}
                            onOperationSelect={handleOperationSelect}
                            canManageStatus={canManageStatus}
                            canAddComplaint={canAddComplaint}
                            evaluateOptions={evaluateOptions}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页组件 */}
              {totalItems > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      显示第 {startIndex + 1} - {Math.min(endIndex, totalItems)} 条，共 {totalItems} 条记录
                    </div>

                    <div className="flex items-center gap-4">
                      {/* 每页显示数量选择器 */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">每页显示:</span>
                        <select
                          value={pageSize}
                          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>

                      {/* 分页按钮组 */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          上一页
                        </button>

                        {/* 页码按钮 */}
                        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                          let page;
                          if (totalPages <= 7) {
                            page = i + 1;
                          } else {
                            if (currentPage <= 4) {
                              page = i + 1;
                            } else if (currentPage >= totalPages - 3) {
                              page = totalPages - 6 + i;
                            } else {
                              page = currentPage - 3 + i;
                            }
                          }

                          if (page === currentPage) {
                            return (
                              <button
                                key={page}
                                className="w-8 h-8 flex items-center justify-center text-sm font-medium bg-blue-600 border-blue-600 text-white rounded"
                              >
                                {page}
                              </button>
                            );
                          } else {
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className="w-8 h-8 flex items-center justify-center text-sm font-medium bg-white border-gray-300 text-gray-700 hover:bg-gray-50 border rounded"
                              >
                                {page}
                              </button>
                            );
                          }
                        })}

                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          下一页
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 模态框 */}
      <StudentStatusModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedStudent(null);
          setCurrentOperation('');
        }}
        student={selectedStudent}
        onConfirm={handleUpdateStatus}
        operationType={currentOperation}
      />

      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => {
          setShowComplaintModal(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        onConfirm={handleAddComplaint}
      />

      {/* Report Selection Modal */}
      <ReportSelectionModal
        isOpen={showReportSelectionModal}
        onClose={() => {
          setShowReportSelectionModal(false);
          setReportSelectionData(null);
        }}
        student={reportSelectionData?.student || null}
        reportType={reportSelectionData?.reportType || 'academic'}
        evaluateOptions={evaluateOptions}
        onReportSelect={handleReportSelection}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={() => {
          setShowConfirmationModal(false);
          setConfirmationData(null);
        }}
        onConfirm={handleConfirmOperation}
        title={confirmationData?.title || ''}
        message={confirmationData?.message || ''}
        confirmText={confirmationData?.confirmText || ''}
        confirmButtonClass={confirmationData?.confirmButtonClass}
      />
    </div>
  );
}
