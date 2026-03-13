import db from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
    const { phone, password } = await request.json();

    const admin = await db.prepare('SELECT * FROM admins WHERE phone = ?').get(phone) as any;

    if (admin && admin.password_hash) {
        const ok = await bcrypt.compare(password, admin.password_hash);
        if (ok) {
            const token = await createAdminSession(admin.id, admin.phone, admin.role);

            const response = NextResponse.json({
                id: admin.id,
                phone: admin.phone,
                role: admin.role
            });

            // 种 httpOnly Cookie，7天过期
            response.headers.set(
                'Set-Cookie',
                `admin_session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Strict`
            );
            return response;
        }
    }

    return NextResponse.json({ message: '手机号或密码错误' }, { status: 401 });
}
