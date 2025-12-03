import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Upload, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { SiteInfoResponse, updateHomePageIntro, uploadImage } from '@/services/modules/frontPage';

interface Props {
    data: SiteInfoResponse['home_page'];
    refresh: () => void;
}

const HomePageEditor: React.FC<Props> = ({ data, refresh }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await updateHomePageIntro({
                // Video
                video_title: values.video_title,
                video_url: values.video_url,

                // Banners 1-3
                banner1: values.banner1,
                banner1_url: values.banner1_url,
                banner2: values.banner2,
                banner2_url: values.banner2_url,
                banner3: values.banner3,
                banner3_url: values.banner3_url,

                // Intro (Pic)
                title: values.intro_title,
                subtitle: values.intro_description,
                image_url: values.intro_image_url,
                link: values.intro_link,
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

    const handleUpload = async (file: File) => {
        const res = await uploadImage(file);
        if (res.code === 200 && res.data) {
            return res.data.url;
        }
        throw new Error(res.message || '上传失败');
    };

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors";
    const buttonClass = "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors border-none h-auto text-sm font-medium shadow-sm";

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    video_title: data.video.title,
                    video_url: data.video.url,
                    intro_title: data.intro.title,
                    intro_description: data.intro.description,
                    intro_image_url: data.intro.image_url,
                    intro_link: data.intro.link,
                    banner1: data.banners?.[0]?.image_url,
                    banner1_url: data.banners?.[0]?.link,
                    banner2: data.banners?.[1]?.image_url,
                    banner2_url: data.banners?.[1]?.link,
                    banner3: data.banners?.[2]?.image_url,
                    banner3_url: data.banners?.[2]?.link,
                }}
                onFinish={onFinish}
            >
                {/* Video & Intro Section - 合并为一个区域 */}
                <Card
                    title={<span className="text-lg font-semibold text-gray-800">视频与图文介绍</span>}
                    className="mb-6 rounded-lg shadow-sm border border-gray-200"
                    styles={{ header: { borderBottom: '1px solid #e5e7eb', padding: '16px 20px' }, body: { padding: '20px' } }}
                >
                    <div className="space-y-6">
                        {/* 视频设置 */}
                        <div className="pb-6 border-b border-gray-100">
                            <h3 className="text-base font-medium text-gray-700 mb-4">视频设置</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Form.Item label={<span className="text-sm font-medium text-gray-700">视频标题</span>} name="video_title">
                                    <Input placeholder="请输入视频标题" className={inputClass} />
                                </Form.Item>
                                <Form.Item label={<span className="text-sm font-medium text-gray-700">视频链接 (URL)</span>} name="video_url">
                                    <Input placeholder="请输入视频链接" className={inputClass} />
                                </Form.Item>
                            </div>
                        </div>

                        {/* 图文介绍 */}
                        <div>
                            <h3 className="text-base font-medium text-gray-700 mb-4">图文介绍</h3>
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    <Form.Item label={<span className="text-sm font-medium text-gray-700">标题</span>} name="intro_title">
                                        <Input placeholder="请输入标题" className={inputClass} />
                                    </Form.Item>
                                    <Form.Item label={<span className="text-sm font-medium text-gray-700">文章链接</span>} name="intro_link">
                                        <Input placeholder="请输入文章链接" className={inputClass} />
                                    </Form.Item>
                                    <Form.Item label={<span className="text-sm font-medium text-gray-700">描述</span>} name="intro_description">
                                        <Input.TextArea
                                            rows={4}
                                            placeholder="请输入描述内容"
                                            className={`${inputClass} resize-none`}
                                            style={{ minHeight: '100px' }}
                                        />
                                    </Form.Item>
                                </div>
                                <div className="w-full lg:w-80 flex-shrink-0">
                                    <Form.Item label={<span className="text-sm font-medium text-gray-700">图片</span>} name="intro_image_url">
                                        <Space.Compact style={{ width: '100%' }}>
                                            <Input placeholder="输入图片URL或上传" className={inputClass} />
                                            <Upload
                                                showUploadList={false}
                                                customRequest={async (options) => {
                                                    try {
                                                        const url = await handleUpload(options.file as File);
                                                        form.setFieldsValue({ intro_image_url: url });
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
                                    <Form.Item shouldUpdate={(prev, curr) => prev.intro_image_url !== curr.intro_image_url} noStyle>
                                        {() => {
                                            const url = form.getFieldValue('intro_image_url');
                                            return url ? (
                                                <div className="mt-3 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                                    <img src={url} alt="Preview" className="w-full h-auto block" />
                                                </div>
                                            ) : (
                                                <div className="mt-3 h-40 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                                                    暂无图片
                                                </div>
                                            );
                                        }}
                                    </Form.Item>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Banners Section */}
                <Card
                    title={<span className="text-lg font-semibold text-gray-800">Banner 设置</span>}
                    className="mb-6 rounded-lg shadow-sm border border-gray-200"
                    styles={{ header: { borderBottom: '1px solid #e5e7eb', padding: '16px 20px' }, body: { padding: '20px' } }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((num) => (
                            <Card
                                key={num}
                                type="inner"
                                title={<span className="text-sm font-medium text-gray-700">Banner {num}</span>}
                                size="small"
                                className="bg-gray-50 rounded-lg border border-gray-200"
                                styles={{ header: { padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }, body: { padding: '16px' } }}
                            >
                                <div className="space-y-3">
                                    <Form.Item label={<span className="text-xs font-medium text-gray-600">图片链接</span>} name={`banner${num}`} className="mb-0">
                                        <Space.Compact style={{ width: '100%' }}>
                                            <Input placeholder="输入URL或上传" className={inputClass} />
                                            <Upload
                                                showUploadList={false}
                                                customRequest={async (options) => {
                                                    try {
                                                        const url = await handleUpload(options.file as File);
                                                        form.setFieldsValue({ [`banner${num}`]: url });
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
                                    <Form.Item label={<span className="text-xs font-medium text-gray-600">跳转链接</span>} name={`banner${num}_url`} className="mb-0">
                                        <Input placeholder="点击跳转的链接" className={inputClass} />
                                    </Form.Item>
                                    <Form.Item shouldUpdate={(prev, curr) => prev[`banner${num}`] !== curr[`banner${num}`]} noStyle>
                                        {() => {
                                            const url = form.getFieldValue(`banner${num}`);
                                            return url ? (
                                                <div className="mt-3 rounded-md overflow-hidden border border-gray-200 shadow-sm">
                                                    <img src={url} alt={`Banner ${num}`} className="w-full h-28 object-cover" />
                                                </div>
                                            ) : (
                                                <div className="mt-3 h-28 bg-gray-100 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                                                    暂无图片
                                                </div>
                                            );
                                        }}
                                    </Form.Item>
                                </div>
                            </Card>
                        ))}
                    </div>
                </Card>

                <Form.Item className="mb-0">
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        className={`${buttonClass} h-11 text-base font-medium shadow-md hover:shadow-lg transition-shadow`}
                    >
                        {loading ? '保存中...' : '保存所有更改'}
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default HomePageEditor;
