import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ message: '未授权' }, { status: 401 });
    }
    const accounts = await db.prepare('SELECT * FROM account_pool ORDER BY created_at DESC').all();
    return NextResponse.json(accounts);
}

export async function POST(request: Request) {
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ message: '未授权' }, { status: 401 });
    }
    const data = await request.json();

    // 如果是数组，则执行批量插入事务
    if (Array.isArray(data)) {
        const insert = db.prepare('INSERT INTO account_pool (id, username, password) VALUES (?, ?, ?)');
        const insertMany = db.transaction(async (tx: any, accounts: any[]) => {
            for (const acc of accounts) {
                const id = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                if (process.env.DB_TYPE === 'mysql') {
                    await tx.execute('INSERT INTO account_pool (id, username, password) VALUES (?, ?, ?)', [id, acc.username, acc.password]);
                } else {
                    await insert.run(id, acc.username, acc.password);
                }
            }
        });
        await insertMany(data);
        return NextResponse.json({ success: true, count: data.length });
    }

    // 单个账号插入
    const { username, password } = data;
    const id = `acc_${Date.now()}`;
    await db.prepare('INSERT INTO account_pool (id, username, password) VALUES (?, ?, ?)').run(id, username, password);
    return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ message: '未授权' }, { status: 401 });
    }
    const { id } = await request.json();
    await db.prepare('DELETE FROM account_pool WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
}
