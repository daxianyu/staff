import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Upload, Space, Image, Card } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { SiteInfoResponse, updateHomeCarousel, uploadImage } from '@/services/modules/frontPage';

interface Props {
    data: SiteInfoResponse['home_carousel'];
    refresh: () => void;
}

const HomeCarouselEditor: React.FC<Props> = ({ data, refresh }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleEdit = (record: any) => {
        setEditingItem(record);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleDelete = async (id: number) => {
        const newList = data.filter(item => item.id !== id);
        await handleUpdate(newList);
    };

    const handleAdd = () => {
        if (data.length >= 5) {
            message.warning('最多添加5张轮播图');
            return;
        }
        setEditingItem(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleUpdate = async (newList: any[]) => {
        setLoading(true);
        try {
            const res = await updateHomeCarousel({ carousel: newList });
            if (res.code === 200) {
                message.success('更新成功');
                refresh();
                setIsModalVisible(false);
            } else {
                message.error(res.message || '更新失败');
            }
        } catch (error) {
            message.error('更新失败');
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values: any) => {
        let newList = [...data];
        if (editingItem) {
            newList = newList.map(item => item.id === editingItem.id ? { ...item, ...values } : item);
        } else {
            newList.push({ ...values, id: Date.now() }); // Temp ID, backend will handle real ID or just order
        }
        await handleUpdate(newList);
    };

    const handleUpload = async (file: File) => {
        const res = await uploadImage(file);
        if (res.code === 200 && res.data) {
            return res.data.url;
        } else {
            throw new Error(res.message || '上传失败');
        }
    };

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors";
    const buttonClass = "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors border-none h-auto text-sm font-medium shadow-sm hover:shadow-md transition-shadow";

    const columns = [
        {
            title: <span className="text-sm font-medium text-gray-700">图片</span>,
            dataIndex: 'image_url',
            key: 'image_url',
            width: 140,
            render: (url: string) => (
                <div className="flex">
                    <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                        <Image
                            src={url}
                            height={70}
                            width={110}
                            style={{ objectFit: 'contain' }}
                            className="block rounded"
                            preview={{
                                mask: '预览',
                            }}
                        />
                    </div>
                </div>
            ),
        },
        {
            title: <span className="text-sm font-medium text-gray-700">跳转链接</span>,
            dataIndex: 'link',
            key: 'link',
            ellipsis: { showTitle: true },
            render: (text: string) => (
                <span className="text-sm text-gray-600">{text || <span className="text-gray-400">无链接</span>}</span>
            ),
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
                title={<span className="text-lg font-semibold text-gray-800">主页轮播图管理</span>}
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
                    <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-xs font-medium">
                            {data.length}/5
                        </span>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            disabled={data.length >= 5}
                            className={`${buttonClass} ${data.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            添加轮播图
                        </Button>
                    </div>
                }
            >
                {data.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-sm mb-4">暂无轮播图</div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            className={buttonClass}
                        >
                            添加第一张轮播图
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table
                            columns={columns}
                            dataSource={data}
                            rowKey="id"
                            pagination={false}
                            className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-tbody>tr:hover]:bg-gray-50 [&_.ant-table-tbody>tr]:transition-colors"
                            rowClassName="hover:bg-gray-50 transition-colors"
                        />
                    </div>
                )}
            </Card>

            <Modal
                title={
                    <span className="text-lg font-semibold text-gray-800">
                        {editingItem ? '编辑轮播图' : '添加轮播图'}
                    </span>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
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
                        label={<span className="text-sm font-medium text-gray-700">图片</span>}
                        name="image_url"
                        rules={[{ required: true, message: '请上传图片' }]}
                    >
                        <Space.Compact style={{ width: '100%' }}>
                            <Input placeholder="输入图片URL或上传" className={inputClass} />
                            <Upload
                                showUploadList={false}
                                customRequest={async (options) => {
                                    try {
                                        const url = await handleUpload(options.file as File);
                                        form.setFieldsValue({ image_url: url });
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
                    <Form.Item shouldUpdate={(prev, curr) => prev.image_url !== curr.image_url} noStyle>
                        {() => {
                            const url = form.getFieldValue('image_url');
                            return url ? (
                                <div className="mb-4 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 p-4 shadow-sm">
                                    <div className="flex items-center justify-center min-h-[200px]">
                                        <Image
                                            src={url}
                                            alt="预览图片"
                                            className="max-w-full max-h-[200px] object-contain"
                                            preview={false}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4 h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-sm">
                                    <div className="mb-2">
                                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span>暂无图片预览</span>
                                </div>
                            );
                        }}
                    </Form.Item>
                    <Form.Item
                        label={<span className="text-sm font-medium text-gray-700">跳转链接</span>}
                        name="link"
                    >
                        <Input placeholder="请输入跳转链接（可选）" className={inputClass} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default HomeCarouselEditor;
