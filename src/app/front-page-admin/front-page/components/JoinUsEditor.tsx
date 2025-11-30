import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { SiteInfoResponse, updateJoinUs } from '@/services/modules/frontPage';

interface Props {
    data: SiteInfoResponse['join_us'];
    refresh: () => void;
}

const JoinUsEditor: React.FC<Props> = ({ data, refresh }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await updateJoinUs({
                content: values.content,
                operation_content: values.operation_content,
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
                title={<span className="text-lg font-semibold text-gray-800">加入我们设置</span>}
                variant="borderless"
                className="rounded-lg shadow-sm"
                styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        content: data.content,
                        operation_content: data.operation_content,
                    }}
                    onFinish={onFinish}
                >
                    <Form.Item
                        label="教学岗位链接 (Teaching Position)"
                        name="content"
                        tooltip="对应 post_type=1"
                    >
                        <Input placeholder="请输入教学岗位链接" className={inputClass} />
                    </Form.Item>

                    <Form.Item
                        label="运营岗位链接 (Operation Position)"
                        name="operation_content"
                        tooltip="对应 post_type=2"
                    >
                        <Input placeholder="请输入运营岗位链接" className={inputClass} />
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

export default JoinUsEditor;
