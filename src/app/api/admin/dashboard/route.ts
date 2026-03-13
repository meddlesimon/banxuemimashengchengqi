import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ message: '未授权' }, { status: 401 });
    }

    const accountCount = await db.prepare("SELECT COUNT(*) as count FROM account_pool WHERE status = 'VALID'").get() as any;
    const pointer = await db.prepare("SELECT value FROM system_config WHERE key = 'global_pointer'").get() as any;
    const lastCycle = await db.prepare('SELECT duration FROM cycle_logs WHERE end_time IS NOT NULL ORDER BY end_time DESC LIMIT 1').get() as any;

    const ttlConfig = await db.prepare("SELECT value FROM system_config WHERE key = 'distribution_ttl_minutes'").get() as any;
    const ttlMinutes = ttlConfig ? parseInt(ttlConfig.value, 10) : 90;

    const accounts = await db.prepare(`
        SELECT 
            ap.id, ap.username, ap.password, ap.last_sent_at,
            GROUP_CONCAT(p.phone) as assigned_parents
        FROM account_pool ap
        LEFT JOIN parents p ON p.last_account_id = ap.id
        WHERE ap.status = 'VALID'
        GROUP BY ap.id
        ORDER BY ap.created_at ASC
    `).all();

    return NextResponse.json({
        totalAccounts: accountCount.count,
        pointer: pointer ? parseInt(pointer.value, 10) : 0,
        lastCycleDuration: lastCycle ? lastCycle.duration : null,
        accounts: accounts,
        config: {
            ttlMinutes: ttlMinutes
        }
    });
}

export async function POST(request: Request) {
    if (!await verifyAdminRequest(request)) {
        return NextResponse.json({ message: '未授权' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { ttlMinutes } = body;

        if (typeof ttlMinutes !== 'number' || ttlMinutes < 0) {
            return NextResponse.json({ error: '无效的时间配置' }, { status: 400 });
        }

        const existingConfig = await db.prepare("SELECT value FROM system_config WHERE key = 'distribution_ttl_minutes'").get();

        if (existingConfig) {
            await db.prepare("UPDATE system_config SET value = ? WHERE key = 'distribution_ttl_minutes'").run(ttlMinutes.toString());
        } else {
            await db.prepare("INSERT INTO system_config (key, value) VALUES ('distribution_ttl_minutes', ?)").run(ttlMinutes.toString());
        }

        return NextResponse.json({ success: true, ttlMinutes });
    } catch (error) {
        console.error('更新配置失败:', error);
        return NextResponse.json({ error: '更新配置失败' }, { status: 500 });
    }
}
