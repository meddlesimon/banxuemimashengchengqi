'use client';

import { useState, useRef } from 'react';

export default function BackupPage() {
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<any>(null);
    const [importError, setImportError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExportJSON = () => {
        window.open('/api/admin/backup?format=json', '_blank');
    };

    const handleExportCSV = () => {
        window.open('/api/admin/backup?format=csv', '_blank');
    };

    const handleExportAccountsCSV = () => {
        window.open('/api/admin/backup?format=accounts_csv', '_blank');
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setImportResult(null);
        setImportError('');

        try {
            const text = await file.text();
            const json = JSON.parse(text);

            const res = await fetch('/api/admin/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(json),
            });

            const result = await res.json();
            if (!res.ok) {
                setImportError(result.message || '导入失败');
            } else {
                setImportResult(result);
            }
        } catch (err: any) {
            setImportError('文件解析失败：' + (err.message || '请检查文件格式'));
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const cardStyle: React.CSSProperties = {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid #1e293b',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
    };

    const btnStyle = (color: string): React.CSSProperties => ({
        padding: '12px 28px',
        borderRadius: '10px',
        border: 'none',
        background: color,
        color: 'white',
        fontWeight: '600',
        fontSize: '15px',
        cursor: 'pointer',
        marginRight: '12px',
        marginBottom: '12px',
        transition: 'opacity 0.2s',
    });

    return (
        <div style={{ maxWidth: '800px' }}>
            {/* 导出区 */}
            <div style={cardStyle}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '18px' }}>📤 数据导出</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '14px' }}>
                    将当前所有数据导出到本地文件，建议定期备份以防数据丢失。
                </p>

                <div>
                    <button style={btnStyle('#059669')} onClick={handleExportJSON}>
                        ⬇️ 全量备份 JSON
                    </button>
                    <button style={btnStyle('#0369a1')} onClick={handleExportCSV}>
                        📊 导出家长列表 CSV
                    </button>
                    <button style={btnStyle('#7c3aed')} onClick={handleExportAccountsCSV}>
                        📋 导出账号池 CSV
                    </button>
                </div>

                <div style={{
                    marginTop: '1rem',
                    padding: '12px 16px',
                    background: 'rgba(5,150,105,0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(5,150,105,0.2)',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                }}>
                    <strong style={{ color: '#6ee7b7' }}>全量 JSON</strong> — 包含家长注册信息、账号密码池、管理员账号、正式学员白名单、系统配置，用于完整恢复。
                    <br />
                    <strong style={{ color: '#93c5fd' }}>家长列表 CSV</strong> — 仅包含家长手机号和状态，可直接用 Excel 打开查看。
                    <br />
                    <strong style={{ color: '#c4b5fd' }}>账号池 CSV</strong> — 包含所有账号密码及状态，可直接用 Excel 打开查看。
                </div>
            </div>

            {/* 导入区 */}
            <div style={cardStyle}>
                <h3 style={{ color: '#f59e0b', marginBottom: '0.5rem', fontSize: '18px' }}>📥 数据导入恢复</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '14px' }}>
                    上传之前导出的 JSON 备份文件进行恢复。采用<strong style={{ color: '#fde68a' }}>安全合并</strong>策略：已存在的记录保留不覆盖，只补充数据库中缺失的数据。
                </p>

                <label style={{
                    display: 'inline-block',
                    padding: '12px 28px',
                    borderRadius: '10px',
                    background: importing ? '#374151' : '#b45309',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '15px',
                    cursor: importing ? 'not-allowed' : 'pointer',
                    marginBottom: '1rem',
                }}>
                    {importing ? '⏳ 正在导入...' : '📂 选择备份文件 (.json)'}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={handleImport}
                        disabled={importing}
                    />
                </label>

                {importError && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '8px',
                        color: '#fca5a5',
                        fontSize: '14px',
                        marginTop: '12px',
                    }}>
                        ❌ {importError}
                    </div>
                )}

                {importResult && (
                    <div style={{
                        padding: '16px',
                        background: 'rgba(5,150,105,0.1)',
                        border: '1px solid rgba(5,150,105,0.3)',
                        borderRadius: '8px',
                        marginTop: '12px',
                    }}>
                        <p style={{ color: '#6ee7b7', fontWeight: '600', marginBottom: '8px' }}>✅ 导入成功</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>{importResult.message}</p>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {[
                                { label: '家长数据', value: importResult.summary?.parents, color: '#34d399' },
                                { label: '账号密码', value: importResult.summary?.account_pool, color: '#60a5fa' },
                                { label: '管理员', value: importResult.summary?.admins, color: '#c084fc' },
                                { label: '正式学员', value: importResult.summary?.official_students, color: '#fbbf24' },
                                { label: '系统配置', value: importResult.summary?.system_config, color: '#94a3b8' },
                            ].map(item => (
                                <div key={item.label} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    textAlign: 'center',
                                    minWidth: '90px',
                                }}>
                                    <div style={{ color: item.color, fontWeight: '700', fontSize: '22px' }}>{item.value ?? 0}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{
                    marginTop: '1.5rem',
                    padding: '12px 16px',
                    background: 'rgba(251,191,36,0.07)',
                    borderRadius: '8px',
                    border: '1px solid rgba(251,191,36,0.2)',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                }}>
                    ⚠️ 注意：导入仅支持由本系统导出的 JSON 格式文件；导入不会覆盖已有数据，只补充缺失记录；超级管理员账号不会被导入覆盖。
                </div>
            </div>
        </div>
    );
}
