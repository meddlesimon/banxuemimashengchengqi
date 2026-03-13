import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ message: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const parents = await db.prepare('SELECT * FROM parents ORDER BY created_at ASC').all();
    const accounts = await db.prepare('SELECT * FROM account_pool ORDER BY created_at ASC').all();
    const admins = await db.prepare("SELECT id, phone, role, created_at FROM admins WHERE role != 'SUPER_ADMIN' ORDER BY created_at ASC").all();
    const officialStudents = await db.prepare('SELECT * FROM official_students ORDER BY created_at ASC').all();
    const systemConfig = await db.prepare('SELECT * FROM system_config').all();

    if (format === 'csv') {
        // 导出家长列表 CSV
        const lines: string[] = ['手机号,状态,注册时间,最后分配账号ID,最后分配时间'];
        for (const p of parents as any[]) {
            const status = p.status === 'ACTIVE' ? '已激活' : p.status === 'PENDING' ? '待审核' : p.status;
            lines.push(`${p.phone},${status},${p.created_at || ''},${p.last_account_id || ''},${p.last_assigned_at || ''}`);
        }
        const csv = lines.join('\n');
        return new Response('\uFEFF' + csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="parents_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.csv"`,
            },
        });
    }

    if (format === 'accounts_csv') {
        // 导出账号池 CSV
        const lines: string[] = ['账号,密码,状态,创建时间'];
        for (const a of accounts as any[]) {
            const status = a.status === 'AVAILABLE' ? '可用' : a.status === 'USED' ? '已使用' : a.status;
            lines.push(`${a.account},${a.password},${status},${a.created_at || ''}`);
        }
        const csv = lines.join('\n');
        return new Response('\uFEFF' + csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="accounts_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.csv"`,
            },
        });
    }

    // 默认 JSON 全量备份
    const backup = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        data: {
            parents,
            account_pool: accounts,
            admins,
            official_students: officialStudents,
            system_config: systemConfig,
        },
    };

    return new Response(JSON.stringify(backup, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="backup_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json"`,
        },
    });
}
