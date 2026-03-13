import crypto from 'crypto';

const SECRET = process.env.JWT_SECRET || 'captcha-secret-key';

/**
 * 校验本地图片验证码
 * @param inputCode 用户输入的验证码
 * @param token     前端回传的 captcha token（由 /api/captcha 生成）
 */
export function verifyLocalCaptcha(inputCode: string, token: string): boolean {
    try {
        if (!inputCode || !token) return false;

        const decoded = Buffer.from(token, 'base64url').toString('utf8');
        const lastColon = decoded.lastIndexOf(':');
        if (lastColon === -1) return false;

        const payload = decoded.substring(0, lastColon);
        const hmac = decoded.substring(lastColon + 1);

        // 验证签名
        const expectedHmac = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
        if (hmac !== expectedHmac) return false;

        // 解析 code 和过期时间
        const firstColon = payload.indexOf(':');
        if (firstColon === -1) return false;
        const code = payload.substring(0, firstColon);
        const expires = parseInt(payload.substring(firstColon + 1), 10);

        // 验证过期（5分钟）
        if (Date.now() > expires) return false;

        // 验证码比对
        return inputCode.trim() === code;
    } catch {
        return false;
    }
}
