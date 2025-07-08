'use client';

import "./globals.css";
import ClientLayout from "./components/ClientLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotifyProvider } from "@/components/Notify";
import { ENV } from '@/config/env'
import { ApiDebugger } from '@/components/ApiDebugger'
import PermissionDebugger from '@/components/PermissionDebugger'
import MenuDebugger from '@/components/MenuDebugger'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <head>
        <title>课程管理系统</title>
        <script defer src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
        <meta name="description" content="课程管理系统" />
      </head>
      <body>
        <AuthProvider>
          <NotifyProvider>
            <ClientLayout>{children}</ClientLayout>
            <PermissionDebugger />
            <MenuDebugger />
          </NotifyProvider>
        </AuthProvider>
        {ENV.enableApiDebugger && <ApiDebugger />}
      </body>
    </html>
  );
}
