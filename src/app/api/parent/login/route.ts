import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { verifyLocalCaptcha } from '@/lib/captcha';
import { getAssignedAccount } from '@/lib/distribution';

export async function POST(request: Request) {
    try {
        const { phone, password, captchaCode } = await request.json();

        if (!phone || !password) {
            return NextResponse.json({ message: '手机号和密码不能为空' }, { status: 400 });
        }

        // 1. 验证码校验
        if (!captchaCode) {
            return NextResponse.json({ message: '请输入验证码' }, { status: 400 });
        }
        const captchaOk = await verifyLocalCaptcha(captchaCode);
        if (!captchaOk) {
            return NextResponse.json({ message: '验证码错误或已过期，请刷新后重试' }, { status: 400 });
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
