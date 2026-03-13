import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { verifyTencentCaptcha } from '@/lib/captcha';
import { getAssignedAccount } from '@/lib/distribution';

export async function POST(request: Request) {
    try {
        const { phone, password, captchaTicket, captchaRandstr } = await request.json();

        if (!phone || !password) {
            return NextResponse.json({ message: '手机号和密码不能为空' }, { status: 400 });
        }

        // 1. 滑块验证（无条件执行，不再接受 skipCaptcha 参数）
        if (!captchaTicket || !captchaRandstr) {
            return NextResponse.json({ message: '请完成滑块验证' }, { status: 400 });
        }

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
        const captchaOk = await verifyTencentCaptcha(captchaTicket, captchaRandstr, ip);
        if (!captchaOk) {
            return NextResponse.json({ message: '滑块验证失败，请重试' }, { status: 400 });
        }

        // 2. 查询用户
        const parent = await db.get('SELECT * FROM parents WHERE phone = ?', [phone]);
        if (!parent || !parent.password_hash) {
            return NextResponse.json({ message: '手机号或密码错误' }, { status: 401 });
        }

        // 3. 校验密码
        const passwordMatch = await bcrypt.compare(password, parent.password_hash);
        if (!passwordMatch) {
            return NextResponse.json({ message: '手机号或密码错误' }, { status: 401 });
        }

        // 4. 校验用户状态
        if (parent.status !== 'ACTIVE') {
            return NextResponse.json({
                success: true,
                isActive: false,
                message: '账号尚未激活，请联系北大叶子老师（17888837833）开通会员。'
            });
        }

        // 5. 获取轮询分配的账号
        const account = await getAssignedAccount(phone);
        if (!account) {
            return NextResponse.json({ message: '账号池目前为空，请联系管理员' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            isActive: true,
            account
        });
    } catch (error: any) {
        console.error('[Login Error]', error);
        return NextResponse.json({ message: '系统繁忙，请稍后再试' }, { status: 500 });
    }
}
