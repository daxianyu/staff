import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Upload, Space, Image, Card } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { SiteInfoResponse, updateLatestAchievement, updateGraduationInfo, updateTechInfo, deleteAchievements, uploadImage } from '@/services/modules/frontPage';

interface Props {
    data: SiteInfoResponse['achievements'];
    refresh: () => void;
}

const AchievementsEditor: React.FC<Props> = ({ data, refresh }) => {
    const [latestForm] = Form.useForm();
    const [graduationForm] = Form.useForm();
    const [techForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string>('');
    const [previewVisible, setPreviewVisible] = useState(false);

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors";
    const buttonClass = "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors border-none h-auto text-sm font-medium shadow-sm hover:shadow-md transition-shadow";

    const handleUpload = async (file: File) => {
        const res = await uploadImage(file);
        if (res.code === 200 && res.data) {
            return res.data.url;
        }
        throw new Error(res.message || '上传失败');
    };

    // 1. 最新成果
    const onLatestFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await updateLatestAchievement({ image_url: values.image_url });
            if (res.code === 200) {
                message.success('更新成功');
                refresh();
            } else {
                message.error(res.message || '更新失败');
            }
        } catch (error) {
            message.error('更新失败');
        } finally {
            setLoading(false);
        }
    };

    // 2. 毕业生去向
    const onGraduationFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await updateGraduationInfo({
                graduate_year: values.graduate_year,
                image_url: values.image_url,
            });
            if (res.code === 200) {
                message.success('更新成功');
                refresh();
            } else {
                message.error(res.message || '更新失败');
            }
        } catch (error) {
            message.error('更新失败');
        } finally {
            setLoading(false);
        }
    };

    // 3. 学术成果
    const onTechFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await updateTechInfo({
                title: values.title,
                link_url: values.link_url,
            });
            if (res.code === 200) {
                message.success('更新成功');
                refresh();
            } else {
                message.error(res.message || '更新失败');
            }
        } catch (error) {
            message.error('更新失败');
        } finally {
            setLoading(false);
        }
    };

    // 删除列表项
    const handleDelete = async (id: number) => {
        Modal.confirm({
            title: '确认删除?',
            centered: true,
            onOk: async () => {
                try {
                    const res = await deleteAchievements({ id });
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

    // 预览图片
    const handlePreview = (imageUrl: string) => {
        setPreviewImage(imageUrl);
        setPreviewVisible(true);
    };

    const columns = [
        {
            title: <span className="text-sm font-medium text-gray-700">标题</span>,
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: <span className="text-sm font-medium text-gray-700">类型</span>,
            dataIndex: 'achievements_type',
            key: 'achievements_type',
        },
        {
            title: <span className="text-sm font-medium text-gray-700">操作</span>,
            key: 'action',
            width: 150,
            render: (_: any, record: any) => (
                <Space size="small">
                    {record.link_url && (
                        <Button 
                            type="text" 
                            icon={<EyeOutlined />} 
                            onClick={() => window.open(record.link_url, '_blank')} 
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded"
                        >
                            预览
                        </Button>
                    )}
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
            {/* 1. 最新成果 */}
            <Card
                title={<span className="text-lg font-semibold text-gray-800">新增最新成果</span>}
                bordered={false}
                className="rounded-lg shadow-sm border border-gray-200 mb-6"
                styles={{ 
                    header: { 
                        borderBottom: '1px solid #e5e7eb', 
                        padding: '16px 20px' 
                    },
                    body: {
                        padding: '20px'
                    }
                }}
            >
                <Form
                    form={latestForm}
                    layout="vertical"
                    initialValues={{
                        image_url: data.latest_achievement_image || '',
                    }}
                    onFinish={onLatestFinish}
                    className="space-y-4"
                >
                    <Form.Item 
                        label={<span className="text-sm font-medium text-gray-700">成果图片</span>} 
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
                                        latestForm.setFieldsValue({ image_url: url });
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
                            const url = latestForm.getFieldValue('image_url');
                            return url ? (
                                <div className="mb-4 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 p-4 shadow-sm">
                                    <div className="flex items-center justify-center min-h-[200px]">
                                        <Image 
                                            src={url} 
                                            alt="预览图片"
                                            className="max-w-full max-h-[200px] object-contain cursor-pointer"
                                            preview={false}
                                            onClick={() => handlePreview(url)}
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
                    <Form.Item className="mb-0">
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading} 
                            className={`${buttonClass} h-11 text-base font-medium`}
                        >
                            {loading ? '保存中...' : '保存最新成果'}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* 2. 毕业生去向 */}
            <Card
                title={<span className="text-lg font-semibold text-gray-800">新增毕业生去向</span>}
                bordered={false}
                className="rounded-lg shadow-sm border border-gray-200 mb-6"
                styles={{ 
                    header: { 
                        borderBottom: '1px solid #e5e7eb', 
                        padding: '16px 20px' 
                    },
                    body: {
                        padding: '20px'
                    }
                }}
            >
                <Form
                    form={graduationForm}
                    layout="vertical"
                    initialValues={{
                        graduate_year: data.graduate_year || '',
                        image_url: data.graduation_info || '',
                    }}
                    onFinish={onGraduationFinish}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item 
                            label={<span className="text-sm font-medium text-gray-700">毕业年份</span>} 
                            name="graduate_year"
                            rules={[{ required: true, message: '请输入毕业年份' }]}
                        >
                            <Input placeholder="请输入毕业年份，如：2024" className={inputClass} />
                        </Form.Item>
                        <Form.Item 
                            label={<span className="text-sm font-medium text-gray-700">去向图片</span>} 
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
                                            graduationForm.setFieldsValue({ image_url: url });
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
                    </div>
                    <Form.Item shouldUpdate={(prev, curr) => prev.image_url !== curr.image_url} noStyle>
                        {() => {
                            const url = graduationForm.getFieldValue('image_url');
                            return url ? (
                                <div className="mb-4 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 p-4 shadow-sm">
                                    <div className="flex items-center justify-center min-h-[200px]">
                                        <Image 
                                            src={url} 
                                            alt="预览图片"
                                            className="max-w-full max-h-[200px] object-contain cursor-pointer"
                                            preview={false}
                                            onClick={() => handlePreview(url)}
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
                    <Form.Item className="mb-0">
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading} 
                            className={`${buttonClass} h-11 text-base font-medium`}
                        >
                            {loading ? '保存中...' : '保存毕业生去向'}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* 3. 学术成果 */}
            <Card
                title={<span className="text-lg font-semibold text-gray-800">新增学术成果</span>}
                bordered={false}
                className="rounded-lg shadow-sm border border-gray-200 mb-6"
                styles={{ 
                    header: { 
                        borderBottom: '1px solid #e5e7eb', 
                        padding: '16px 20px' 
                    },
                    body: {
                        padding: '20px'
                    }
                }}
            >
                <Form
                    form={techForm}
                    layout="vertical"
                    initialValues={{
                        title: data.tech_info_title || '',
                        link_url: data.tech_info || '',
                    }}
                    onFinish={onTechFinish}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item 
                            label={<span className="text-sm font-medium text-gray-700">学术成果标题</span>} 
                            name="title"
                            rules={[{ required: true, message: '请输入标题' }]}
                        >
                            <Input placeholder="请输入学术成果标题" className={inputClass} />
                        </Form.Item>
                        <Form.Item 
                            label={<span className="text-sm font-medium text-gray-700">学术成果链接</span>} 
                            name="link_url"
                            rules={[{ required: true, message: '请输入链接' }]}
                        >
                            <Input placeholder="请输入学术成果链接" className={inputClass} />
                        </Form.Item>
                    </div>
                    <Form.Item className="mb-0">
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading} 
                            className={`${buttonClass} h-11 text-base font-medium`}
                        >
                            {loading ? '保存中...' : '保存学术成果'}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* 4. 成果列表 */}
            <Card
                title={<span className="text-lg font-semibold text-gray-800">成果列表</span>}
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
            >
                {data.list && data.list.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-sm">暂无成果记录</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                <Table
                    columns={columns}
                    dataSource={data.list}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                            className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-tbody>tr:hover]:bg-gray-50 [&_.ant-table-tbody>tr]:transition-colors"
                            rowClassName="hover:bg-gray-50 transition-colors"
                />
                    </div>
                )}
            </Card>

            {/* 图片预览模态框 */}
            <Modal
                open={previewVisible}
                footer={null}
                onCancel={() => setPreviewVisible(false)}
                centered
                width={800}
            >
                <img alt="预览" style={{ width: '100%' }} src={previewImage} />
            </Modal>
        </div>
    );
};

export default AchievementsEditor;
