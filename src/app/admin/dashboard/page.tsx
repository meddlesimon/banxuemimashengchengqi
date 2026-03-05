'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetch('/api/admin/dashboard')
            .then(res => res.json())
            .then(data => setStats(data));
    }, []);

    if (!stats) return <div>加载中...</div>;

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '暂无数据（第一圈运行中）';
        const d = Math.floor(seconds / (24 * 3600));
        const h = Math.floor((seconds % (24 * 3600)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${d}天 ${h}小时 ${m}分钟`;
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1rem' }}>账号池总容量</h3>
                <p style={{ fontSize: '3rem', fontWeight: 'bold' }}>{stats.totalAccounts}</p>
                <p style={{ marginTop: '1rem', color: 'var(--success)', fontSize: '0.9rem' }}>● 系统运行正常</p>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1rem' }}>当前发号指针位置</h3>
                <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.pointer + 1}</p>
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {stats.totalAccounts > 0 ? `完成率: ${Math.round(((stats.pointer + 1) / stats.totalAccounts) * 100)}%` : '池子为空'}
                </p>
            </div>

            <div className="glass-card" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
                <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1rem' }}>单圈平均遍历耗时 (Cycle Time)</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{formatDuration(stats.lastCycleDuration)}</p>
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--glass)', borderRadius: '10px' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        💡 <span style={{ color: 'var(--text)' }}>负载建议：</span>
                        如果一圈遍历时间少于 1 天，说明账号共享频率极高，建议增加账号池容量以保护账号不被封禁；
                        如果时间超过 7 天，说明账号冗余度较高。
                    </p>
                </div>
            </div>
        </div>
    );
}
