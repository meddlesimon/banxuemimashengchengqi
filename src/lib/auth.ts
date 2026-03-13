import db from './db';
import { randomBytes } from 'crypto';

/**
 * 从请求中提取 admin_session cookie 值
 */
function getSessionToken(request: Request): string | null {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    return match ? match[1] : null;
}

/**
 * 验证管理员请求是否携带合法 session
 */
export async function verifyAdminRequest(request: Request): Promise<boolean> {
    const token = getSessionToken(request);
    if (!token) return false;

    const row = await db.get(
        "SELECT value FROM system_config WHERE key = ?",
        [`session_${token}`]
    ) as any;
    return !!row;
}

/**
 * 创建新 session，返回 token
 */
export async function createAdminSession(adminId: string, phone: string, role: string): Promise<string> {
    const token = randomBytes(32).toString('hex');
    await db.run(
        "INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)",
        [`session_${token}`, JSON.stringify({ id: adminId, phone, role })]
    );
    return token;
}

/**
 * 清除 session（退出登录时调用）
 */
export async function clearAdminSession(request: Request): Promise<void> {
    const token = getSessionToken(request);
    if (token) {
        await db.run("DELETE FROM system_config WHERE key = ?", [`session_${token}`]);
    }
}
