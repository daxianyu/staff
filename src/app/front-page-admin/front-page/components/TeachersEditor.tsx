import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Upload, Space, Image, InputNumber, Card, Select } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { SiteInfoResponse, addTeachers, updateTeachers, deleteTeachers, uploadImage } from '@/services/modules/frontPage';

interface Props {
    data: SiteInfoResponse['teachers'];
    refresh: () => void;
}

const TeachersEditor: React.FC<Props> = ({ data, refresh }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const handleEdit = (record: any) => {
        setEditingItem(record);
        // 将前端字段名映射回表单字段名
        form.setFieldsValue({
            teacher_name: record.name || record.teacher_name,
            teacher_title: record.title || record.teacher_title,
            teacher_desc: record.description || record.teacher_desc,
            teacher_photo: record.image_url || record.teacher_photo,
            teacher_group: record.teacher_group !== undefined ? record.teacher_group : null,
            group_leader: record.group_leader !== undefined ? record.group_leader : null,
            teacher_responsible: record.teacher_responsible || '',
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        Modal.confirm({
            title: '确认删除?',
            centered: true,
            onOk: async () => {
                try {
                    const res = await deleteTeachers({ id });
                    if (res.code === 200) {
                        message.success('删除成功');
                        refresh();
                    } else {
                        message.error(res.message || '删除失败');
                    }
                } catch (error) {
                    message.error('删除失败');
                }
            }
        });
    };

    const handleAdd = () => {
        setEditingItem(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleUpload = async (file: File) => {
        const res = await uploadImage(file);
        if (res.code === 200 && res.data) {
            return res.data.url;
        } else {
            throw new Error(res.message || '上传失败');
        }
    };

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const params = {
                teacher_name: values.teacher_name,
                teacher_title: values.teacher_title,
                teacher_desc: values.teacher_desc,
                teacher_photo: values.teacher_photo,
                teacher_group: values.teacher_group,
                group_leader: values.group_leader,
                teacher_responsible: values.teacher_responsible,
            };

            let res;
            if (editingItem) {
                res = await updateTeachers({ ...params, record_id: editingItem.id });
            } else {
                res = await addTeachers(params);
            }

            if (res.code === 200) {
                message.success(editingItem ? '更新成功' : '添加成功');
                refresh();
                setIsModalVisible(false);
            } else {
                message.error(res.message || '操作失败');
            }
        } catch (error) {
            message.error('操作失败');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors";
    const buttonClass = "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors border-none h-auto text-sm font-medium shadow-sm hover:shadow-md transition-shadow";

    const columns = [
        {
            title: <span className="text-sm font-medium text-gray-700">照片</span>,
            dataIndex: 'image_url',
            key: 'image_url',
            width: 100,
            render: (image_url: string) => (
                <div className="flex">
                    {image_url ? (
                        <div className="rounded-lg overflow-hidden border-gray-200 bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                            <Image
                                src={image_url}
                                height={60}
                                width={60}
                                style={{ objectFit: 'cover' }}
                                className="block rounded"
                                preview={{
                                    mask: '预览',
                                }}
                            />
                        </div>
                    ) : (
                        <div className="w-[60px] h-[60px] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                            无照片
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: <span className="text-sm font-medium text-gray-700">姓名</span>,
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: <span className="text-sm font-medium text-gray-700">头衔/职位</span>,
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: <span className="text-sm font-medium text-gray-700">操作</span>,
            key: 'action',
            width: 150,
            render: (_: any, record: any) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded"
                    >
                        编辑
                    </Button>
                    <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
                    >
                        删除
                    </Button>
                </Space>
            ),
        },
    ];

    // Pagination logic
    const totalItems = data?.length || 0;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = data?.slice(startIndex, endIndex) || [];

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const renderPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxPages = 7;

        if (totalPages <= maxPages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Card
                title={<span className="text-lg font-semibold text-gray-800">师资团队管理</span>}
                bordered={false}
                className="rounded-lg shadow-sm border border-gray-200"
                styles={{
                    header: {
                        borderBottom: '1px solid #e5e7eb',
                        padding: '16px 20px'
                    },
                    body: {
                        padding: '20px'
                    }
                }}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className={buttonClass}>
                        添加教师
                    </Button>
                }
            >
                {totalItems === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-sm mb-4">暂无教师信息</div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            className={buttonClass}
                        >
                            添加第一位教师
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <Table
                                columns={columns}
                                dataSource={paginatedData}
                                rowKey="id"
                                pagination={false}
                                className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-tbody>tr:hover]:bg-gray-50 [&_.ant-table-tbody>tr]:transition-colors"
                                rowClassName="hover:bg-gray-50 transition-colors"
                            />
                        </div>

                        {/* Custom Pagination */}
                        {totalItems > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="text-sm text-gray-700">
                                        显示第 {startIndex + 1} - {Math.min(endIndex, totalItems)} 条，共 {totalItems} 条记录
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={pageSize}
                                            onChange={(e) => {
                                                setPageSize(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value={50}>50 条/页</option>
                                            <option value={100}>100 条/页</option>
                                        </select>
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            上一页
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {renderPageNumbers().map((page, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => typeof page === 'number' && handlePageChange(page)}
                                                    disabled={page === '...'}
                                                    className={`w-8 h-8 flex items-center justify-center text-sm font-medium border rounded ${page === currentPage
                                                        ? 'bg-blue-600 border-blue-600 text-white'
                                                        : page === '...'
                                                            ? 'bg-white border-transparent text-gray-400 cursor-default'
                                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>
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
                        )}
                    </>
                )}
            </Card>

            <Modal
                title={
                    <span className="text-lg font-semibold text-gray-800">
                        {editingItem ? '编辑教师' : '添加教师'}
                    </span>
                }
                open={isModalVisible}
                onOk={() => form.submit()}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={loading}
                width={700}
                centered
                okButtonProps={{
                    className: "bg-blue-600 hover:bg-blue-700 h-10 px-6 font-medium shadow-sm hover:shadow-md transition-shadow"
                }}
                cancelButtonProps={{
                    className: "h-10 px-6"
                }}
                styles={{
                    header: {
                        borderBottom: '1px solid #e5e7eb',
                        padding: '16px 20px'
                    },
                    body: {
                        padding: '20px'
                    },
                    footer: {
                        borderTop: '1px solid #e5e7eb',
                        padding: '12px 20px'
                    }
                }}
            >
                <Form form={form} layout="vertical" onFinish={onFinish} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                            name="teacher_name"
                            label={<span className="text-sm font-medium text-gray-700">姓名</span>}
                            rules={[{ required: true, message: '请输入姓名' }]}
                        >
                            <Input placeholder="请输入姓名" className={inputClass} />
                        </Form.Item>
                        <Form.Item
                            name="teacher_title"
                            label={<span className="text-sm font-medium text-gray-700">头衔/职称</span>}
                            rules={[{ required: true, message: '请输入头衔' }]}
                        >
                            <Input placeholder="请输入头衔" className={inputClass} />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                            name="teacher_group"
                            label={<span className="text-sm font-medium text-gray-700">分组</span>}
                            rules={[{ required: true, message: '请输入分组' }]}
                        >
                            <Input
                                placeholder="请输入分组，如：数学组"
                                className={inputClass}
                            />
                        </Form.Item>
                        <Form.Item
                            name="group_leader"
                            label={<span className="text-sm font-medium text-gray-700">是否组长</span>}
                        >
                            <Select
                                placeholder="请选择是否组长"
                                className={inputClass}
                                style={{ width: '100%' }}
                            >
                                <Select.Option value={0}>否</Select.Option>
                                <Select.Option value={1}>是</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="teacher_desc"
                        label={<span className="text-sm font-medium text-gray-700">简介</span>}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="请输入教师简介"
                            className={`${inputClass} resize-none`}
                            style={{ minHeight: '100px' }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="teacher_responsible"
                        label={<span className="text-sm font-medium text-gray-700">负责内容</span>}
                    >
                        <Input.TextArea
                            rows={2}
                            placeholder="请输入负责内容"
                            className={`${inputClass} resize-none`}
                        />
                    </Form.Item>

                    <Form.Item
                        name="teacher_photo"
                        label={<span className="text-sm font-medium text-gray-700">照片</span>}
                    >
                        <Space.Compact style={{ width: '100%' }}>
                            <Input placeholder="输入图片URL或上传" className={inputClass} />
                            <Upload
                                showUploadList={false}
                                customRequest={async (options) => {
                                    try {
                                        const url = await handleUpload(options.file as File);
                                        form.setFieldsValue({ teacher_photo: url });
                                        message.success('上传成功');
                                    } catch (e) {
                                        message.error('上传失败');
                                    }
                                }}
                            >
                                <Button icon={<UploadOutlined />} className="h-auto px-3" />
                            </Upload>
                        </Space.Compact>
                    </Form.Item>
                    <Form.Item shouldUpdate={(prev, curr) => prev.teacher_photo !== curr.teacher_photo} noStyle>
                        {() => {
                            const url = form.getFieldValue('teacher_photo');
                            return url ? (
                                <div className="mb-4 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 p-4 shadow-sm">
                                    <div className="flex items-center justify-center w-32 h-32">
                                        <Image
                                            src={url}
                                            alt="预览照片"
                                            className="max-w-full max-h-full object-contain"
                                            preview={false}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4 h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-sm">
                                    <div className="mb-2">
                                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span>暂无照片预览</span>
                                </div>
                            );
                        }}
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TeachersEditor;
