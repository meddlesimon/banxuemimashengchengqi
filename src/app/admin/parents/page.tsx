'use client';

import { useState, useEffect, useRef } from 'react';

export default function ParentsPage() {
    const [parents, setParents] = useState<any[]>([]);
    const [newPhone, setNewPhone] = useState('');
    const [csvImporting, setCsvImporting] = useState(false);
    const [csvResult, setCsvResult] = useState<{ success: number; fail: number; errors: string[] } | null>(null);
    const csvInputRef = useRef<HTMLInputElement>(null);

    const fetchParents = () => {
        fetch('/api/admin/parents', { credentials: 'include' })
            .then(res => res.ok ? res.json() : [])
            .then(data => Array.isArray(data) && setParents(data));
    };

    useEffect(fetchParents, []);

    const addParent = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/admin/parents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ phone: newPhone }),
        });
        if (res.ok) {
            setNewPhone('');
            fetchParents();
        } else {
            alert((await res.json()).message);
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        // 如果当前是已开通，则切换为停用；否则（待审核或已停用）一律切换为已开通
        const newStatus = currentStatus === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
        await fetch('/api/admin/parents', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id, status: newStatus }),
        });
        fetchParents();
    };

    const deleteParent = async (id: string) => {
        if (confirm('确定删除吗？')) {
            await fetch('/api/admin/parents', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id }),
            });
            fetchParents();
        }
    };

    const downloadTemplate = () => {
        const csv = '手机号\n13800138000\n13900139000';
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'parents_import_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCsvImporting(true);
        setCsvResult(null);

        try {
            const text = await file.text();
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            // 跳过标题行（如果首行不是手机号格式）
            const dataLines = lines.filter(l => /^\d{10,11}/.test(l.replace(/^["']/, '')));

            let success = 0;
            const errors: string[] = [];

            for (const line of dataLines) {
                // 取第一列（兼容带引号的 CSV）
                const phone = line.split(',')[0].replace(/^["']|["']$/g, '').trim();
                if (!phone) continue;
                const res = await fetch('/api/admin/parents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ phone }),
                });
                if (res.ok) {
                    success++;
                } else {
                    const j = await res.json().catch(() => ({}));
                    errors.push(`${phone}：${j.message || '失败'}`);
                }
            }

            setCsvResult({ success, fail: errors.length, errors });
            fetchParents();
        } catch (err: any) {
            setCsvResult({ success: 0, fail: 1, errors: ['文件解析失败：' + (err.message || '请检查文件格式')] });
        } finally {
            setCsvImporting(false);
            if (csvInputRef.current) csvInputRef.current.value = '';
        }
    };

    return (
        <div>
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h3>录入新学员</h3>
                <form onSubmit={addParent} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <input
                        className="input-field"
                        placeholder="家长手机号"
                        value={newPhone}
                        onChange={e => setNewPhone(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>添加白名单</button>
                </form>

                {/* CSV 批量导入 */}
                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '1rem' }}>
                        批量导入：CSV 文件第一列为手机号，每行一个，支持有/无标题行。
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                            onClick={downloadTemplate}
                            style={{
                                padding: '9px 20px', borderRadius: '8px', border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)',
                                fontSize: '14px', cursor: 'pointer',
                            }}
                        >
                            📄 下载导入模板
                        </button>
                        <label style={{
                            padding: '9px 20px', borderRadius: '8px', border: 'none',
                            background: csvImporting ? '#374151' : '#0369a1',
                            color: 'white', fontSize: '14px', fontWeight: '600',
                            cursor: csvImporting ? 'not-allowed' : 'pointer',
                        }}>
                            {csvImporting ? '⏳ 导入中...' : '📥 批量导入 CSV'}
                            <input
                                ref={csvInputRef}
                                type="file"
                                accept=".csv"
                                style={{ display: 'none' }}
                                onChange={handleCsvImport}
                                disabled={csvImporting}
                            />
                        </label>
                    </div>

                    {csvResult && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '12px 16px',
                            background: csvResult.fail === 0 ? 'rgba(5,150,105,0.1)' : 'rgba(245,158,11,0.1)',
                            border: `1px solid ${csvResult.fail === 0 ? 'rgba(5,150,105,0.3)' : 'rgba(245,158,11,0.3)'}`,
                            borderRadius: '8px',
                            fontSize: '14px',
                        }}>
                            <span style={{ color: '#6ee7b7' }}>✅ 成功 {csvResult.success} 条</span>
                            {csvResult.fail > 0 && (
                                <>
                                    <span style={{ color: '#fcd34d', marginLeft: '16px' }}>⚠️ 失败 {csvResult.fail} 条</span>
                                    <ul style={{ marginTop: '8px', paddingLeft: '1.2rem', color: '#fca5a5', fontSize: '13px' }}>
                                        {csvResult.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                                        {csvResult.errors.length > 10 && <li>...等 {csvResult.errors.length - 10} 条</li>}
                                    </ul>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                            <th style={{ padding: '1rem' }}>手机号</th>
                            <th style={{ padding: '1rem' }}>当前状态</th>
                            <th style={{ padding: '1rem' }}>创建时间</th>
                            <th style={{ padding: '1rem' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parents.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '1rem' }}>{p.phone}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        background: p.status === 'ACTIVE' ? 'rgba(16,185,129,0.2)' : (p.status === 'PENDING' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'),
                                        color: p.status === 'ACTIVE' ? 'var(--success)' : (p.status === 'PENDING' ? '#d97706' : 'var(--error)')
                                    }}>
                                        {p.status === 'ACTIVE' ? '已开通' : (p.status === 'PENDING' ? '待审核' : '已停用')}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(p.created_at).toLocaleString()}</td>
                                <td style={{ padding: '1rem' }}>
                                    <button onClick={() => toggleStatus(p.id, p.status)} style={{ marginRight: '1rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        {p.status === 'ACTIVE' ? '停用' : '启用/开通'}
                                    </button>
                                    <button onClick={() => deleteParent(p.id)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>删除</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
