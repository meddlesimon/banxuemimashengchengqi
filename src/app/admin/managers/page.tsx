'use client';

import { useState, useEffect } from 'react';

export default function ManagersPage() {
    const [admins, setAdmins] = useState<any[]>([]);
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    const fetchAdmins = () => {
        fetch('/api/admin/managers').then(res => res.json()).then(setAdmins);
    };

    useEffect(fetchAdmins, []);

    const addAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/admin/managers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password }),
        });
        if (res.ok) {
            setPhone('');
            setPassword('');
            fetchAdmins();
        }
    };

    const deleteAdmin = async (id: string) => {
        await fetch('/api/admin/managers', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        fetchAdmins();
    };

    return (
        <div>
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <h3>分配普通管理员账号</h3>
                <form onSubmit={addAdmin} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <input className="input-field" placeholder="管理员手机号" value={phone} onChange={e => setPhone(e.target.value)} required />
                    <input className="input-field" placeholder="登录密码" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>创建管理员</button>
                </form>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                            <th style={{ padding: '1rem' }}>账号</th>
                            <th style={{ padding: '1rem' }}>角色</th>
                            <th style={{ padding: '1rem' }}>创建时间</th>
                            <th style={{ padding: '1rem' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.map(a => (
                            <tr key={a.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '1rem' }}>{a.phone}</td>
                                <td style={{ padding: '1rem' }}>{a.role}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(a.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: '1rem' }}>
                                    <button onClick={() => deleteAdmin(a.id)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}>删除</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
