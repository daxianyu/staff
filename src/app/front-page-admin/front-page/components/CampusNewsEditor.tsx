import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Upload, Space, Image, Card } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { SiteInfoResponse, addCampusNews, deleteCampusNews, uploadImage } from '@/services/modules/frontPage';

interface Props {
    data: SiteInfoResponse['campus_news'];
    refresh: () => void;
}

const CampusNewsEditor: React.FC<Props> = ({ data, refresh }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleEdit = (record: any) => {
        setEditingItem(record);
        form.setFieldsValue({
            title: record.title,
            cover: record.cover,
            link: record.link,
            desc: record.desc,
        });
        setIsModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        Modal.confirm({
            title: '确认删除?',
            centered: true,
            onOk: async () => {
                try {
                    const res = await deleteCampusNews({ id });
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
                title: values.title,
                image_url: values.cover,
                link: values.link,
                description: values.desc,
            };

            if (editingItem) {
                // Since backend only supports INSERT for update_campus_news, we simulate update by delete + add
                const delRes = await deleteCampusNews({ id: editingItem.id });
                if (delRes.code !== 200) {
                    throw new Error(delRes.message || '更新失败(删除旧记录失败)');
                }
            }

            const res = await addCampusNews(params);

            if (res.code === 200) {
                message.success(editingItem ? '更新成功' : '添加成功');
                refresh();
                setIsModalVisible(false);
            } else {
                message.error(res.message || '操作失败');
            }
        } catch (error: any) {
            message.error(error.message || '操作失败');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors";
    const buttonClass = "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors border-none h-auto text-sm font-medium shadow-sm hover:shadow-md transition-shadow";

    const columns = [
        {
            title: <span className="text-sm font-medium text-gray-700">封面图</span>,
            dataIndex: 'cover',
            key: 'cover',
            width: 120,
            render: (url: string) => (
                <div className="flex">
                    {url ? (
                        <div className="rounded-lg overflow-hidden border-gray-200 bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                            <Image
                                src={url}
                                height={60}
                                width={80}
                                style={{ objectFit: 'cover' }}
                                className="block rounded"
                                preview={{
                                    mask: '预览',
                                }}
                            />
                        </div>
                    ) : (
                        <div className="w-[80px] h-[60px] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                            无图片
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: <span className="text-sm font-medium text-gray-700">标题</span>,
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: <span className="text-sm font-medium text-gray-700">链接</span>,
            dataIndex: 'link',
            key: 'link',
            ellipsis: true,
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

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Card
                title={<span className="text-lg font-semibold text-gray-800">校区动态管理</span>}
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
                        添加动态
                    </Button>
                }
            >
                {(!data || data.length === 0) ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-sm mb-4">暂无动态信息</div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            className={buttonClass}
                        >
                            添加第一条动态
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table
                            columns={columns}
                            dataSource={data}
                            rowKey="id"
                            pagination={{ pageSize: 10 }}
                            className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-tbody>tr:hover]:bg-gray-50 [&_.ant-table-tbody>tr]:transition-colors"
                            rowClassName="hover:bg-gray-50 transition-colors"
                        />
                    </div>
                )}
            </Card>

            <Modal
                title={
                    <span className="text-lg font-semibold text-gray-800">
                        {editingItem ? '编辑动态' : '添加动态'}
                    </span>
                }
                open={isModalVisible}
                onOk={() => form.submit()}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={loading}
                width={600}
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
                    <Form.Item
                        name="title"
                        label={<span className="text-sm font-medium text-gray-700">标题</span>}
                        rules={[{ required: true, message: '请输入标题' }]}
                    >
                        <Input placeholder="请输入标题" className={inputClass} />
                    </Form.Item>
                    <Form.Item
                        name="link"
                        label={<span className="text-sm font-medium text-gray-700">链接</span>}
                        rules={[{ required: true, message: '请输入链接' }]}
                    >
                        <Input placeholder="请输入跳转链接" className={inputClass} />
                    </Form.Item>
                    <Form.Item
                        name="desc"
                        label={<span className="text-sm font-medium text-gray-700">描述</span>}
                    >
                        <Input.TextArea
                            rows={3}
                            placeholder="请输入描述"
                            className={`${inputClass} resize-none`}
                        />
                    </Form.Item>
                    <Form.Item
                        label={<span className="text-sm font-medium text-gray-700">封面图</span>}
                    >
                        <Space.Compact style={{ width: '100%' }}>
                            <Form.Item name="cover" noStyle rules={[{ required: true, message: '请上传封面图' }]}>
                                <Input placeholder="输入图片URL或上传" className={inputClass} />
                            </Form.Item>
                            <Upload
                                showUploadList={false}
                                customRequest={async (options) => {
                                    try {
                                        const url = await handleUpload(options.file as File);
                                        form.setFieldsValue({ cover: url });
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
                    <Form.Item shouldUpdate={(prev, curr) => prev.cover !== curr.cover} noStyle>
                        {() => {
                            const url = form.getFieldValue('cover');
                            return url ? (
                                <div className="mb-4 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 p-4 shadow-sm">
                                    <div className="flex items-center justify-center w-full">
                                        <Image
                                            src={url}
                                            alt="预览封面"
                                            className="max-w-full max-h-48 object-contain"
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
                                    <span>暂无封面预览</span>
                                </div>
                            );
                        }}
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CampusNewsEditor;
