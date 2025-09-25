'use client';

import React, { useState, useEffect } from 'react';
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
} from '@heroicons/react/24/outline';
import {
  getMenteeStudents,
  updateStudent,
  updateComplaint,
  type MenteeStudent,
} from '@/services/auth';

interface StudentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: MenteeStudent | null;
  onConfirm: (statusData: any) => void;
}

const StudentStatusModal: React.FC<StudentStatusModalProps> = ({
  isOpen,
  onClose,
  student,
  onConfirm,
}) => {
  const [statusType, setStatusType] = useState<number>(1);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [university, setUniversity] = useState('');

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const statusData: any = {
      post_type: statusType,
      student_id: student.student_id,
      student_name: student.student_name,
    };

    if (statusType === 1 || statusType === 2) {
      // suspend or drop out
      statusData.reason = reason;
      statusData.comment = comment;
    } else if (statusType === 3) {
      // graduate
      statusData.university = university;
    }

    onConfirm(statusData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Update Student Status - {student.student_name}
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
              Status Type
            </label>
            <select
              value={statusType}
              onChange={(e) => setStatusType(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>Suspend</option>
              <option value={2}>Drop Out</option>
              <option value={3}>Graduate</option>
            </select>
          </div>

          {(statusType === 1 || statusType === 2) && (
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

          {statusType === 3 && (
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

export default function MenteePage() {
  const { hasPermission } = useAuth();
  const [students, setStudents] = useState<MenteeStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<MenteeStudent | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
  }, []);

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

  const handleUpdateStatus = async (statusData: any) => {
    try {
      const response = await updateStudent(statusData);
      if (response.code === 200) {
        alert('Student status updated successfully');
        setShowStatusModal(false);
        setSelectedStudent(null);
        loadStudents(); // Reload the list
      } else {
        alert('Failed to update student status: ' + response.message);
      }
    } catch (error) {
      console.error('Error updating student status:', error);
      alert('Failed to update student status');
    }
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
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
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
                              <div className="text-sm font-medium text-gray-900">
                                {student.student_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.student_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                window.location.href = `/mentee/student-detail?student_id=${student.student_id}`;
                              }}
                              className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors flex items-center justify-center"
                              title="View Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            {canManageStatus && (
                              <button
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowStatusModal(true);
                                }}
                                className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center justify-center"
                                title="Update Status"
                              >
                                <ExclamationCircleIcon className="h-4 w-4" />
                              </button>
                            )}
                            {canAddComplaint && (
                              <button
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowComplaintModal(true);
                                }}
                                className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors flex items-center justify-center"
                                title="Add Complaint"
                              >
                                <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
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
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
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
        }}
        student={selectedStudent}
        onConfirm={handleUpdateStatus}
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
    </div>
  );
}
