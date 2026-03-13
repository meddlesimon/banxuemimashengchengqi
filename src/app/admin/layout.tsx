'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [admin, setAdmin] = useState<any>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const userJson = localStorage.getItem('admin_user');
        if (!userJson && pathname !== '/admin/login') {
            router.push('/admin/login');
        } else if (userJson) {
            setAdmin(JSON.parse(userJson));
        }
    }, [pathname, router]);

    if (!admin && pathname !== '/admin/login') return null;

    const NavItem = ({ href, label, hide }: { href: string; label: string; hide?: boolean }) => {
        if (hide) return null;
        const active = pathname === href;
        return (
            <Link href={href} style={{
                padding: '12px 20px',
                borderRadius: '10px',
                background: active ? 'var(--primary)' : 'transparent',
                color: active ? 'white' : 'var(--text-muted)',
                marginBottom: '8px',
                display: 'block'
            }}>
                {label}
            </Link>
        );
    };

    if (pathname === '/admin/login') return <>{children}</>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
            {/* Sidebar */}
            <aside style={{ width: '260px', borderRight: '1px solid #e2e8f0', padding: '2rem 1.5rem', background: 'rgba(16, 185, 129, 0.03)' }}>
                <h3 style={{ marginBottom: '2.5rem', color: 'var(--primary)', fontWeight: '700' }}>伴学管理后台</h3>
                <nav>
                    <NavItem href="/admin/dashboard" label="📊 状态概览" />
                    <NavItem href="/admin/parents" label="👥 学员白名单" />
                    <NavItem href="/admin/accounts" label="🔑 账号池管理" />
                    <NavItem href="/admin/managers" label="🛡️ 管理员管理" hide={admin?.role !== 'SUPER_ADMIN'} />
                </nav>
                <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
                    <button
                        onClick={async () => {
                            await fetch('/api/admin/logout', { method: 'POST' });
                            localStorage.removeItem('admin_user');
                            router.push('/admin/login');
                        }}
                        style={{ width: '100%', background: 'var(--error)', padding: '10px', borderRadius: '10px', border: 'none', color: 'white', cursor: 'pointer' }}
                    >
                        退出登录
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
                <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>{pathname === '/admin/dashboard' ? '状态概览' : pathname.split('/').pop()?.toUpperCase()}</h2>
                    <div style={{ color: 'var(--text-muted)' }}>
                        当前用户: <span style={{ color: 'var(--text)' }}>{admin?.phone}</span> ({admin?.role === 'SUPER_ADMIN' ? '超级管理员' : '管理员'})
                    </div>
                </header>
                {children}
            </main>
        </div>
    );
}
