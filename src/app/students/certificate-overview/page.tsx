'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getCertificateTable,
    updateCertificateStatus,
    CertificateItem,
    CERTIFICATE_STATUS
} from '@/services/modules/certificate';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import * as Dialog from '@radix-ui/react-dialog';

export default function CertificateOverview() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<CertificateItem[]>([]);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<CertificateItem | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // 加载数据
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getCertificateTable();
            if (res?.code === 200) {
                setData(res.data || []);
            } else {
                alert(res?.message || '获取数据失败');
            }
        } catch (error) {
            console.error('获取数据失败:', error);
            alert('获取数据失败');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // 处理完成
    const handleComplete = async (record: CertificateItem) => {
        if (!confirm('确定要将此申请标记为完成吗？')) return;

        try {
            const res = await updateCertificateStatus({
                record_id: String(record.record_id),
                status: 1,
            });

            if (res?.code === 200) {
                alert('操作成功');
                loadData();
            } else {
                alert(res?.message || '操作失败');
            }
        } catch (error) {
            console.error('操作失败:', error);
            alert('操作失败');
        }
    };

    // 打开驳回模态框
    const openRejectModal = (record: CertificateItem) => {
        setSelectedRecord(record);
        setRejectReason('');
        setRejectModalOpen(true);
    };

    // 提交驳回
    const handleRejectSubmit = async () => {
        if (!selectedRecord) return;
        if (!rejectReason.trim()) {
            alert('请输入拒绝原因');
            return;
        }

        setSubmitting(true);
        try {
            const res = await updateCertificateStatus({
                record_id: String(selectedRecord.record_id),
                status: 2,
                reject_reason: rejectReason,
            });

            if (res?.code === 200) {
                alert('操作成功');
                setRejectModalOpen(false);
                loadData();
            } else {
                alert(res?.message || '操作失败');
            }
        } catch (error) {
            console.error('操作失败:', error);
            alert('操作失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Certificate Overview</h1>
                    <p className="mt-2 text-sm text-gray-600">管理学生证书申请</p>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            学生名称
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            校区
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            导师
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            证书类型
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            备注
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            当前状态
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            拒绝/驳回 原因
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            提交时间
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            操作人员
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            操作
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data.map((item) => (
                                        <tr key={item.record_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {item.student_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.campus_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.mentor_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.certificate_type}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-normal break-words" style={{ width: '200px', minWidth: '200px', maxWidth: '200px' }}>
                                                {item.note || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.status === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                    item.status === 1 ? 'bg-green-100 text-green-800' :
                                                        item.status === 2 ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {item.status_name || CERTIFICATE_STATUS[item.status as keyof typeof CERTIFICATE_STATUS] || '未知'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={item.reject_reason}>
                                                {item.reject_reason || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {item.create_time}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.operator_name || '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {item.status === 0 && (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleComplete(item)}
                                                            className="text-green-600 hover:text-green-900 flex items-center"
                                                            title="完成"
                                                        >
                                                            <CheckIcon className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => openRejectModal(item)}
                                                            className="text-red-600 hover:text-red-900 flex items-center"
                                                            title="驳回"
                                                        >
                                                            <XMarkIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                                                暂无数据
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* 驳回模态框 */}
            <Dialog.Root open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
                        <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
                            驳回申请
                        </Dialog.Title>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                拒绝原因 <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={4}
                                placeholder="请输入拒绝原因..."
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRejectModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                disabled={submitting}
                            >
                                取消
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                                disabled={submitting}
                            >
                                {submitting ? '提交中...' : '确定驳回'}
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
