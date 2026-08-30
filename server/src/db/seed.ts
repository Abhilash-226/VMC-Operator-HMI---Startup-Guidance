import fs from 'fs';
import path from 'path';
import { pool } from './pool.js';

async function seed() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();

  try {
    console.log('Creating database schema if not exists...');
    await client.query(schemaSql);

    console.log('Truncating existing session and checklist data...');
    await client.query('TRUNCATE TABLE operation_log CASCADE;');
    await client.query('TRUNCATE TABLE checklist_items CASCADE;');
    await client.query('TRUNCATE TABLE sessions CASCADE;');

    const sessionId = '00000000-0000-0000-0000-000000000001';

    console.log('Inserting default session...');
    await client.query(
      `INSERT INTO sessions (id, machine_id, work_order, current_stage, operation_status)
       VALUES ($1, 'VMC-03', 'WO-2026-0417', 'MACHINE_CHECKS', 'READY')`,
      [sessionId]
    );

    console.log('Inserting Machine Checks checklist...');
    const machineChecks = [
      { key: 'power_available', label: 'Power / control unit available' },
      { key: 'estop_released', label: 'E-stop released' },
      { key: 'door_closed', label: 'Guard door closed' },
      { key: 'no_alarm', label: 'No active alarm' },
      { key: 'lubrication_ok', label: 'Lubrication level OK' },
      { key: 'coolant_ok', label: 'Coolant level OK' },
      { key: 'home_return', label: 'Reference (home) return complete' }
    ];

    for (let i = 0; i < machineChecks.length; i++) {
      const check = machineChecks[i];
      await client.query(
        `INSERT INTO checklist_items (session_id, stage, item_key, label, meta, sort_order)
         VALUES ($1, 'MACHINE_CHECKS', $2, $3, $4, $5)`,
        [sessionId, check.key, check.label, {}, i + 1]
      );
    }

    console.log('Inserting Required Tools checklist...');
    const tools = [
      {
        key: 'tool_T1',
        label: 'Face mill Ø50mm',
        meta: { tool_number: 'T1', type: 'Face mill Ø50mm', description: 'Roughing top face', program_rev: 'O1042 Rev C' }
      },
      {
        key: 'tool_T2',
        label: 'Drill Ø8.5mm',
        meta: { tool_number: 'T2', type: 'Drill Ø8.5mm', description: '6× through holes', program_rev: 'O1042 Rev C' }
      },
      {
        key: 'tool_T3',
        label: 'Tap M10×1.5',
        meta: { tool_number: 'T3', type: 'Tap M10×1.5', description: '6× tapped holes', program_rev: 'O1042 Rev C' }
      },
      {
        key: 'tool_T4',
        label: 'Chamfer tool Ø10mm',
        meta: { tool_number: 'T4', type: 'Chamfer tool Ø10mm', description: 'Edge break, both sides', program_rev: 'O1042 Rev C' }
      }
    ];

    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      await client.query(
        `INSERT INTO checklist_items (session_id, stage, item_key, label, meta, sort_order)
         VALUES ($1, 'TOOLS', $2, $3, $4, $5)`,
        [sessionId, tool.key, tool.label, tool.meta, i + 1]
      );
    }

    console.log('Inserting Workpiece Setup checklist...');
    const workpiece = [
      { key: 'mount_fixture', label: 'Mount fixture VF-12 on table, torque clamps to spec' },
      { key: 'load_material', label: 'Load Ø150mm 6061-T6 round bar, orient keyway to 12 o\'clock' },
      { key: 'clamp_workpiece', label: 'Clamp workpiece — confirm 0.5mm max runout' },
      { key: 'verify_drawing', label: 'Verify drawing Rev C is the version at the station' },
      { key: 'set_offset', label: 'Set work offset G54 from fixture datum' }
    ];

    for (let i = 0; i < workpiece.length; i++) {
      const wp = workpiece[i];
      await client.query(
        `INSERT INTO checklist_items (session_id, stage, item_key, label, meta, sort_order)
         VALUES ($1, 'WORKPIECE', $2, $3, $4, $5)`,
        [sessionId, wp.key, wp.label, {}, i + 1]
      );
    }

    console.log('Database seeded successfully.');
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Check if this script was run directly from CLI
const isDirectRun = () => {
  return require.main === module;
};

if (isDirectRun()) {
  seed().then(() => pool.end());
}

export { seed };
