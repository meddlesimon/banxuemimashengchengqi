import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    const parents = await db.prepare('SELECT * FROM parents ORDER BY created_at DESC').all();
    return NextResponse.json(parents);
}

export async function POST(request: Request) {
    const { phone } = await request.json();
    const id = `parent_${Date.now()}`;
    try {
        await db.prepare('INSERT INTO parents (id, phone) VALUES (?, ?)').run(id, phone);
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ message: '手机号已存在' }, { status: 400 });
    }
}

export async function PATCH(request: Request) {
    const { id, status } = await request.json();
    await db.prepare('UPDATE parents SET status = ? WHERE id = ?').run(status, id);
    return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
    const { id } = await request.json();
    await db.prepare('DELETE FROM parents WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
}
