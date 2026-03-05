import db from './src/lib/db';
import { getAssignedAccount } from './src/lib/distribution';

async function testDistribution() {
    console.log('--- 开始发号算法压力与逻辑测试 ---');

    // 1. 准备测试数据
    db.exec('DELETE FROM account_pool');
    db.exec('DELETE FROM parents');
    db.exec('UPDATE system_config SET value = "0" WHERE key = "global_pointer"');

    const accounts = [
        { id: 'acc_1', user: 'User1', pass: 'Pass1' },
        { id: 'acc_2', user: 'User2', pass: 'Pass2' },
        { id: 'acc_3', user: 'User3', pass: 'Pass3' },
    ];
    accounts.forEach(a => {
        db.prepare('INSERT INTO account_pool (id, username, password) VALUES (?, ?, ?)').run(a.id, a.user, a.pass);
    });

    db.prepare('INSERT INTO parents (id, phone) VALUES (?, ?)').run('p1', '13000000001');
    db.prepare('INSERT INTO parents (id, phone) VALUES (?, ?)').run('p2', '13000000002');

    // 2. 测试轮询
    console.log('测试轮询逻辑:');
    const r1 = await getAssignedAccount('13000000001');
    console.log(`家长1 首次获取: ${r1?.username} (预期 User1)`);

    const r2 = await getAssignedAccount('13000000002');
    console.log(`家长2 首次获取: ${r2?.username} (预期 User2)`);

    // 3. 测试 1.5h 记忆
    console.log('\n测试 1.5h 记忆逻辑:');
    const r1_again = await getAssignedAccount('13000000001');
    console.log(`家长1 再次获取 (1.5h内): ${r1_again?.username} (预期仍为 User1)`);

    const pointer = db.prepare('SELECT value FROM system_config WHERE key = "global_pointer"').get();
    console.log(`当前指针位置: ${pointer.value} (预期 2，因为记忆逻辑不移指针)`);

    // 4. 测试闭环
    console.log('\n测试闭环逻辑:');
    db.prepare('INSERT INTO parents (id, phone) VALUES (?, ?)').run('p3', '13000000003');
    const r3 = await getAssignedAccount('13000000003');
    console.log(`家长3 获取: ${r3?.username} (预期 User3)`);

    const pointerAfterFull = db.prepare('SELECT value FROM system_config WHERE key = "global_pointer"').get();
    console.log(`全体遍历一遍后指针: ${pointerAfterFull.value} (预期 0)`);

    const cycle = db.prepare('SELECT duration FROM cycle_logs WHERE end_time IS NOT NULL ORDER BY id DESC LIMIT 1').get();
    console.log(`遍历耗时记录已生成: ${cycle ? '是' : '否'}`);

    console.log('--- 测试完成 ---');
}

testDistribution().catch(console.error);
