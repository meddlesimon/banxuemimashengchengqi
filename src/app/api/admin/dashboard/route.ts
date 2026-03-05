import db from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    const accountCount = await db.prepare("SELECT COUNT(*) as count FROM account_pool WHERE status = 'VALID'").get() as any;
    const pointer = await db.prepare("SELECT value FROM system_config WHERE key = 'global_pointer'").get() as any;
    const lastCycle = await db.prepare('SELECT duration FROM cycle_logs WHERE end_time IS NOT NULL ORDER BY end_time DESC LIMIT 1').get() as any;

    return NextResponse.json({
        totalAccounts: accountCount.count,
        pointer: pointer ? parseInt(pointer.value, 10) : 0,
        lastCycleDuration: lastCycle ? lastCycle.duration : null, // 秒
    });
}
