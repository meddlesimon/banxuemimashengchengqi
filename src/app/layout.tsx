import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '伴学APP账号分发系统',
    description: '高效、公平的共享账号管理平台',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-CN">
            <body>{children}</body>
        </html>
    );
}
