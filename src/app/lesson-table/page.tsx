'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/auth';
import { getStudentLessonTable, StudentLessonTableItem, getStudentName } from '@/services/auth';
import { ExcelExporter } from '@/components/ExcelExporter';

function formatTime(ts: number) {
  const d = new Date(ts * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return { date: `${y}-${m}-${day}`, time: `${hh}:${mm}` };
}

export default function LessonTablePage() {
  const search = useSearchParams();
  const { hasPermission } = useAuth();
  const recordId = search.get('record_id') || '2';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Array<StudentLessonTableItem & { keyTs: string }>>([]);
  const [studentName, setStudentName] = useState<string>('');

  const canView = hasPermission(PERMISSIONS.VIEW_STUDENTS);

  useEffect(() => {
    if (!canView) return;
    (async () => {
      try {
        setLoading(true);
        const [tableResp, nameResp] = await Promise.all([
          getStudentLessonTable(recordId),
          getStudentName(recordId),
        ]);
        if (tableResp.status === 0 && tableResp.data) {
          const list = Object.entries(tableResp.data)
            .map(([ts, v]) => ({ ...v, keyTs: ts }))
            .sort((a, b) => a.start_time - b.start_time);
          setRows(list);
        } else {
          setError(tableResp.message || '获取失败');
        }
        if (nameResp.status === 0 && nameResp.data) {
          setStudentName(nameResp.data);
        }
      } catch (e) {
        setError('获取失败');
      } finally {
        setLoading(false);
      }
    })();
  }, [recordId, canView]);

  const tableData = useMemo(() => rows, [rows]);
  const excelConfig = useMemo(() => {
    const headers = ['Date', 'Time', 'Subject', 'Teacher', 'Room'];
    const data = tableData.map((item) => {
      const s = formatTime(item.start_time);
      const e = formatTime(item.end_time);
      return [
        s.date,
        `${s.time}-${e.time}`,
        item.subject_name,
        item.teacher,
        item.room_name,
      ];
    });
    return {
      filename: `${studentName || 'student'}_lesson_table`,
      sheets: [
        { name: 'Lesson Table', headers, data },
      ],
    };
  }, [tableData, studentName]);

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">无访问权限</h2>
          <p className="text-gray-600">缺少 view_lesson_table 权限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-xl font-semibold text-gray-900">{studentName}'s Lesson Table</h1>
          <div className="flex items-center gap-2">
            {tableData.length > 0 && (
              <ExcelExporter config={excelConfig} className="text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                导出Excel
              </ExcelExporter>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-64 text-gray-600">加载中...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 桌面端表格 */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((item) => {
                  const s = formatTime(item.start_time);
                  const e = formatTime(item.end_time);
                  return (
                    <tr key={item.keyTs} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{s.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{s.time}-{e.time}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.subject_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.teacher}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.room_name}</td>
                    </tr>
                  );
                })}
                {tableData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 移动端卡片 */}
          <div className="md:hidden">
            {tableData.map((item) => {
              const s = formatTime(item.start_time);
              const e = formatTime(item.end_time);
              return (
                <div key={item.keyTs} className="p-4 border-b border-gray-200 last:border-b-0">
                  <div className="text-sm font-medium text-gray-900">{item.subject_name}</div>
                  <div className="text-xs text-gray-600 mt-1">{item.teacher} · {item.room_name}</div>
                  <div className="text-xs text-gray-600 mt-1">{s.date} {s.time} - {e.time}</div>
                  <div className="text-xs text-gray-500 mt-1">周次: {item.week_num}</div>
                </div>
              );
            })}
            {tableData.length === 0 && (
              <div className="p-6 text-center text-gray-500">暂无数据</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


