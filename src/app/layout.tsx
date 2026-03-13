import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';

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
            <body>
                {children}
                <Script
                    src="https://ssl.captcha.qq.com/TCaptcha.js"
                    strategy="beforeInteractive"
                />
            </body>
        </html>
    );
}
