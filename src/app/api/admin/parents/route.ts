import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ message: '未授权' }, { status: 401 });
    }
    const parents = await db.prepare('SELECT * FROM parents ORDER BY created_at DESC').all();
    return NextResponse.json(parents);
}

export async function POST(request: Request) {
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ message: '未授权' }, { status: 401 });
    }
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
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ message: '未授权' }, { status: 401 });
    }
    const { id, status } = await request.json();
    await db.run('UPDATE parents SET status = ? WHERE id = ?', [status, id]);
    return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ message: '未授权' }, { status: 401 });
    }
    const { id } = await request.json();
    await db.prepare('DELETE FROM parents WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
}
