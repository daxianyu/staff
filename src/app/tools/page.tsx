'use client';

import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { 
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface Tool {
  name: string;
  description: string;
  path?: string;
}

const tools: Tool[] = [
  {
    name: '进入删除lesson页面',
    description: '节假日对lesson的删除，以及临时要删除lesson可用',
  },
  {
    name: '进入调整room页面',
    description: '按照指定日期对学生人数超过房间人数的lesson进行调整',
  },
  {
    name: '进入room重复后调整页面',
    description: '这个是针对两节课在同一个教室上课的问题进行的调整',
  },
  {
    name: '进入调整lesson day页面',
    description: '遇到节假日或者其他的时候，要将某一天的课程移到另外一天',
  },
  {
    name: '进入调整修改学生university change页面',
    description: '修改学生的大学确认状态，因为有些误操作或者需要修改的还要进行再次操作，可以直接改状态',
  },
  {
    name: '设置重要日期到课表',
    description: '在教师或者学生的课表显示设置的重要日期和提示内容',
  },
  {
    name: '清除缓存',
    description: '有些页面数据使用的是缓存数据, 有个别时候需要及时更新，需要清除一下',
  },
  {
    name: '双倍课时费class',
    description: '仅仅展示双倍课时费的class清单',
  },
  {
    name: 'remark费用配置',
    description: '在remarking收费的时候 由于价格每个考试局和类型不一样 价格也不一样 所以需要对费用进行配置',
  },
  {
    name: '权限复制',
    description: '新来一个老师需要的权限跟另外一个一样，需要直接复制对应老师的权限',
  },
  {
    name: '配置report exam report开放时间',
    description: '开放exam report的时间 可以让学生查看自己的所有的成绩报告',
  },
  {
    name: '配置开学时间',
    description: '配置开学时间用于双周反馈的开始时间 这样保证双周的时间的正确性',
  },
  {
    name: 'course book upload',
    description: '上传coursebook',
  },
];

export default function ToolsOverviewPage() {
  const { user, hasPermission } = useAuth();
  const canView = hasPermission(PERMISSIONS.VIEW_TOOLS_OVERVIEW);

  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">权限不足</h3>
          <p className="mt-1 text-sm text-gray-500">您没有权限查看工具概览</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center">
            <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Tools Overview</h1>
          </div>
          <p className="mt-2 text-sm text-gray-500">工具概览 - 系统工具集合</p>
        </div>

        {/* 工具列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">工具列表</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {tools.map((tool, index) => (
              <div
                key={index}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h3 className="text-base font-medium text-gray-900">
                        {tool.name}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {tool.description}
                    </p>
                  </div>
                  {tool.path && (
                    <div className="ml-4 flex-shrink-0">
                      <button
                        onClick={() => {
                          // 这里可以根据实际路径进行导航
                          window.location.href = tool.path || '#';
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        进入
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

