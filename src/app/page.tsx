import Link from 'next/link';

export default function Home() {
    return (
        <main style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: '2rem',
            padding: '2rem',
            background: 'radial-gradient(circle at top right, #f0fdf4, #dcfce7)'
        }}>
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, #10b981, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    伴学系统入口
                </h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>欢迎使用伴学APP账号分发平台，请选择您的身份登录系统。</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Link href="/parent" className="btn-primary" style={{ padding: '1.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>家长入口 (移动端)</span>
                    </Link>
                    <Link href="/admin/login" className="btn-primary" style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', padding: '1.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>管理后台 (PC端)</span>
                    </Link>
                </div>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                © 2024 伴学APP分发系统
            </div>
        </main>
    );
}
