import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Upload, Space, Image, Modal } from 'antd';
import { UploadOutlined, EyeOutlined } from '@ant-design/icons';
import { SiteInfoResponse, updateBanner, uploadImage } from '@/services/modules/frontPage';

interface Props {
    data: SiteInfoResponse['banners'];
    refresh: () => void;
}

const BannerSettingsEditor: React.FC<Props> = ({ data, refresh }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        form.setFieldsValue({
            about_us: data.about_us || '',
            teachers: data.teachers || '',
            campus: data.campus || '',
            achievements: data.achievements || '',
            apply: data.apply || '',
            join_us: data.join_us || '',
        });
    }, [data, form]);
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

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await updateBanner({
                about_us: values.about_us,
                teachers: values.teachers,
                campus: values.campus,
                achievements: values.achievements,
                apply: values.apply,
                join_us: values.join_us,
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

    const renderBannerItem = (label: string, name: string) => (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <Form.Item
                label={<span className="text-sm font-medium text-gray-700">{label}</span>}
                className="mb-4"
            >
                <Space.Compact style={{ width: '100%' }}>
                    <Form.Item
                        name={name}
                        noStyle
                    >
                        <Input
                            placeholder="输入图片URL或上传"
                            className={inputClass}
                        />
                    </Form.Item>
                    <Upload
                        showUploadList={false}
                        customRequest={async (options) => {
                            try {
                                const url = await handleUpload(options.file as File);
                                form.setFieldsValue({ [name]: url });
                                message.success('上传成功');
                            } catch (e) {
                                message.error('上传失败');
                            }
                        }}
                    >
                        <Button
                            icon={<UploadOutlined />}
                            className="h-auto px-3 border-l-0 rounded-l-none"
                        />
                    </Upload>
                </Space.Compact>
            </Form.Item>
            <Form.Item shouldUpdate={(prev, curr) => prev[name] !== curr[name]} noStyle>
                {() => {
                    const url = form.getFieldValue(name);
                    return url ? (
                        <div className="rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 p-3 shadow-sm">
                            <div className="flex items-center justify-center bg-gray-50 relative group">
                                <Image
                                    src={url}
                                    alt={label}
                                    className="w-full h-auto object-contain cursor-pointer"
                                    preview={false}
                                    onClick={() => handlePreview(url)}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <Button
                                        type="text"
                                        icon={<EyeOutlined />}
                                        onClick={() => handlePreview(url)}
                                        className="text-white hover:text-white hover:bg-white/20"
                                    >
                                        预览
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-sm">
                            <div className="mb-2">
                                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="text-xs">暂无图片</span>
                        </div>
                    );
                }}
            </Form.Item>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Card
                title={<span className="text-lg font-semibold text-gray-800">各板块 Banner 设置</span>}
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
                    form={form}
                    layout="vertical"
                    initialValues={{
                        about_us: data.about_us || '',
                        teachers: data.teachers || '',
                        campus: data.campus || '',
                        achievements: data.achievements || '',
                        apply: data.apply || '',
                        join_us: data.join_us || '',
                    }}
                    onFinish={onFinish}
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 gap-6">
                        {renderBannerItem('关于我们 Banner', 'about_us')}
                        {renderBannerItem('师资团队 Banner', 'teachers')}
                        {renderBannerItem('校区动态 Banner', 'campus')}
                        {renderBannerItem('教学成果 Banner', 'achievements')}
                        {renderBannerItem('入学申请 Banner', 'apply')}
                        {renderBannerItem('加入我们 Banner', 'join_us')}
                    </div>

                    <Form.Item className="mb-0 mt-6">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className={`${buttonClass} h-11 text-base font-medium w-full`}
                        >
                            {loading ? '保存中...' : '保存所有更改'}
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
                width={1200}
            >
                <img
                    alt="预览"
                    style={{ width: '100%', display: 'block' }}
                    src={previewImage}
                />
            </Modal>
        </div>
    );
};

export default BannerSettingsEditor;
