import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Upload, Space, Image, Modal } from 'antd';
import { UploadOutlined, EyeOutlined } from '@ant-design/icons';
import { SiteInfoResponse, updateApplication, uploadImage } from '@/services/modules/frontPage';

interface Props {
    data: SiteInfoResponse['application'];
    refresh: () => void;
}

const AdmissionEditor: React.FC<Props> = ({ data, refresh }) => {
    const [courseForm] = Form.useForm();
    const [rulesForm] = Form.useForm();
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

    const handlePreview = (imageUrl: string) => {
        setPreviewImage(imageUrl);
        setPreviewVisible(true);
    };

    // 课程设置
    const onCourseFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await updateApplication({
                class_control_url: values.image_url,
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

    // 招生简章
    const onRulesFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await updateApplication({
                rules_url: values.image_url,
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

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* 1. 课程设置 */}
            <Card
                title={<span className="text-lg font-semibold text-gray-800">课程设置</span>}
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
                    form={courseForm}
                    layout="vertical"
                    initialValues={{
                        image_url: data.class_control_url || '',
                    }}
                    onFinish={onCourseFinish}
                    className="space-y-4"
                >
                    <Form.Item 
                        label={<span className="text-sm font-medium text-gray-700">课程设置图片</span>} 
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
                                        courseForm.setFieldsValue({ image_url: url });
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
                            const url = courseForm.getFieldValue('image_url');
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
                            {loading ? '保存中...' : '保存课程设置'}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* 2. 招生简章 */}
            <Card
                title={<span className="text-lg font-semibold text-gray-800">招生简章</span>}
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
                <Form
                    form={rulesForm}
                    layout="vertical"
                    initialValues={{
                        image_url: data.content || '',
                    }}
                    onFinish={onRulesFinish}
                    className="space-y-4"
                >
                    <Form.Item 
                        label={<span className="text-sm font-medium text-gray-700">招生简章图片</span>} 
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
                                        rulesForm.setFieldsValue({ image_url: url });
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
                            const url = rulesForm.getFieldValue('image_url');
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
                            {loading ? '保存中...' : '保存招生简章'}
                        </Button>
                    </Form.Item>
                </Form>
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

export default AdmissionEditor;
