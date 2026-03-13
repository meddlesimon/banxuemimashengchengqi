'use client';

import { useState, useCallback } from 'react';

export default function ParentPage() {
    const [view, setView] = useState<'welcome' | 'login' | 'register' | 'account' | 'pending'>('welcome');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [captchaCode, setCaptchaCode] = useState('');
    const [captchaImg, setCaptchaImg] = useState('');
    const [captchaToken, setCaptchaToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [account, setAccount] = useState<any>(null);
    const [pendingMessage, setPendingMessage] = useState('');

    const refreshCaptcha = useCallback(async () => {
        try {
            const res = await fetch('/api/captcha');
            const data = await res.json();
            setCaptchaImg(data.img);
            setCaptchaToken(data.token);
            setCaptchaCode('');
        } catch {
            // ignore
        }
    }, []);

    const goToForm = (target: 'login' | 'register') => {
        setView(target);
        setError('');
        setCaptchaCode('');
        refreshCaptcha();
    };

    const refreshStatus = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/parent/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password }),
            });
            const data = await response.json();
            if (response.ok) {
                if (data.isActive === true) {
                    setAccount(data.account);
                    setView('account');
                } else {
                    setPendingMessage(data.message || '您的账号尚未开通，请联系老师开通会员。');
                }
            } else {
                setError(data.message || '刷新失败');
            }
        } catch (err) {
            setError('网络错误，请稍后再试');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (type: 'login' | 'register') => {
        if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
            setError('请输入正确的手机号');
            return;
        }
        if (password.length < 6) {
            setError('密码长度不能少于6位');
            return;
        }
        if (type === 'register' && password !== confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }
        if (!captchaCode.trim()) {
            setError('请输入验证码');
            return;
        }

        setError('');
        setLoading(true);
        try {
            const endpoint = type === 'login' ? '/api/parent/login' : '/api/parent/register';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password, captchaCode: captchaCode.trim(), captchaToken }),
            });
            const data = await response.json();
            if (response.ok) {
                if (data.isActive === false) {
                    setPendingMessage(data.message || '您的账号尚未开通，请联系老师开通会员。');
                    setView('pending');
                } else {
                    setAccount(data.account);
                    setView('account');
                }
            } else {
                setError(data.message || (type === 'login' ? '登录失败' : '注册失败'));
                refreshCaptcha();
            }
        } catch (err) {
            setError('网络错误，请稍后再试');
            refreshCaptcha();
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

    return (
        <div className="page-wrapper">
            <div className="animated-bg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <div className="content-container">
                {view === 'welcome' && (
                    <div className="card animate-in">
                        <div className="card-header">
                            <div className="icon-badge">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M21 7L12 12L3 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h1>伴学账号查询</h1>
                            <p>专业、安全、快捷的账号分配系统</p>
                        </div>
                        <div className="card-body">
                            <button className="btn btn-primary" onClick={() => goToForm('login')}>
                                <span>已有账号登录</span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </button>
                            <button className="btn btn-secondary" onClick={() => goToForm('register')}>
                                <span>新用户注册</span>
                            </button>
                        </div>
                        <div className="card-footer">
                            <p>© 2024 伴学助手 · 助力学习每一天</p>
                        </div>
                    </div>
                )}

                {(view === 'login' || view === 'register') && (
                    <div className="card animate-in">
                        <div className="card-nav">
                            <button className="back-btn" onClick={() => { setView('welcome'); setError(''); }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                            </button>
                            <h2>{view === 'login' ? '家长登录' : '用户注册'}</h2>
                        </div>
                        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); handleAction(view); }}>
                            <div className="input-group">
                                <label>手机号码</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">📱</span>
                                    <input
                                        type="tel"
                                        placeholder="请输入您的手机号"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>登录密码</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">🔒</span>
                                    <input
                                        type="password"
                                        placeholder="请输入密码 (至少6位)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            {view === 'register' && (
                                <div className="input-group">
                                    <label>确认密码</label>
                                    <div className="input-wrapper">
                                        <span className="input-icon">🛡️</span>
                                        <input
                                            type="password"
                                            placeholder="请再次输入密码"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="input-group">
                                <label>验证码</label>
                                <div className="captcha-row">
                                    <div className="input-wrapper captcha-input-wrapper">
                                        <span className="input-icon">🔑</span>
                                        <input
                                            type="text"
                                            placeholder="请输入右侧验证码"
                                            value={captchaCode}
                                            onChange={(e) => setCaptchaCode(e.target.value)}
                                            maxLength={4}
                                            autoComplete="off"
                                            required
                                        />
                                    </div>
                    <button type="button" className="captcha-img-btn" onClick={refreshCaptcha} title="点击刷新验证码">
                                        {captchaImg && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={captchaImg} alt="验证码" width={120} height={40} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <button className="btn btn-primary" type="submit" disabled={loading}>
                                {loading ? <span className="loader"></span> : (view === 'login' ? '确认登录' : '立即注册')}
                            </button>

                            <div className="form-toggle">
                                {view === 'login' ? '还没有账号？' : '已有账号？'}
                                <button type="button" onClick={() => { goToForm(view === 'login' ? 'register' : 'login'); }}>
                                    {view === 'login' ? '立即注册' : '返回登录'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {view === 'account' && (
                    <div className="card animate-in success-card">
                        <div className="card-header">
                            <div className="success-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <h2>查询成功</h2>
                            <p>已为您分配以下伴学APP账号</p>
                        </div>
                        <div className="result-box">
                            <div className="result-item">
                                <div className="item-label">伴学账号</div>
                                <div className="item-value">
                                    <span>{account.username}</span>
                                    <button onClick={() => copyToClipboard(account.username)}>复制</button>
                                </div>
                            </div>
                            <div className="result-divider"></div>
                            <div className="result-item">
                                <div className="item-label">登录密码</div>
                                <div className="item-value">
                                    <span>{account.password}</span>
                                    <button onClick={() => copyToClipboard(account.password)}>复制</button>
                                </div>
                            </div>
                        </div>
                        <div className="warning-box">
                            <p>⚠️ 注意：请妥善保管账号，勿泄露给他人。</p>
                        </div>
                        <button className="btn btn-secondary" onClick={() => window.location.reload()}>
                            退出系统
                        </button>
                    </div>
                )}

                {view === 'pending' && (
                    <div className="card animate-in pending-card">
                        <div className="card-header">
                            <div className="pending-icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                            </div>
                            <h2>注册成功</h2>
                        </div>
                        <div className="message-box">
                            <p>家长您好，感谢您注册。</p>
                            <p style={{ marginTop: '8px', fontSize: '15px', fontWeight: 'normal' }}>需要您联系北大叶子并告知您注册的手机号码，为您开启伴学APP账号和密码服务。</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button className="btn btn-primary" onClick={refreshStatus} disabled={loading}>
                                {loading ? <span className="loader"></span> : '刷新开通状态'}
                            </button>
                            <button className="btn btn-secondary" onClick={() => setView('welcome')}>
                                返回首页
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                .page-wrapper {
                    min-height: 100vh;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: #0f172a;
                    position: relative;
                    overflow: hidden;
                    font-family: 'Inter', -apple-system, system-ui, sans-serif;
                }

                .animated-bg {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    z-index: 0;
                    filter: blur(100px);
                    opacity: 0.6;
                }

                .blob {
                    position: absolute;
                    width: 400px; height: 400px;
                    border-radius: 50%;
                }

                .blob-1 { top: -100px; left: -100px; background: #10b981; animation: move 20s infinite alternate; }
                .blob-2 { bottom: -100px; right: -100px; background: #3b82f6; animation: move 25s infinite alternate-reverse; }
                .blob-3 { top: 50%; left: 50%; background: #8b5cf6; animation: move 30s infinite alternate; }

                @keyframes move {
                    from { transform: translate(0, 0) scale(1); }
                    to { transform: translate(20%, 20%) scale(1.2); }
                }

                .content-container {
                    width: 100%;
                    max-width: 440px;
                    position: relative;
                    z-index: 10;
                }

                .card {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 32px;
                    padding: 40px 32px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    text-align: center;
                }

                .animate-in { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1); }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .card-header { margin-bottom: 32px; }

                .icon-badge {
                    width: 64px; height: 64px;
                    background: #10b981; color: white;
                    border-radius: 20px;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 20px;
                    box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
                }

                h1 { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 12px; letter-spacing: -0.02em; }
                h2 { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0; }
                p { color: #64748b; font-size: 16px; line-height: 1.5; }

                .card-body {
                    display: flex; flex-direction: column; gap: 16px;
                    margin-bottom: 32px;
                }

                .btn {
                    width: 100%;
                    padding: 16px 24px;
                    border-radius: 16px;
                    font-size: 16px; font-weight: 600;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer; border: none;
                }

                .btn-primary { background: #10b981; color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
                .btn-primary:hover { background: #059669; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3); }
                .btn-secondary { background: white; color: #1e293b; border: 1px solid #e2e8f0; }
                .btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }
                .btn:active { transform: scale(0.98); }
                .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

                .card-footer { border-top: 1px solid #e2e8f0; padding-top: 24px; }
                .card-footer p { font-size: 13px; color: #94a3b8; }

                .card-nav {
                    display: flex; align-items: center;
                    margin-bottom: 32px; position: relative;
                }

                .back-btn {
                    position: absolute; left: -8px;
                    background: none; border: none; color: #64748b;
                    padding: 8px; cursor: pointer; border-radius: 50%;
                    transition: all 0.2s;
                }
                .back-btn:hover { background: rgba(0,0,0,0.05); color: #1e293b; }
                .card-nav h2 { width: 100%; text-align: center; }

                .auth-form { text-align: left; }
                .input-group { margin-bottom: 20px; }
                .input-group label { display: block; font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 8px; }

                .input-wrapper {
                    position: relative;
                    display: flex; align-items: center;
                }

                .input-icon {
                    position: absolute; left: 16px;
                    font-size: 18px; pointer-events: none;
                }

                .input-wrapper input {
                    width: 100%;
                    padding: 14px 16px 14px 48px;
                    background: #f8fafc;
                    border: 2px solid #f1f5f9;
                    border-radius: 14px;
                    font-size: 16px;
                    transition: all 0.2s;
                    color: #1e293b;
                }

                .input-wrapper input:focus {
                    outline: none;
                    border-color: #10b981;
                    background: white;
                    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
                }

                .captcha-row {
                    display: flex;
                    gap: 10px;
                    align-items: stretch;
                }

                .captcha-input-wrapper {
                    flex: 1;
                }

                .captcha-img-btn {
                    flex-shrink: 0;
                    background: none;
                    border: 2px solid #f1f5f9;
                    border-radius: 14px;
                    padding: 4px 6px;
                    cursor: pointer;
                    transition: border-color 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .captcha-img-btn:hover {
                    border-color: #10b981;
                }

                .captcha-img-btn img {
                    display: block;
                    border-radius: 8px;
                }

                .error-message {
                    background: #fef2f2; color: #dc2626;
                    padding: 12px 16px; border-radius: 12px;
                    font-size: 14px; margin-bottom: 20px;
                    border: 1px solid #fee2e2;
                }

                .form-toggle {
                    margin-top: 24px; text-align: center;
                    font-size: 14px; color: #64748b;
                }
                .form-toggle button {
                    background: none; border: none;
                    color: #10b981; font-weight: 700;
                    margin-left: 6px; cursor: pointer;
                }

                .success-card .success-icon,
                .pending-card .pending-icon {
                    width: 80px; height: 80px;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 24px;
                }
                .success-card .success-icon { background: #d1fae5; color: #10b981; }
                .pending-card .pending-icon { background: #fef3c7; color: #d97706; }

                .message-box {
                    background: #fffbeb; padding: 24px;
                    border-radius: 20px; margin-bottom: 24px;
                    border: 1px solid #fde68a;
                }
                .message-box p { color: #92400e; font-size: 16px; font-weight: 600; line-height: 1.6; }

                .result-box {
                    background: #f8fafc; border-radius: 20px;
                    padding: 20px; margin-bottom: 24px;
                    border: 1px solid #e2e8f0; text-align: left;
                }
                .result-item .item-label { font-size: 12px; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
                .item-value { display: flex; justify-content: space-between; align-items: center; }
                .item-value span { font-size: 18px; font-weight: 700; color: #1e293b; font-family: monospace; }
                .item-value button {
                    background: #ecfdf5; color: #059669;
                    border: 1px solid #10b981;
                    padding: 4px 12px; border-radius: 8px;
                    font-size: 13px; font-weight: 600; cursor: pointer;
                }
                .result-divider { height: 1px; background: #e2e8f0; margin: 16px 0; }

                .warning-box { background: #fffbeb; padding: 12px; border-radius: 12px; margin-bottom: 24px; }
                .warning-box p { color: #92400e; font-size: 13px; font-weight: 500; }

                .loader {
                    width: 24px; height: 24px;
                    border: 3px solid rgba(255,255,255,0.3);
                    border-radius: 50%; border-top-color: white;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 480px) {
                    .card { padding: 32px 20px; }
                    .page-wrapper { padding: 16px; }
                }
            `}</style>
        </div>
    );
}
