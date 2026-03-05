import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    const admins = await db.prepare("SELECT id, phone, role, created_at FROM admins WHERE role = 'ADMIN'").all();
    return NextResponse.json(admins);
}

export async function POST(request: Request) {
    const { phone, password, role } = await request.json();
    const id = `admin_${Date.now()}`;
    try {
        await db.prepare('INSERT INTO admins (id, phone, password_hash, role) VALUES (?, ?, ?, ?)').run(id, phone, password, role || 'ADMIN');
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ message: '手机号已存在' }, { status: 400 });
    }
}

export async function DELETE(request: Request) {
    const { id } = await request.json();
    await db.prepare("DELETE FROM admins WHERE id = ? AND role = 'ADMIN'").run(id);
    return NextResponse.json({ success: true });
}
