import * as tencentcloud from 'tencentcloud-sdk-nodejs';

const CaptchaClient = tencentcloud.captcha.v20190722.Client;

/**
 * 腾讯云验证码 (Captcha) 校验
 */
export async function verifyTencentCaptcha(ticket: string, randstr: string, userIp: string = "127.0.0.1") {
    const captchaAppId = process.env.TENCENT_CAPTCHA_APP_ID || '191937675';
    const captchaAppSecretKey = process.env.TENCENT_CAPTCHA_APP_SECRET_KEY || process.env.TENCENT_CAPTCHA_APP_KEY || 'bnTvSMtexsg7w921eNK1tH4LY';

    const client = new CaptchaClient({
        credential: {
            secretId: process.env.TENCENTCLOUD_SECRET_ID || process.env.TENCENT_SECRET_ID || '',
            secretKey: process.env.TENCENTCLOUD_SECRET_KEY || process.env.TENCENT_SECRET_KEY || ''
        },
        region: "",
        profile: { httpProfile: { endpoint: "captcha.tencentcloudapi.com" } },
    });

    const params = {
        CaptchaType: 9,
        Ticket: ticket,
        UserIp: userIp,
        Randstr: randstr,
        CaptchaAppId: Number(captchaAppId),
        AppSecretKey: captchaAppSecretKey,
    };

    try {
        const resp = await client.DescribeCaptchaResult(params);
        console.log(`[Captcha] Response:`, JSON.stringify(resp));

        if (resp.CaptchaCode === 1) {
            return true;
        }

        // 严格模式：任何非 1 的 code 均视为失败
        console.error(`[Captcha] 校验失败: ${resp.CaptchaMsg} (Code: ${resp.CaptchaCode})`);
        return false;
    } catch (err: any) {
        console.error("[Captcha] SDK 调用异常:", err.message || err);
        // 异常时返回 false，不放行
        return false;
    }
}
