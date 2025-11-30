import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Upload, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { SiteInfoResponse, updateBanner, uploadImage } from '@/services/modules/frontPage';

interface Props {
    data: SiteInfoResponse['banners'];
    refresh: () => void;
}

const BannerSettingsEditor: React.FC<Props> = ({ data, refresh }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // We need to update multiple banners.
            // The backend `update_home_page` seems to handle `banner1`, `banner2`, etc.
            // But our `updateBanner` service only handles `pic_url` (intro banner).
            // We need to extend `updateBanner` or call a new API to update these specific section banners.
            // Since I cannot easily change backend, I will assume `updateBanner` (which calls `update_home_page`)
            // can be modified to accept these fields if I update the service file.
            // I will update the service file next to support these fields.

            // For now, let's assume we send them all.
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

    const customRequest = async (options: any, fieldName: string) => {
        const { file, onSuccess, onError } = options;
        try {
            const res = await uploadImage(file);
            if (res.code === 200 && res.data) {
                onSuccess(res.data.url);
                form.setFieldsValue({ [fieldName]: res.data.url });
                message.success('上传成功');
            } else {
                onError(new Error(res.message));
            }
        } catch (err) {
            onError(err);
        }
    };

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors";
    const buttonClass = "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors border-none h-auto text-sm font-medium shadow-sm";

    const renderUploadItem = (label: string, name: string) => (
        <Form.Item label={label} name={name}>
            <Space.Compact style={{ width: '100%' }}>
                <Input
                    placeholder="输入图片URL或上传"
                    className={inputClass}
                />
                <Upload
                    customRequest={(opts) => customRequest(opts, name)}
                    showUploadList={false}
                >
                    <Button icon={<UploadOutlined />} />
                </Upload>
            </Space.Compact>
        </Form.Item>
    );

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <Card
                title={<span className="text-lg font-semibold text-gray-800">各板块 Banner 设置</span>}
                variant="borderless"
                className="rounded-lg shadow-sm"
                styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        about_us: data.about_us,
                        teachers: data.teachers,
                        campus: data.campus,
                        achievements: data.achievements,
                        apply: data.apply,
                        join_us: data.join_us,
                    }}
                    onFinish={onFinish}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {renderUploadItem('关于我们 Banner', 'about_us')}
                        {renderUploadItem('师资团队 Banner', 'teachers')}
                        {renderUploadItem('校区动态 Banner', 'campus')}
                        {renderUploadItem('教学成果 Banner', 'achievements')}
                        {renderUploadItem('入学申请 Banner', 'apply')}
                        {renderUploadItem('加入我们 Banner', 'join_us')}
                    </div>

                    <Form.Item style={{ marginTop: 24 }}>
                        <Button type="primary" htmlType="submit" loading={loading} block className={buttonClass}>
                            保存所有更改
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default BannerSettingsEditor;
