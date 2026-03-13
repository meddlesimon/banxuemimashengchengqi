'use client';

import { useState, useEffect } from 'react';

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [ttlHours, setTtlHours] = useState(1);
    const [ttlMinutes, setTtlMinutes] = useState(30);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetch('/api/admin/dashboard')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                if (data.config && typeof data.config.ttlMinutes === 'number') {
                    setTtlHours(Math.floor(data.config.ttlMinutes / 60));
                    setTtlMinutes(data.config.ttlMinutes % 60);
                }
            });
    }, []);

    const handleSaveConfig = async () => {
        setIsSaving(true);
        const totalMinutes = (parseInt(ttlHours as any) || 0) * 60 + (parseInt(ttlMinutes as any) || 0);
        try {
            const res = await fetch('/api/admin/dashboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ttlMinutes: totalMinutes }),
            });
            if (res.ok) {
                alert('配置保存成功！');
            } else {
                alert('保存失败，请重试');
            }
        } catch (error) {
            console.error(error);
            alert('网络错误');
        } finally {
            setIsSaving(false);
        }
    };

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

            <div className="glass-card" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
                <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1rem' }}>⚙️ 防刷记忆时间配置</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label>小时:</label>
                        <input 
                            type="number" 
                            min="0"
                            value={ttlHours}
                            onChange={(e) => setTtlHours(parseInt(e.target.value))}
                            style={{ 
                                padding: '0.5rem', 
                                borderRadius: '5px', 
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'var(--text)',
                                width: '80px'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label>分钟:</label>
                        <input 
                            type="number" 
                            min="0" 
                            max="59"
                            value={ttlMinutes}
                            onChange={(e) => setTtlMinutes(parseInt(e.target.value))}
                            style={{ 
                                padding: '0.5rem', 
                                borderRadius: '5px', 
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'var(--text)',
                                width: '80px'
                            }}
                        />
                    </div>
                    <button 
                        onClick={handleSaveConfig}
                        disabled={isSaving}
                        className="btn-primary"
                        style={{ padding: '0.5rem 1.5rem' }}
                    >
                        {isSaving ? '保存中...' : '保存配置'}
                    </button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        (当前总时长: {((parseInt(ttlHours as any) || 0) * 60 + (parseInt(ttlMinutes as any) || 0))} 分钟)
                    </span>
                </div>
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    * 只要在这个时间内，同一个家长看到的账号密码是固定的。超时后才会分配新账号。
                </p>
            </div>

            <div className="glass-card" style={{ padding: '2rem', gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📊 账号分发状态概览</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                        (共 {stats.accounts?.length || 0} 个有效账号，当前发号至第 {stats.pointer + 1} 个)
                    </span>
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem' }}>分发顺序</th>
                                <th style={{ padding: '1rem' }}>账号</th>
                                <th style={{ padding: '1rem' }}>密码</th>
                                <th style={{ padding: '1rem' }}>分配给家长</th>
                                <th style={{ padding: '1rem' }}>最新发放时间</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.accounts?.map((acc: any, index: number) => {
                                const isCurrent = index === stats.pointer;
                                return (
                                    <tr key={acc.id} style={{ 
                                        borderBottom: '1px solid var(--glass-border)',
                                        background: isCurrent ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        transition: 'background 0.3s ease'
                                    }}>
                                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {isCurrent ? (
                                                <span style={{ fontSize: '1.5rem' }}>👉</span>
                                            ) : (
                                                <span style={{ width: '1.5rem', display: 'inline-block' }}></span>
                                            )}
                                            <span style={{ 
                                                color: isCurrent ? 'var(--primary)' : 'var(--text-muted)',
                                                fontWeight: isCurrent ? 'bold' : 'normal'
                                            }}>
                                                No.{index + 1}
                                            </span>
                                            {isCurrent && <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>当前位置</span>}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{acc.username}</td>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{acc.password}</td>
                                        <td style={{ padding: '1rem', color: acc.assigned_parents ? 'var(--text)' : 'var(--text-muted)' }}>
                                            {acc.assigned_parents || '-'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {acc.last_sent_at ? (
                                                <span style={{ color: 'var(--success)' }}>
                                                    {new Date(acc.last_sent_at).toLocaleString()}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>尚未发放</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!stats.accounts || stats.accounts.length === 0) && (
                                <tr>
                                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        暂无有效账号，请前往“账号池管理”添加
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
