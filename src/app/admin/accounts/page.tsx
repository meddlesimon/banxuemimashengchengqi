'use client';

import { useState, useEffect } from 'react';

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [importing, setImporting] = useState(false);

    const fetchAccounts = () => {
        fetch('/api/admin/accounts').then(res => res.json()).then(setAccounts);
    };

    useEffect(fetchAccounts, []);

    const addAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/admin/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
            setUsername('');
            setPassword('');
            fetchAccounts();
        }
    };

    const deleteAccount = async (id: string) => {
        if (!confirm('确定删除此账号吗？')) return;
        await fetch('/api/admin/accounts', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        fetchAccounts();
    };

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const data = lines
                .map(line => {
                    const [u, p] = line.split(',').map(s => s.trim());
                    return u && p ? { username: u, password: p } : null;
                })
                .filter(item => item !== null);

            if (data.length === 0) {
                alert('未检测到有效数据，请检查 CSV 格式 (账号,密码)');
                setImporting(false);
                return;
            }

            const res = await fetch('/api/admin/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                alert(`成功导入 ${data.length} 个账号`);
                fetchAccounts();
            } else {
                alert('导入失败，请重试');
            }
            setImporting(false);
            e.target.value = ''; // Reset input
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const csvContent = "账号,密码\nuser_demo_001,pwd123456\nuser_demo_002,abc789789";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "账号导入模板.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <h3>账号池管理</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={downloadTemplate}
                            className="btn-primary"
                            style={{ background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '8px 16px' }}
                        >
                            📄 下载模板
                        </button>
                        <input
                            type="file"
                            id="csvInput"
                            accept=".csv"
                            style={{ display: 'none' }}
                            onChange={handleCSVUpload}
                        />
                        <button
                            onClick={() => document.getElementById('csvInput')?.click()}
                            className="btn-primary"
                            style={{ background: 'var(--glass)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '8px 16px' }}
                            disabled={importing}
                        >
                            {importing ? '解析中...' : '📥 批量导入 CSV'}
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '10px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    💡 <strong>CSV 格式提示：</strong> 每行一条数据，格式为 <code>账号,密码</code> (例如: <code>user001,pwd123</code>)
                </div>

                <form onSubmit={addAccount} style={{ display: 'flex', gap: '1rem' }}>
                    <input className="input-field" placeholder="单条账号" value={username} onChange={e => setUsername(e.target.value)} required />
                    <input className="input-field" placeholder="对应密码" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>手动添加</button>
                </form>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                            <th style={{ padding: '1rem' }}>账号</th>
                            <th style={{ padding: '1rem' }}>密码</th>
                            <th style={{ padding: '1rem' }}>加入时间</th>
                            <th style={{ padding: '1rem' }}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>账号池空空如也</td>
                            </tr>
                        ) : (
                            accounts.map(a => (
                                <tr key={a.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>{a.username}</td>
                                    <td style={{ padding: '1rem' }}>{a.password}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date(a.created_at).toLocaleString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <button onClick={() => deleteAccount(a.id)} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>删除</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
