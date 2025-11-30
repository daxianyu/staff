import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Card } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { SiteInfoResponse, newAchievements, deleteAchievements, updateGraduationInfo, updateTechInfo } from '@/services/modules/frontPage';

interface Props {
    data: SiteInfoResponse['achievements'];
    refresh: () => void;
}

const AchievementsEditor: React.FC<Props> = ({ data, refresh }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [infoForm] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleDelete = async (id: number) => {
        Modal.confirm({
            title: '确认删除?',
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

    const handleAdd = () => {
        form.resetFields();
        setIsModalVisible(true);
    };

    const onAddFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await newAchievements({ link_url: values.link_url });
            if (res.code === 200) {
                message.success('添加成功');
                refresh();
                setIsModalVisible(false);
            } else {
                message.error(res.message || '添加失败');
            }
        } catch (error) {
            message.error('添加失败');
        } finally {
            setLoading(false);
        }
    };

    const onInfoFinish = async (values: any) => {
        setLoading(true);
        try {
            // Update Graduation Info
            if (values.graduation_info !== data.graduation_info) {
                await updateGraduationInfo({ content: values.graduation_info });
            }
            // Update Tech Info
            if (values.tech_info !== data.tech_info) {
                await updateTechInfo({ content: values.tech_info });
            }
            message.success('配置更新成功');
            refresh();
        } catch (error) {
            message.error('配置更新失败');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-colors";
    const buttonClass = "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors border-none h-auto text-sm font-medium shadow-sm hover:shadow-md transition-shadow";

    const columns = [
        {
            title: <span className="text-sm font-medium text-gray-700">标题</span>,
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: <span className="text-sm font-medium text-gray-700">链接</span>,
            dataIndex: 'link_url',
            key: 'link_url',
            ellipsis: { showTitle: true },
            render: (text: string) => (
                <span className="text-sm text-gray-600">{text || <span className="text-gray-400">无链接</span>}</span>
            ),
        },
        {
            title: <span className="text-sm font-medium text-gray-700">操作</span>,
            key: 'action',
            width: 100,
            render: (_: any, record: any) => (
                <Button 
                    type="text" 
                    icon={<DeleteOutlined />} 
                    danger 
                    onClick={() => handleDelete(record.id)} 
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
                >
                    删除
                </Button>
            ),
        },
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Card
                title={<span className="text-lg font-semibold text-gray-800">成果链接配置</span>}
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
                    form={infoForm}
                    layout="vertical"
                    initialValues={{
                        graduation_info: data.graduation_info,
                        tech_info: data.tech_info
                    }}
                    onFinish={onInfoFinish}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item 
                            label={<span className="text-sm font-medium text-gray-700">毕业去向链接</span>} 
                            name="graduation_info"
                        >
                            <Input placeholder="请输入毕业去向链接" className={inputClass} />
                        </Form.Item>
                        <Form.Item 
                            label={<span className="text-sm font-medium text-gray-700">学术成果链接</span>} 
                            name="tech_info"
                        >
                            <Input placeholder="请输入学术成果链接" className={inputClass} />
                        </Form.Item>
                    </div>
                    <Form.Item className="mb-0 mt-6">
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={loading} 
                            className={`${buttonClass} h-11 text-base font-medium`}
                        >
                            {loading ? '保存中...' : '保存配置'}
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            <Card
                title={<span className="text-lg font-semibold text-gray-800">教学成果列表</span>}
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
                extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className={buttonClass}>
                        添加成果
                    </Button>
                }
            >
                {data.list && data.list.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-sm mb-4">暂无教学成果</div>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={handleAdd}
                            className={buttonClass}
                        >
                            添加第一条成果
                        </Button>
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

            <Modal
                title={<span className="text-lg font-semibold text-gray-800">添加教学成果</span>}
                open={isModalVisible}
                onOk={() => form.submit()}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={loading}
                width={600}
                centered
                okButtonProps={{ 
                    className: "bg-blue-600 hover:bg-blue-700 h-10 px-6 font-medium shadow-sm hover:shadow-md transition-shadow"
                }}
                cancelButtonProps={{
                    className: "h-10 px-6"
                }}
                styles={{
                    header: {
                        borderBottom: '1px solid #e5e7eb',
                        padding: '16px 20px'
                    },
                    body: {
                        padding: '20px'
                    },
                    footer: {
                        borderTop: '1px solid #e5e7eb',
                        padding: '12px 20px'
                    }
                }}
            >
                <Form form={form} layout="vertical" onFinish={onAddFinish} className="space-y-4">
                    <Form.Item 
                        name="link_url" 
                        label={<span className="text-sm font-medium text-gray-700">成果链接</span>} 
                        rules={[{ required: true, message: '请输入成果链接' }]}
                    >
                        <Input placeholder="请输入成果链接" className={inputClass} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default AchievementsEditor;
