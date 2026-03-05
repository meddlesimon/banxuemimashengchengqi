'use client';

import { useState, useEffect } from 'react';

export default function ParentsPage() {
    const [parents, setParents] = useState<any[]>([]);
    const [newPhone, setNewPhone] = useState('');

    const fetchParents = () => {
        fetch('/api/admin/parents').then(res => res.json()).then(setParents);
    };

    useEffect(fetchParents, []);

    const addParent = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/admin/parents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        const newStatus = currentStatus === 'NORMAL' ? 'DISABLED' : 'NORMAL';
        await fetch('/api/admin/parents', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus }),
        });
        fetchParents();
    };

    const deleteParent = async (id: string) => {
        if (confirm('确定删除吗？')) {
            await fetch('/api/admin/parents', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            fetchParents();
        }
    };

    return (
        <div>
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h3>录入新学员</h3>
                <form onSubmit={addParent} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        className="input-field"
                        placeholder="家长手机号"
                        value={newPhone}
                        onChange={e => setNewPhone(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>添加白名单</button>
                </form>
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
                                        background: p.status === 'NORMAL' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                                        color: p.status === 'NORMAL' ? 'var(--success)' : 'var(--error)'
                                    }}>
                                        {p.status === 'NORMAL' ? '正常' : '已停用'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(p.created_at).toLocaleString()}</td>
                                <td style={{ padding: '1rem' }}>
                                    <button onClick={() => toggleStatus(p.id, p.status)} style={{ marginRight: '1rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        {p.status === 'NORMAL' ? '停用' : '启用'}
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
