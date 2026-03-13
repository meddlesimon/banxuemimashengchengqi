import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getAssignedAccount } from '@/lib/distribution';

/**
 * 专用于 pending 页面"刷新开通状态"按钮
 * 验证身份后仅查询状态，不需要验证码
 */
export async function POST(request: Request) {
    try {
        const { phone, password } = await request.json();

        if (!phone || !password) {
            return NextResponse.json({ message: '参数缺失' }, { status: 400 });
        }

        const parent = await db.get('SELECT * FROM parents WHERE phone = ?', [phone]) as any;
        if (!parent || !parent.password_hash) {
            return NextResponse.json({ message: '用户不存在' }, { status: 401 });
        }

        const ok = await bcrypt.compare(password, parent.password_hash);
        if (!ok) {
            return NextResponse.json({ message: '密码错误' }, { status: 401 });
        }

        if (parent.status !== 'ACTIVE') {
            return NextResponse.json({
                success: true,
                isActive: false,
                message: '账号尚未激活，请联系北大叶子老师（17888837833）开通会员。'
            });
        }

        const account = await getAssignedAccount(phone);
        if (!account) {
            return NextResponse.json({ message: '账号池暂无可用账号，请联系管理员' }, { status: 404 });
        }

        return NextResponse.json({ success: true, isActive: true, account });
    } catch (error) {
        console.error('[Status Error]', error);
        return NextResponse.json({ message: '系统繁忙，请稍后再试' }, { status: 500 });
    }
}
