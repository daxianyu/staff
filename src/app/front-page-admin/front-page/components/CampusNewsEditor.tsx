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
    const buttonClass = "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors border-none h-auto text-sm font-medium shadow-sm";

    const columns = [
        {
            title: '封面图',
            dataIndex: 'cover',
            key: 'cover',
            render: (url: string) => <Image src={url} height={50} width={80} style={{ objectFit: 'cover', borderRadius: 4 }} />,
        },
        {
            title: '标题',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: '链接',
            dataIndex: 'link',
            key: 'link',
            ellipsis: true,
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, record: any) => (
                <Space>
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} className="text-blue-600 hover:text-blue-800">编辑</Button>
                    <Button type="text" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} className="text-red-600 hover:text-red-800">删除</Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Card
                title={<span className="text-lg font-semibold text-gray-800">校区动态管理</span>}
                variant="borderless"
                className="rounded-lg shadow-sm"
                styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className={buttonClass}>
                        添加动态
                    </Button>
                }
            >
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title={editingItem ? '编辑动态' : '添加动态'}
                open={isModalVisible}
                onOk={() => form.submit()}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={loading}
                width={600}
                okButtonProps={{ className: "bg-blue-600" }}
            >
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
                        <Input placeholder="请输入标题" className={inputClass} />
                    </Form.Item>
                    <Form.Item name="link" label="链接" rules={[{ required: true, message: '请输入链接' }]}>
                        <Input placeholder="请输入跳转链接" className={inputClass} />
                    </Form.Item>
                    <Form.Item name="desc" label="描述">
                        <Input.TextArea rows={3} placeholder="请输入描述" className={inputClass} />
                    </Form.Item>
                    <Form.Item name="cover" label="封面图" rules={[{ required: true, message: '请上传封面图' }]}>
                        <Space.Compact style={{ width: '100%' }}>
                            <Input placeholder="输入图片URL或上传" className={inputClass} />
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
                                <Button icon={<UploadOutlined />} />
                            </Upload>
                        </Space.Compact>
                    </Form.Item>
                    <Form.Item shouldUpdate={(prev, curr) => prev.cover !== curr.cover}>
                        {() => {
                            const url = form.getFieldValue('cover');
                            return url ? (
                                <div className="mt-2 rounded overflow-hidden border border-gray-200">
                                    <Image src={url} height={150} style={{ objectFit: 'contain' }} />
                                </div>
                            ) : null;
                        }}
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CampusNewsEditor;
