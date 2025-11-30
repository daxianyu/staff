import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { SiteInfoResponse, updateApplication } from '@/services/modules/frontPage';

interface Props {
    data: SiteInfoResponse['application'];
    refresh: () => void;
}

const AdmissionEditor: React.FC<Props> = ({ data, refresh }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await updateApplication({
                content: values.content,
                class_control_url: values.class_control_url,
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
    const buttonClass = "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors border-none h-auto text-sm font-medium shadow-sm";

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Card
                title={<span className="text-lg font-semibold text-gray-800">入学申请设置</span>}
                variant="borderless"
                className="rounded-lg shadow-sm"
                styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        content: data.content,
                        class_control_url: data.class_control_url,
                    }}
                    onFinish={onFinish}
                >
                    <Form.Item
                        label="招生简章链接 (Rules Url)"
                        name="content"
                        tooltip="对应 menu_type=1"
                    >
                        <Input placeholder="请输入招生简章链接" className={inputClass} />
                    </Form.Item>

                    <Form.Item
                        label="班额控制链接 (Class Control Url)"
                        name="class_control_url"
                        tooltip="对应 menu_type=2"
                    >
                        <Input placeholder="请输入班额控制链接" className={inputClass} />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 32 }}>
                        <Button type="primary" htmlType="submit" loading={loading} block className={buttonClass}>
                            保存更改
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default AdmissionEditor;
