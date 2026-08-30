CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id TEXT DEFAULT 'VMC-03',
  work_order TEXT DEFAULT 'WO-2026-0417',
  current_stage TEXT CHECK (current_stage IN ('MACHINE_CHECKS','TOOLS','WORKPIECE','READY_REVIEW','OPERATION')) DEFAULT 'MACHINE_CHECKS',
  operation_status TEXT CHECK (operation_status IN ('READY','RUNNING','STOPPED')) DEFAULT 'READY',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  stage TEXT CHECK (stage IN ('MACHINE_CHECKS','TOOLS','WORKPIECE')),
  item_key TEXT,
  label TEXT,
  meta JSONB,
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  sort_order INT
);

CREATE TABLE IF NOT EXISTS operation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  event TEXT CHECK (event IN ('START','STOP')),
  at TIMESTAMPTZ DEFAULT now()
);
