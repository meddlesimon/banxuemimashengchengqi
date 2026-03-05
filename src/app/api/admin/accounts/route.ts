import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    const accounts = await db.prepare('SELECT * FROM account_pool ORDER BY created_at DESC').all();
    return NextResponse.json(accounts);
}

export async function POST(request: Request) {
    const data = await request.json();

    // 如果是数组，则执行批量插入事务
    if (Array.isArray(data)) {
        const insert = db.prepare('INSERT INTO account_pool (id, username, password) VALUES (?, ?, ?)');
        // 注意：db.transaction 返回一个函数，该函数现在是异步的（根据 db.ts 实现）
        const insertMany = db.transaction(async (tx: any, accounts: any[]) => {
            for (const acc of accounts) {
                const id = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                if (process.env.DB_TYPE === 'mysql') {
                    await tx.execute('INSERT INTO account_pool (id, username, password) VALUES (?, ?, ?)', [id, acc.username, acc.password]);
                } else {
                    insert.run(id, acc.username, acc.password);
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
    const { id } = await request.json();
    // 仅支持按 ID 删除，禁止清空整个池子
    await db.prepare('DELETE FROM account_pool WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
}
