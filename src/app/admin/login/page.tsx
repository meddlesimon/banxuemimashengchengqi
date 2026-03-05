'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password }),
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('admin_user', JSON.stringify(data));
                router.push('/admin/dashboard');
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('连接服务器失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'radial-gradient(circle at top right, #f0fdf4, #dcfce7)' }}>
            <div className="glass-card" style={{ padding: '3rem', width: '100%', maxWidth: '450px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>管理后台登录</h2>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>管理账号</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="请输入管理员手机号"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>登录密码</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="请输入密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p style={{ color: 'var(--error)', textAlign: 'center' }}>{error}</p>}
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? '正在验证...' : '进入后台'}
                    </button>
                </form>
            </div>
        </div>
    );
}
