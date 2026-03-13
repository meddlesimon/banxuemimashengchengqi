import crypto from 'crypto';
import { cookies } from 'next/headers';

/**
 * 校验本地图片验证码
 * @param inputCode 用户输入的验证码
 */
export async function verifyLocalCaptcha(inputCode: string): Promise<boolean> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('captcha_token')?.value;
        if (!token) return false;

        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const parts = decoded.split(':');
        if (parts.length !== 3) return false;

        const [code, expiresStr, hash] = parts;
        const expires = parseInt(expiresStr, 10);

        // 验证签名
        const payload = `${code}:${expiresStr}`;
        const expectedHash = crypto
            .createHmac('sha256', process.env.JWT_SECRET || 'captcha-secret')
            .update(payload)
            .digest('hex');

        if (hash !== expectedHash) return false;

        // 验证过期
        if (Date.now() > expires) return false;

        // 验证码比对（不区分大小写）
        if (inputCode.trim().toLowerCase() !== code.toLowerCase()) return false;

        // 用后立即作废（删除 cookie）
        cookieStore.delete('captcha_token');

        return true;
    } catch {
        return false;
    }
}
