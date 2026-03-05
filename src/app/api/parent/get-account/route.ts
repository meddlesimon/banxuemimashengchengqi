import { NextResponse } from 'next/server';
import { getAssignedAccount } from '@/lib/distribution';
import db from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { phone, code } = await request.json();

        if (!phone || !code) {
            return NextResponse.json({ message: '手机号和验证码必填' }, { status: 400 });
        }

        // [快速上线模式] 如果是万能密码 666666，则跳过数据库验证码检查
        if (code !== '666666') {
            // 1. 从数据库中查询该手机号的验证码
            const record = await db.prepare('SELECT * FROM verification_codes WHERE phone = ?').get(phone) as any;

            if (!record) {
                return NextResponse.json({ message: '验证码/密码错误，请尝试 666666' }, { status: 400 });
            }

            // 2. 校验验证码
            if (record.code !== code) {
                return NextResponse.json({ message: '验证码填写错误' }, { status: 400 });
            }

            // 3. 校验成功，删除该验证码记录（一次性有效）
            await db.prepare('DELETE FROM verification_codes WHERE phone = ?').run(phone);
        }

        // 4. 获取轮询分配的账号
        const account = await getAssignedAccount(phone);
        if (!account) {
            return NextResponse.json({ message: '账号池目前为空，请联系管理员' }, { status: 404 });
        }

        return NextResponse.json(account);
    } catch (error: any) {
        console.error('[Verify Code Error]', error);
        return NextResponse.json({ message: error.message || '系统繁忙，请稍后再试' }, { status: 403 });
    }
}
