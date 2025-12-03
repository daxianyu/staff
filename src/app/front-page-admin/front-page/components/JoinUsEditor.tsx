'use client';

import React, { useState } from 'react';
import { Form, Button, Card, message } from 'antd';
import dynamic from 'next/dynamic';
import { SiteInfoResponse, updateJoinUs } from '@/services/modules/frontPage';

// 动态导入 ReactQuill，避免 SSR 问题
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

interface Props {
    data: SiteInfoResponse['join_us'];
    refresh: () => void;
}

const JoinUsEditor: React.FC<Props> = ({ data, refresh }) => {
    const [teachingForm] = Form.useForm();
    const [operationForm] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const buttonClass = "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors border-none h-auto text-sm font-medium shadow-sm hover:shadow-md transition-shadow";

    // 富文本编辑器配置
    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
        ],
    };

    const quillFormats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list',
        'color', 'background',
        'align',
        'link', 'image'
    ];

    // 教学岗位
    const onTeachingFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await updateJoinUs({
                content: values.content,
                operation_content: data.operation_content, // 保持运营岗位内容不变
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

    // 运营岗位
    const onOperationFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await updateJoinUs({
                content: data.content, // 保持教学岗位内容不变
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

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* 教学岗位 */}
            <Card
                title={<span className="text-lg font-semibold text-gray-800">教学岗位</span>}
                variant="borderless"
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
                    form={teachingForm}
                    layout="vertical"
                    initialValues={{
                        content: data.content || '',
                    }}
                    onFinish={onTeachingFinish}
                    className="space-y-4"
                >
                    <Form.Item
                        label={<span className="text-sm font-medium text-gray-700">内容</span>}
                        name="content"
                        rules={[{ required: true, message: '请输入内容' }]}
                    >
                        <ReactQuill
                            theme="snow"
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="请输入教学岗位内容..."
                            style={{ minHeight: '300px' }}
                            className="[&_.ql-editor]:min-h-[300px] [&_.ql-container]:rounded-md [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:border-gray-300"
                        />
                    </Form.Item>
                    <Form.Item className="mb-0">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className={`${buttonClass} h-11 text-base font-medium`}
                        >
                            {loading ? '保存中...' : '保存教学岗位'}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {/* 运营岗位 */}
            <Card
                title={<span className="text-lg font-semibold text-gray-800">运营岗位</span>}
                variant="borderless"
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
                    form={operationForm}
                    layout="vertical"
                    initialValues={{
                        operation_content: data.operation_content || '',
                    }}
                    onFinish={onOperationFinish}
                    className="space-y-4"
                >
                    <Form.Item
                        label={<span className="text-sm font-medium text-gray-700">内容</span>}
                        name="operation_content"
                        rules={[{ required: true, message: '请输入内容' }]}
                    >
                        <ReactQuill
                            theme="snow"
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="请输入运营岗位内容..."
                            style={{ minHeight: '300px' }}
                            className="[&_.ql-editor]:min-h-[300px] [&_.ql-container]:rounded-md [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:border-gray-300"
                        />
                    </Form.Item>
                    <Form.Item className="mb-0">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className={`${buttonClass} h-11 text-base font-medium`}
                        >
                            {loading ? '保存中...' : '保存运营岗位'}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default JoinUsEditor;
