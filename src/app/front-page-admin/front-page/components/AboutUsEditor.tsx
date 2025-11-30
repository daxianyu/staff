import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { SiteInfoResponse, updateAboutUs } from '@/services/modules/frontPage';

interface Props {
    data: SiteInfoResponse['about_us'];
    refresh: () => void;
}

const AboutUsEditor: React.FC<Props> = ({ data, refresh }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // Note: updateAboutUs currently only takes content and image_url (which we mapped to desc_url).
            // school_idea_url and school_overview_url might need separate handling if they are editable.
            // For now, let's assume we are editing the main description content.
            const res = await updateAboutUs({
                content: values.content,
                school_idea_url: values.school_idea_url,
                school_overview_url: values.school_overview_url,
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

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors";
    const buttonClass = "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors border-none h-auto text-sm font-medium shadow-sm hover:shadow-md transition-shadow";

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Card
                title={<span className="text-lg font-semibold text-gray-800">关于我们设置</span>}
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
                    form={form}
                    layout="vertical"
                    initialValues={{
                        content: data.content,
                        school_idea_url: data.school_idea_url,
                        school_overview_url: data.school_overview_url,
                    }}
                    onFinish={onFinish}
                    className="space-y-4"
                >
                    <Form.Item
                        label={<span className="text-sm font-medium text-gray-700">学校简介链接</span>}
                        name="content"
                        tooltip="对应 menu_type=4"
                    >
                        <Input placeholder="请输入学校简介链接" className={inputClass} />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-sm font-medium text-gray-700">办学理念链接</span>}
                        name="school_idea_url"
                        tooltip="对应 menu_type=1"
                    >
                        <Input placeholder="请输入办学理念链接" className={inputClass} />
                    </Form.Item>

                    <Form.Item
                        label={<span className="text-sm font-medium text-gray-700">学校概况链接</span>}
                        name="school_overview_url"
                        tooltip="对应 menu_type=2"
                    >
                        <Input placeholder="请输入学校概况链接" className={inputClass} />
                    </Form.Item>

                    <Form.Item className="mb-0 mt-6">
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading} 
                            block 
                            className={`${buttonClass} h-11 text-base font-medium`}
                        >
                            {loading ? '保存中...' : '保存更改'}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default AboutUsEditor;
