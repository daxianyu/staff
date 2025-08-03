import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserInfo } from '@/hooks/usePermission';

export default function PermissionDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, rights } = useAuth();
  const userInfo = useUserInfo();

  if (!user) return null;

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-40 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700"
      >
        权限调试
      </button>

      {/* 调试面板 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">权限调试信息</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* 用户基本信息 */}
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-2">用户信息</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>姓名:</strong> {user.name}</p>
                  <p><strong>类型:</strong> {user.type} {user.type === 0 ? '(管理员)' : user.type === 2 ? '(教师)' : '(其他)'}</p>
                  <p><strong>校区ID:</strong> {user.campus_id}</p>
                </div>
              </div>

              {/* 权限列表 */}
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-2">
                  用户权限 ({rights.length} 个)
                </h3>
                <div className="bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                  {rights.length > 0 ? (
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      {rights.map((right, index) => (
                        <div 
                          key={index} 
                          className={`p-1 rounded ${
                            right === 'edit_staff' ? 'bg-yellow-200 font-bold' : 
                            right === 'view_schedule' ? 'bg-green-200 font-bold' : 
                            'bg-white'
                          }`}
                        >
                          {right}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">暂无权限</p>
                  )}
                </div>
              </div>

              {/* 原始权限数组 */}
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-2">原始权限数组</h3>
                <div className="space-y-2">
                  <div>
                    <h4 className="text-sm font-medium">rights ({(Array.isArray(user.rights) ? user.rights : []).length} 个):</h4>
                    <div className="bg-gray-50 p-2 rounded text-xs max-h-20 overflow-y-auto">
                      {Array.isArray(user.rights) ? user.rights.join(', ') : '非数组格式'}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">operation_right ({(Array.isArray(user.operation_right) ? user.operation_right : []).length} 个):</h4>
                    <div className="bg-gray-50 p-2 rounded text-xs max-h-20 overflow-y-auto">
                      {Array.isArray(user.operation_right) ? user.operation_right.join(', ') : '非数组格式'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 权限检查测试 */}
              <div className="mb-6">
                <h3 className="text-md font-semibold mb-2">权限检查测试</h3>
                <div className="space-y-2 text-sm">
                  <TestPermission permission="edit_staff" label="编辑员工权限" />
                  <TestPermission permission="view_schedule" label="查看课程权限" />
                  <TestPermission permission="view_staff" label="查看员工权限" />
                  <TestPermission permission="core_admin" label="核心管理员权限" />
                </div>
              </div>

              {/* Hook 信息 */}
              <div>
                <h3 className="text-md font-semibold mb-2">Hook 信息</h3>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                  <p><strong>是否管理员:</strong> {userInfo.isAdmin ? '是' : '否'}</p>
                  <p><strong>是否教师:</strong> {userInfo.isTeacher ? '是' : '否'}</p>
                  <p><strong>是否核心管理员:</strong> {userInfo.isCoreAdmin ? '是' : '否'}</p>
                  <p><strong>可查看员工:</strong> {userInfo.canViewStaff ? '是' : '否'}</p>
                  <p><strong>可编辑员工:</strong> {userInfo.canEditStaff ? '是' : '否'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TestPermission({ permission, label }: { permission: string; label: string }) {
  const { hasPermission } = useAuth();
  const hasIt = hasPermission(permission);
  
  return (
    <div className={`p-2 rounded ${hasIt ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      <span className={hasIt ? '✅' : '❌'}></span> {label} ({permission}): {hasIt ? '有权限' : '无权限'}
    </div>
  );
} 