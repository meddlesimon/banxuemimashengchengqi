import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * 腾讯云服务接口预留 (应由 CodeBuddy 填入逻辑)
 */
async function verifyTencentCaptcha(ticket: string, randstr: string) {
    // 待接入：腾讯云防水墙 (Tencent Cloud Captcha)
    // 示例文档：https://cloud.tencent.com/document/product/1110
    console.log('[Tencent Cloud] Mocking Captcha Verification...');
    return true;
}

async function sendTencentSms(phone: string, code: string) {
    // 待接入：腾讯云短信服务 (Tencent Cloud SMS)
    // 示例文档：https://cloud.tencent.com/document/product/382
    console.log(`[Tencent Cloud] Sending SMS to ${phone} with code: ${code}`);
    return true;
}

export async function POST(request: Request) {
    try {
        const { phone, captchaTicket, captchaRandstr } = await request.json();

        if (!phone) {
            return NextResponse.json({ message: '手机号不能为空' }, { status: 400 });
        }

        // 1. [关键改动] 此时即便滑块报错也可以继续，因为我们是测试模式
        const isTestMode = true; // 建议由环境变量控制

        if (!isTestMode && (!captchaTicket || !captchaRandstr)) {
            return NextResponse.json({ message: '请先完成滑块验证' }, { status: 400 });
        }

        // 2. 这里的逻辑现在由 CodeBuddy 随后填入腾讯云 SDK 调用
        if (!isTestMode) {
            const captchaOk = await verifyTencentCaptcha(captchaTicket, captchaRandstr);
            if (!captchaOk) return NextResponse.json({ message: '滑块验证失败' }, { status: 400 });
        }

        // 3. [万能验证码逻辑]
        const code = '666666';

        // 4. 持久化到数据库
        await db.prepare('INSERT OR REPLACE INTO verification_codes (phone, code) VALUES (?, ?)').run(phone, code);

        // 5. 模拟发送动作
        await sendTencentSms(phone, code);

        return NextResponse.json({
            success: true,
            message: '测试模式：请使用万能验证码 666666 登录'
        });

    } catch (error: any) {
        console.error('[Verify Code Error]', error);
        return NextResponse.json({ message: '系统繁忙，请稍后再试' }, { status: 500 });
    }
}
