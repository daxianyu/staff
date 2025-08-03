import React, { useState, useMemo, useCallback } from 'react';
import { getFilteredMenuConfig } from '@/utils/menuFilter';
import { useUserInfo } from '@/hooks/usePermission';
import { useAuth } from '@/contexts/AuthContext';
import { COMMON_PERMISSIONS } from '@/types/permission';

export default function MenuDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'permissions'>('menu');
  const { user } = useUserInfo();
  const { setPermissionOverride, clearPermissionOverrides, getPermissionOverrides, getBaseRights } = useAuth();
  
  // 使用 useMemo 避免在渲染过程中重复计算
  const filteredMenu = useMemo(() => {
    return getFilteredMenuConfig(user);
  }, [user]);
  
  // 权限覆盖状态
  const permissionOverrides = useMemo(() => {
    return getPermissionOverrides?.() || {};
  }, [getPermissionOverrides]);
  
  const baseRights = useMemo(() => {
    return getBaseRights?.() || [];
  }, [getBaseRights]);
  
  // 常用权限列表（用于调试）
  const debugPermissions = useMemo(() => [
    ...Object.values(COMMON_PERMISSIONS),
    'view_demo',
    'edit_demo', 
    'delete_demo',
    'view_dashboard',
  ], []);
  
  // 获取权限的当前状态
  const getPermissionStatus = useCallback((permission: string): 'original' | 'enabled' | 'disabled' => {
    const hasOriginal = baseRights.includes(permission);
    const hasOverride = permissionOverrides.hasOwnProperty(permission);
    
    if (!hasOverride) {
      return hasOriginal ? 'original' : 'disabled';
    }
    
    return permissionOverrides[permission] ? 'enabled' : 'disabled';
  }, [baseRights, permissionOverrides]);
  
  // 切换权限状态
  const togglePermission = useCallback((permission: string) => {
    const status = getPermissionStatus(permission);
    const hasOriginal = baseRights.includes(permission);
    
    if (status === 'original') {
      // 原始有权限，点击后禁用
      setPermissionOverride?.(permission, false);
    } else if (status === 'disabled') {
      // 当前禁用，点击后启用
      setPermissionOverride?.(permission, true);
    } else {
      // 当前通过覆盖启用，点击后恢复原始状态
      if (hasOriginal) {
        // 移除覆盖，恢复原始权限
        const newOverrides = { ...permissionOverrides };
        delete newOverrides[permission];
        clearPermissionOverrides?.();
        Object.entries(newOverrides).forEach(([key, value]) => {
          setPermissionOverride?.(key, value);
        });
      } else {
        // 禁用
        setPermissionOverride?.(permission, false);
      }
    }
  }, [getPermissionStatus, baseRights, setPermissionOverride, clearPermissionOverrides, permissionOverrides]);

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-60 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700"
      >
        调试工具
      </button>

      {/* 调试面板 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">调试工具</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {/* 选项卡 */}
              <div className="flex mt-4 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('menu')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'menu'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  菜单调试
                </button>
                <button
                  onClick={() => setActiveTab('permissions')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'permissions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  权限调试
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* 菜单调试内容 */}
              {activeTab === 'menu' && (
                <>
                  {/* 过滤后的菜单 */}
                  <div className="mb-6">
                    <h3 className="text-md font-semibold mb-2">
                      过滤后的菜单 ({filteredMenu.length} 个)
                    </h3>
                    <div className="space-y-3">
                      {filteredMenu.map((item) => (
                        <div key={item.key} className="border border-gray-200 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="font-medium">{item.label}</span>
                              {item.path && (
                                <span className="ml-2 text-sm text-blue-600">({item.path})</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.icon && <span>图标: {item.icon}</span>}
                            </div>
                          </div>
                          
                          {/* 权限要求 */}
                          {(item.requiredPermissions || item.requiredAllPermissions) && (
                            <div className="mb-2">
                              <div className="text-xs text-gray-600">
                                {item.requiredPermissions && (
                                  <div>
                                    <span className="font-medium">需要权限(任意):</span>{' '}
                                    <span className="text-blue-600">
                                      {item.requiredPermissions.join(', ')}
                                    </span>
                                  </div>
                                )}
                                {item.requiredAllPermissions && (
                                  <div>
                                    <span className="font-medium">需要权限(全部):</span>{' '}
                                    <span className="text-red-600">
                                      {item.requiredAllPermissions.join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 子菜单 */}
                          {item.children && item.children.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-gray-700 mb-1">
                                子菜单 ({item.children.length} 个):
                              </div>
                              <div className="ml-4 space-y-1">
                                {item.children.map((child) => (
                                  <div key={child.key} className="text-xs bg-gray-50 p-2 rounded">
                                    <div className="flex justify-between">
                                      <span className="font-medium">{child.label}</span>
                                      {child.path && (
                                        <span className="text-blue-600">({child.path})</span>
                                      )}
                                    </div>
                                    {child.requiredPermissions && (
                                      <div className="text-gray-600 mt-1">
                                        权限: {child.requiredPermissions.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 菜单统计 */}
                  <div className="bg-gray-50 p-3 rounded">
                    <h3 className="text-md font-semibold mb-2">菜单统计</h3>
                    <div className="text-sm space-y-1">
                      <p>总菜单项: {filteredMenu.length}</p>
                      <p>
                        有子菜单的项目: {filteredMenu.filter(item => item.children && item.children.length > 0).length}
                      </p>
                      <p>
                        总子菜单项: {filteredMenu.reduce((total, item) => total + (item.children?.length || 0), 0)}
                      </p>
                      <p>
                        需要权限的项目: {filteredMenu.filter(item => item.requiredPermissions || item.requiredAllPermissions).length}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* 权限调试内容 */}
              {activeTab === 'permissions' && (
                <>
                  {/* 权限控制 */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-md font-semibold">权限调试</h3>
                      <button
                        onClick={() => clearPermissionOverrides?.()}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        重置权限
                      </button>
                    </div>
                    
                    {/* 权限状态说明 */}
                    <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                          <span>原始权限</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                          <span>调试启用</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-gray-400 rounded mr-2"></div>
                          <span>禁用</span>
                        </div>
                      </div>
                    </div>

                    {/* 权限列表 */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {debugPermissions.map((permission) => {
                        const status = getPermissionStatus(permission);
                        const isOriginal = baseRights.includes(permission);
                        const hasOverride = permissionOverrides.hasOwnProperty(permission);
                        
                        return (
                          <div key={permission} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                            <div className="flex items-center">
                              <button
                                onClick={() => togglePermission(permission)}
                                className={`w-4 h-4 rounded mr-3 transition-colors ${
                                  status === 'original' ? 'bg-green-500' :
                                  status === 'enabled' ? 'bg-blue-500' :
                                  'bg-gray-400'
                                }`}
                              >
                                {status !== 'disabled' && (
                                  <svg className="w-3 h-3 text-white m-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              <span className="text-sm font-mono">{permission}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {isOriginal && !hasOverride && '原始'}
                              {!isOriginal && hasOverride && permissionOverrides[permission] && '调试'}
                              {hasOverride && !permissionOverrides[permission] && '禁用'}
                              {isOriginal && hasOverride && permissionOverrides[permission] && '原始'}
                              {isOriginal && hasOverride && !permissionOverrides[permission] && '禁用'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 当前权限状态 */}
                  <div className="bg-gray-50 p-3 rounded">
                    <h3 className="text-md font-semibold mb-2">当前权限状态</h3>
                    <div className="text-sm space-y-1">
                      <p>原始权限: {baseRights.length} 个</p>
                      <p>覆盖权限: {Object.keys(permissionOverrides).length} 个</p>
                      <p>最终权限: {user?.rights?.length || 0} 个 (含operation_right)</p>
                      {Object.keys(permissionOverrides).length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium">覆盖详情:</p>
                          <div className="ml-2">
                            {Object.entries(permissionOverrides).map(([perm, enabled]) => (
                              <div key={perm} className="text-xs">
                                {perm}: {enabled ? '启用' : '禁用'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 