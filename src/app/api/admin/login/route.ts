import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { phone, password } = await request.json();

    // 17888837833 / 230101 是硬编码的超管
    const admin = await db.prepare('SELECT * FROM admins WHERE phone = ?').get(phone) as any;

    if (admin && admin.password_hash === password) {
        // 简化处理：实际开发应使用 JWT，这里直接返回角色作为模拟
        return NextResponse.json({
            id: admin.id,
            phone: admin.phone,
            role: admin.role
        });
    }

    return NextResponse.json({ message: '手机号或密码错误' }, { status: 401 });
}
