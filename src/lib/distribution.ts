import db from './db';

export interface Account {
    id: string;
    username: string;
    password: string;
}

/**
 * 核心发号算法 (Core Distribution Logic)
 * 1. 防刷记忆拦截 (1.5小时 TTL)
 * 2. 无状态指针轮询分配
 * 3. 遍历耗时监控
 */
export async function getAssignedAccount(parentPhone: string): Promise<Account | null> {
    const now = new Date();
    const ttlMs = 1.5 * 60 * 60 * 1000;

    // 1. 检查家长是否存在
    let parent = await db.prepare('SELECT * FROM parents WHERE phone = ?').get(parentPhone) as any;

    if (!parent) {
        // [快速上线/测试模式] 自动录入新手机号
        const newId = `p_auto_${Date.now()}`;
        await db.prepare('INSERT INTO parents (id, phone, status) VALUES (?, ?, ?)').run(newId, parentPhone, 'NORMAL');
        parent = await db.prepare('SELECT * FROM parents WHERE phone = ?').get(parentPhone) as any;
    }

    if (parent.status !== 'NORMAL') {
        throw new Error('此账号已停用，请联系管理员');
    }

    // 2. 防刷记忆拦截 (1.5小时内直接返回)
    if (parent.last_account_id && parent.last_assigned_at) {
        const lastAssignedTime = new Date(parent.last_assigned_at).getTime();
        if (now.getTime() - lastAssignedTime < ttlMs) {
            const account = await db.prepare("SELECT id, username, password FROM account_pool WHERE id = ? AND status = 'VALID'")
                .get(parent.last_account_id) as any;
            if (account) return account;
        }
    }

    // 3. 全新发号逻辑 - 获取当前池子
    const pool = await db.prepare("SELECT id, username, password FROM account_pool WHERE status = 'VALID' ORDER BY created_at ASC").all() as any[];
    if (pool.length === 0) return null;

    // 获取当前指针
    let pointerRow = await db.prepare("SELECT value FROM system_config WHERE key = 'global_pointer'").get() as any;
    let pointer = pointerRow ? parseInt(pointerRow.value, 10) : 0;

    // 容错：如果指针超出当前池子范围
    if (pointer >= pool.length) {
        pointer = 0;
    }

    const selectedAccount = pool[pointer];

    // 4. 更新家长分配记录
    await db.prepare('UPDATE parents SET last_account_id = ?, last_assigned_at = ? WHERE phone = ?')
        .run(selectedAccount.id, now.toISOString(), parentPhone);

    // 5. 移动指针
    let nextPointer = pointer + 1;

    // 检查是否完成一圈遍历
    if (nextPointer >= pool.length) {
        nextPointer = 0;

        // 更新最后一次遍历耗时监控
        const currentCycle = await db.prepare('SELECT * FROM cycle_logs WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1').get() as any;
        if (currentCycle) {
            const startTime = new Date(currentCycle.start_time).getTime();
            const durationSeconds = Math.floor((now.getTime() - startTime) / 1000);
            await db.prepare('UPDATE cycle_logs SET end_time = ?, duration = ? WHERE id = ?')
                .run(now.toISOString(), durationSeconds, currentCycle.id);
        }
        // 开启新的一圈
        await db.prepare('INSERT INTO cycle_logs (start_time) VALUES (?)').run(now.toISOString());
    }

    await db.prepare("UPDATE system_config SET value = ? WHERE key = 'global_pointer'").run(nextPointer.toString());

    // 确保至少有一个活跃的循环记录
    const activeCycle = await db.prepare('SELECT COUNT(*) as count FROM cycle_logs WHERE end_time IS NULL').get() as any;
    if (activeCycle.count === 0) {
        await db.prepare('INSERT INTO cycle_logs (start_time) VALUES (?)').run(now.toISOString());
    }

    return selectedAccount;
}
