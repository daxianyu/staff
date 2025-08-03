'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  getStaffEditInfo, 
  updateStaffInfo,
  resetStaffPassword,
  type StaffEditInfo,
  type StaffEditFormData
} from '@/services/auth';
import { 
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/Button';

export default function StaffEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffInfo, setStaffInfo] = useState<StaffEditInfo | null>(null);
  const [formData, setFormData] = useState<StaffEditFormData>({
    record_id: 0,
    campus_id: 0,
    first_name: '',
    last_name: '',
    phone_0: '',
    phone_1: '',
    email: '',
    company_email: '',
    mentor_leader_id: 0,
    group_ids: '',
    zoom_id: ''
  });
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    phone_0?: string;
    phone_1?: string;
    email?: string;
    company_email?: string;
  }>({});

  // 重置密码相关状态
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

  const canView = hasPermission(PERMISSIONS.EDIT_STAFF);
  const canEdit = hasPermission(PERMISSIONS.EDIT_STAFF);
  const staffId = searchParams.get('id');

  useEffect(() => {
    if (staffId && canView) {
      loadStaffInfo();
    }
  }, [staffId, canView]);

  const loadStaffInfo = async () => {
    if (!staffId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const staffResponse = await getStaffEditInfo(parseInt(staffId));
      
      if (staffResponse.code === 200 && staffResponse.data) {
        const data = staffResponse.data;
        setStaffInfo(data);
        
        setFormData({
          record_id: data.staff_info.id,
          campus_id: data.staff_info.campus_id,
          first_name: data.staff_info.first_name,
          last_name: data.staff_info.last_name,
          phone_0: data.staff_info.phone_0,
          phone_1: data.staff_info.phone_1,
          email: data.staff_info.email,
          company_email: data.staff_info.company_email,
          mentor_leader_id: data.staff_info.mentor_leader_id,
          group_ids: '',
          zoom_id: data.staff_info.zoom_id || ''
        });

        // 设置当前员工已有的权限
        const groups = new Set<string>();
        Object.values(data.staff_group).forEach((groupArray: any[]) => {
          groupArray.forEach((group: { group_id: number }) => {
            groups.add(group.group_id.toString());
          });
        });
        
        setSelectedGroups(groups);
      } else {
        setError(staffResponse.message || '获取员工信息失败');
      }
    } catch (error) {
      console.error('加载员工信息失败:', error);
      setError('加载员工信息失败');
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return undefined;
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return '请输入11位有效的手机号码';
    }
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return '请输入有效的邮箱地址';
    }
    return undefined;
  };

  const handleInputChange = (field: keyof StaffEditFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 实时验证手机号码
    if (field === 'phone_0') {
      const error = validatePhone(value as string);
      setFieldErrors(prev => ({
        ...prev,
        phone_0: error
      }));
    } else if (field === 'phone_1') {
      const error = validatePhone(value as string);
      setFieldErrors(prev => ({
        ...prev,
        phone_1: error
      }));
    } else if (field === 'email') {
      const error = validateEmail(value as string);
      setFieldErrors(prev => ({
        ...prev,
        email: error
      }));
    } else if (field === 'company_email') {
      const error = validateEmail(value as string);
      setFieldErrors(prev => ({
        ...prev,
        company_email: error
      }));
    }
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEdit) {
      setError('您没有编辑权限');
      return;
    }

    // 检查是否有字段验证错误
    if (fieldErrors.phone_0 || fieldErrors.phone_1 || fieldErrors.email || fieldErrors.company_email) {
      setError('请修正输入错误后重试');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updatedFormData = {
        ...formData,
        group_ids: Array.from(selectedGroups).join(',')
      };

      const response = await updateStaffInfo(updatedFormData);
      
      if (response.code === 200) {
        setSuccessMessage('员工信息更新成功');
        await loadStaffInfo();
      } else {
        setError(response.message || '更新失败');
      }
    } catch (error) {
      console.error('更新员工信息失败:', error);
      setError('更新员工信息失败');
    } finally {
      setSaving(false);
    }
  };

  // 重置密码相关函数
  const handleResetPassword = async () => {
    if (!staffId) return;
    
    try {
      setResetPasswordLoading(true);
      setResetPasswordError(null);
      setNewPassword('');

      const response = await resetStaffPassword(parseInt(staffId));
      
      if (response.status === 200) {
        setNewPassword(response.data.new_pass);
      } else {
        setResetPasswordError(response.message || '重置密码失败');
      }
    } catch (error) {
      console.error('重置密码失败:', error);
      setResetPasswordError('重置密码失败');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 可以添加一个临时的成功提示
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const closeResetPasswordModal = () => {
    setShowResetPasswordModal(false);
    setNewPassword('');
    setResetPasswordError(null);
  };

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">访问被拒绝</h1>
            <p className="text-sm text-gray-600 mb-4">您没有权限查看员工编辑页面</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error && !staffInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">加载失败</h1>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <div className="flex gap-3">
              <Button onClick={loadStaffInfo} className="flex-1 bg-blue-600 hover:bg-blue-700">重试</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!staffInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-xl font-bold text-gray-900 mb-2">员工不存在</h1>
            <p className="text-sm text-gray-600 mb-4">未找到指定的员工信息</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">编辑员工信息</h1>
              <p className="text-sm text-gray-600 mt-1">
                {staffInfo.staff_info.last_name}{staffInfo.staff_info.first_name} 
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 消息提示 */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                  placeholder="Enter last name"
                />
              </div>
                                                           <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campus <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <select
                       required
                       value={formData.campus_id}
                       onChange={(e) => handleInputChange('campus_id', parseInt(e.target.value))}
                       disabled={!canEdit}
                       className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm appearance-none"
                     >
                       <option value={0}>选择校区</option>
                       {staffInfo && staffInfo.campus_info.map(([campusId, campusName]) => (
                         <option key={campusId} value={campusId}>
                           {campusName}
                         </option>
                       ))}
                     </select>
                  </div>
                </div>
                             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Mentor
                 </label>
                 <div className="relative">
                   <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                   <select
                     value={formData.mentor_leader_id}
                     onChange={(e) => handleInputChange('mentor_leader_id', parseInt(e.target.value) || 0)}
                     disabled={!canEdit}
                     className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm appearance-none"
                   >
                     <option value={0}>选择导师</option>
                     {staffInfo && staffInfo.mentor_info.map(([mentorId, mentorName]) => (
                       <option key={mentorId} value={mentorId}>
                         {mentorName}
                       </option>
                     ))}
                   </select>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* 联系信息 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">联系信息</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                           <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone number 1 <span className="text-red-500">*</span>
                </label>
                 <div className="relative">
                   <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                      <input
                      type="tel"
                      required
                      value={formData.phone_0}
                      onChange={(e) => handleInputChange('phone_0', e.target.value)}
                      disabled={!canEdit}
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm ${
                        fieldErrors.phone_0 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-green-500'
                      }`}
                      placeholder="请输入11位手机号码"
                    />
                 </div>
                 {fieldErrors.phone_0 && (
                   <p className="mt-1 text-sm text-red-600">{fieldErrors.phone_0}</p>
                 )}
               </div>
                                                           <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone number 2
                </label>
                 <div className="relative">
                   <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                      <input
                      type="tel"
                      value={formData.phone_1}
                      onChange={(e) => handleInputChange('phone_1', e.target.value)}
                      disabled={!canEdit}
                      className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm ${
                        fieldErrors.phone_1 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-green-500'
                      }`}
                      placeholder="请输入11位手机号码（可选）"
                    />
                 </div>
                 {fieldErrors.phone_1 && (
                   <p className="mt-1 text-sm text-red-600">{fieldErrors.phone_1}</p>
                 )}
               </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!canEdit}
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm ${
                      fieldErrors.email 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                    placeholder="Enter email"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.company_email}
                    onChange={(e) => handleInputChange('company_email', e.target.value)}
                    disabled={!canEdit}
                    className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm ${
                      fieldErrors.company_email 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                    placeholder="Enter school email"
                  />
                </div>
                {fieldErrors.company_email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.company_email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zoom ID
                </label>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="text"
                    value={formData.zoom_id}
                    onChange={(e) => handleInputChange('zoom_id', e.target.value)}
                    disabled={!canEdit}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                    placeholder="Enter Zoom ID"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 角色和权限 - 使用checkbox */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">角色和权限</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              {Object.entries(staffInfo.groups).map(([groupId, groupName]) => {
                const isChecked = selectedGroups.has(groupId);
                
                return (
                  <label key={groupId} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleGroupToggle(groupId)}
                      disabled={!canEdit}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">{groupName}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

                 {/* 操作按钮 */}
         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             {canEdit && (
               <Button
                 type="button"
                 onClick={() => setShowResetPasswordModal(true)}
                 className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
               >
                 重置密码
               </Button>
             )}
             <Button
               type="button"
               onClick={() => router.push('/staff')}
               variant="outline"
               className="px-4 py-2 text-sm font-medium"
             >
               取消
             </Button>
             {canEdit && (
               <Button
                 type="submit"
                 disabled={saving}
                 className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
               >
                 {saving ? (
                   <div className="flex items-center space-x-2">
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     <span>保存中...</span>
                   </div>
                 ) : (
                   '保存更改'
                 )}
               </Button>
             )}
           </div>
         </div>
             </form>

       {/* 重置密码模态框 */}
       {showResetPasswordModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
             <div className="px-6 py-4 border-b border-gray-200">
               <h3 className="text-lg font-semibold text-gray-900">重置密码</h3>
             </div>
             
             <div className="px-6 py-4">
               {!newPassword ? (
                 <>
                   <p className="text-sm text-gray-600 mb-4">
                     确定要重置 {staffInfo?.staff_info.last_name}{staffInfo?.staff_info.first_name} 的密码吗？
                   </p>
                   {resetPasswordError && (
                     <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                       <p className="text-sm text-red-600">{resetPasswordError}</p>
                     </div>
                   )}
                   <div className="flex gap-3">
                     <Button
                       type="button"
                       onClick={closeResetPasswordModal}
                       variant="outline"
                       className="flex-1"
                     >
                       取消
                     </Button>
                     <Button
                       type="button"
                       onClick={handleResetPassword}
                       disabled={resetPasswordLoading}
                       className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                     >
                       {resetPasswordLoading ? (
                         <div className="flex items-center space-x-2">
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                           <span>重置中...</span>
                         </div>
                       ) : (
                         '确认重置'
                       )}
                     </Button>
                   </div>
                 </>
               ) : (
                 <>
                   <p className="text-sm text-gray-600 mb-4">
                     密码重置成功！新密码如下：
                   </p>
                                       <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{newPassword}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(newPassword)}
                          className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                          title="复制密码"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                   <div className="flex justify-center">
                     <Button
                       type="button"
                       onClick={closeResetPasswordModal}
                       className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700"
                     >
                       确认
                     </Button>
                   </div>
                 </>
               )}
             </div>
           </div>
         </div>
       )}
     </div>
   );
 } 