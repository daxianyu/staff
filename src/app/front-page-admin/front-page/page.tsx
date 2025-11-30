'use client';

import React, { useEffect, useState } from 'react';
import { Card, Layout, Menu, message, Spin, Typography } from 'antd';
import {
    AppstoreOutlined,
    PictureOutlined,
    InfoCircleOutlined,
    TeamOutlined,
    NotificationOutlined,
    TrophyOutlined,
    FormOutlined,
    UserAddOutlined,
    BgColorsOutlined,
} from '@ant-design/icons';
import { getSiteInfo, SiteInfoResponse } from '@/services/modules/frontPage';
import HomePageEditor from './components/HomePageEditor';
import HomeCarouselEditor from './components/HomeCarouselEditor';
import AboutUsEditor from './components/AboutUsEditor';
import TeachersEditor from './components/TeachersEditor';
import CampusNewsEditor from './components/CampusNewsEditor';
import AchievementsEditor from './components/AchievementsEditor';
import AdmissionEditor from './components/AdmissionEditor';
import JoinUsEditor from './components/JoinUsEditor';
import BannerSettingsEditor from './components/BannerSettingsEditor';

const { Sider, Content } = Layout;
const { Title } = Typography;

const FrontPageAdmin = () => {
    const [loading, setLoading] = useState(false);
    const [siteInfo, setSiteInfo] = useState<SiteInfoResponse | null>(null);
    const [activeKey, setActiveKey] = useState('home_page');

    const fetchSiteInfo = async () => {
        setLoading(true);
        try {
            const res = await getSiteInfo();
            if (res.code === 200 && res.data) {
                setSiteInfo(res.data);
            } else {
                message.error(res.message || '获取配置信息失败');
            }
        } catch (error) {
            message.error('获取配置信息失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSiteInfo();
    }, []);

    const menuItems = [
        { key: 'home_page', icon: <AppstoreOutlined />, label: '主页' },
        { key: 'home_carousel', icon: <PictureOutlined />, label: '主页轮播' },
        { key: 'about_us', icon: <InfoCircleOutlined />, label: '关于我们' },
        { key: 'teachers', icon: <TeamOutlined />, label: '师资团队' },
        { key: 'campus_news', icon: <NotificationOutlined />, label: '校区动态' },
        { key: 'achievements', icon: <TrophyOutlined />, label: '教学成果' },
        { key: 'admission', icon: <FormOutlined />, label: '入学申请' },
        { key: 'join_us', icon: <UserAddOutlined />, label: '加入我们' },
        { key: 'banners', icon: <BgColorsOutlined />, label: 'Banner设置' },
    ];

    const renderContent = () => {
        if (!siteInfo) return null;

        switch (activeKey) {
            case 'home_page':
                return <HomePageEditor data={siteInfo.home_page} refresh={fetchSiteInfo} />;
            case 'home_carousel':
                return <HomeCarouselEditor data={siteInfo.home_carousel} refresh={fetchSiteInfo} />;
            case 'about_us':
                return <AboutUsEditor data={siteInfo.about_us} refresh={fetchSiteInfo} />;
            case 'teachers':
                return <TeachersEditor data={siteInfo.teachers} refresh={fetchSiteInfo} />;
            case 'campus_news':
                return <CampusNewsEditor data={siteInfo.campus_news} refresh={fetchSiteInfo} />;
            case 'achievements':
                return <AchievementsEditor data={siteInfo.achievements} refresh={fetchSiteInfo} />;
            case 'admission':
                return <AdmissionEditor data={siteInfo.application} refresh={fetchSiteInfo} />;
            case 'join_us':
                return <JoinUsEditor data={siteInfo.join_us} refresh={fetchSiteInfo} />;
            case 'banners':
                return <BannerSettingsEditor data={siteInfo.banners} refresh={fetchSiteInfo} />;
            default:
                return <div>Select a section</div>;
        }
    };

    return (
        <Layout style={{ minHeight: '100%', background: '#fff' }}>
            <Sider width={200} theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                    <Title level={5} style={{ margin: 0 }}>官网配置</Title>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[activeKey]}
                    style={{ height: '100%', borderRight: 0 }}
                    items={menuItems}
                    onClick={({ key }) => setActiveKey(key)}
                    className="[&_.ant-menu-item-icon]:mr-2"
                />
            </Sider>
            <Layout style={{ padding: '24px' }}>
                <Content
                    style={{
                        background: '#fff',
                        padding: 24,
                        margin: 0,
                        minHeight: 280,
                        borderRadius: '8px',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                    }}
                >
                    {loading && !siteInfo ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        renderContent()
                    )}
                </Content>
            </Layout>
        </Layout>
    );
};

export default FrontPageAdmin;
