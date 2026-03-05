'use client';

import { useState, useEffect, useRef } from 'react';

export default function ParentPage() {
    const [step, setStep] = useState(1); // 1: login, 2: account
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('666666'); // 默认填充万能密码
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [account, setAccount] = useState<any>(null);
    const [countdown, setCountdown] = useState(0);

    // 维护倒计时定时器
    useEffect(() => {
        let timer: any;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const [captchaParam, setCaptchaParam] = useState('');
    const [captchaInstance, setCaptchaInstance] = useState<any>(null);
    const phoneRef = useRef(phone);

    useEffect(() => {
        phoneRef.current = phone;
    }, [phone]);

    // 移除所有验证码相关 logic
    useEffect(() => {
        // 清理旧代码残余
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/parent/get-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code }), // 此处使用 code 状态存储密码
            });
            const data = await res.json();

            if (res.ok) {
                setAccount(data);
                setStep(2);
            } else {
                setError(data.message || '登录失败，请检查手机号或密码');
            }
        } catch (err) {
            setError('网络繁忙，请稍后再试');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                alert('复制成功');
            } else {
                throw new Error('Clipboard API unavailable');
            }
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                alert('复制成功');
            } catch (copyErr) {
                alert('复制失败，请手动长按选择复制');
            }
            document.body.removeChild(textArea);
        }
    };

    if (step === 1) {
        return (
            <div className="mobile-container">
                <div className="glass-card" style={{ padding: '2rem', width: '90%', maxWidth: '400px' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>家长快捷查询</h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                        请输入手机号进行账号查询
                    </p>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>手机号</label>
                            <input
                                type="tel"
                                className="input-field"
                                placeholder="请输入您的手机号"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>查询密码</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="默认密码 666666"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                            />
                            <div style={{ marginTop: '0.8rem', padding: '10px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '8px', border: '1px dashed var(--primary)' }}>
                                <p style={{ fontSize: '0.8rem', color: 'var(--primary)', margin: 0, textAlign: 'center' }}>
                                    💡 快速测试：输入任意手机号，密码填 <b>666666</b> 即可
                                </p>
                            </div>
                        </div>
                        {error && (
                            <div style={{ padding: '10px', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fda4af' }}>
                                <p style={{ color: '#e11d48', textAlign: 'center', fontSize: '0.85rem', margin: 0 }}>{error}</p>
                            </div>
                        )}
                        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
                            {loading ? '正在查询系统...' : '立即登录查询'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="mobile-container">
            <div className="glass-card" style={{ padding: '2rem', width: '90%', maxWidth: '400px', textAlign: 'center' }}>
                <h3 style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>✅ 获取成功</h3>

                <div style={{ background: 'var(--glass)', padding: '1.5rem', borderRadius: '15px', marginBottom: '2rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>伴学APP账号</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{account.username}</p>
                        <button onClick={() => copyToClipboard(account.username)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '1rem', padding: '5px' }}>复制账号</button>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>登录密码</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{account.password}</p>
                        <button onClick={() => copyToClipboard(account.password)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '1rem', padding: '5px' }}>复制密码</button>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem', padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px' }}>
                    <p style={{ color: 'var(--primary)', fontSize: '1rem', fontWeight: '500' }}>
                        如果遇到登录问题，请联系班主任老师
                    </p>
                </div>

                <button onClick={() => window.location.reload()} className="btn-primary" style={{ width: '100%' }}>
                    返回
                </button>
            </div>
            <style jsx>{`
        .mobile-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 1rem;
          background: radial-gradient(circle at top right, #f0fdf4, #dcfce7);
        }
      `}</style>
        </div>
    );
}
