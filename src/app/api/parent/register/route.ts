import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { verifyTencentCaptcha } from '@/lib/captcha';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const { phone, password, captchaTicket, captchaRandstr } = await request.json();

        if (!phone || !password || !captchaTicket || !captchaRandstr) {
            return NextResponse.json({ message: '手机号、密码和验证码均为必填' }, { status: 400 });
        }

        if (!/^1[3-9]\d{9}$/.test(phone)) {
            return NextResponse.json({ message: '手机号格式不正确' }, { status: 400 });
        }

        // 1. 滑块验证
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
        const captchaOk = await verifyTencentCaptcha(captchaTicket, captchaRandstr, ip);
        if (!captchaOk) {
            // 注意：如果验证码校验返回 false，说明是真实的验证失败或配置极度错误
            return NextResponse.json({ message: '图形验证码校验失败，请重试' }, { status: 400 });
        }

        // 2. 检查是否已注册
        const existingParent = await db.get('SELECT id FROM parents WHERE phone = ?', [phone]);
        if (existingParent) {
            return NextResponse.json({ message: '该手机号已注册，请直接登录' }, { status: 400 });
        }

        // 3. 加密密码
        const passwordHash = await bcrypt.hash(password, 10);

        // 4. 创建用户 (初始状态为 PENDING)
        const now = new Date();
        const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
        
        const id = uuidv4();
        await db.run(
            'INSERT INTO parents (id, phone, password_hash, status, created_at) VALUES (?, ?, ?, ?, ?)',
            [id, phone, passwordHash, 'PENDING', beijingTime]
        );

        return NextResponse.json({
            success: true,
            message: '注册成功，请等待老师开通会员权限',
            isActive: false
        });

    } catch (error: any) {
        console.error('[Register Error]', error);
        return NextResponse.json({ message: '系统繁忙，请稍后再试' }, { status: 500 });
    }
}
