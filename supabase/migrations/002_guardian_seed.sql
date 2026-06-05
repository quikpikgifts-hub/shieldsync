-- ──────────────────────────────────────────────────────────────────
-- Guardian Strategic Security, LLC — Complete Seed Data
-- Demo Tenant for ShieldSync Sentinel
-- ──────────────────────────────────────────────────────────────────

-- ── INSERT TENANT ─────────────────────────────────────────────────
insert into tenants (id, name, short_name, hq, license_num, founded, phone, email, website, plan)
values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Guardian Strategic Security, LLC',
  'Guardian',
  'Orlando, FL',
  'FL Class D/G — Lic# B2200348',
  '2014',
  '(407) 555-0192',
  'ops@guardianstrategic.com',
  'www.guardianstrategic.com',
  'enterprise'
);

-- ── INSERT SITES ──────────────────────────────────────────────────
insert into sites (id, tenant_id, name, type, client_name, address, officers_count, patrol_freq_min, health_score, status, contract_value, lat, lon)
values
  ('s1000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Orlando Regional Hospital', 'Healthcare', 'Orlando Health System',
   '1414 Kuhl Ave, Orlando, FL 32806', 12, 30, 94, 'Active', '$84,000/mo',
   28.5253, -81.3784),
  ('s1000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Lake Nona Corporate Campus', 'Corporate', 'Tavistock Group',
   '6900 Tavistock Lakes Blvd, Orlando, FL 32827', 6, 60, 88, 'Active', '$42,000/mo',
   28.3772, -81.2442),
  ('s1000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Winter Garden Distribution Center', 'Industrial', 'Amazon Logistics FL',
   '2100 Winter Garden Vineland Rd, Winter Garden, FL 34787', 8, 45, 91, 'Active', '$56,000/mo',
   28.5653, -81.5862),
  ('s1000000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Resort Security Complex', 'Hospitality', 'Marriott Vacations Worldwide',
   '8800 Worldquest Blvd, Orlando, FL 32821', 10, 30, 79, 'Alert', '$70,000/mo',
   28.4144, -81.4934),
  ('s1000000-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'Metro Transit Hub', 'Transportation', 'LYNX Central Florida',
   '455 N Garland Ave, Orlando, FL 32801', 15, 15, 72, 'Active', '$105,000/mo',
   28.5435, -81.3784);

-- ── INSERT USERS ──────────────────────────────────────────────────
insert into users (id, tenant_id, email, name, role, badge, title, avatar, active, mfa_enabled)
values
  ('u1000000-0000-0000-0000-000000000001','a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'ceo@guardian.demo','Robert Martinez','Executive','EXEC-001','Chief Executive Officer','RM',true,true),
  ('u1000000-0000-0000-0000-000000000002','a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'coo@guardian.demo','Sarah Jenkins','Company Admin','EXEC-002','Chief Operating Officer','SJ',true,true),
  ('u1000000-0000-0000-0000-000000000003','a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'operations@guardian.demo','Michael Thompson','Operations Manager','OPS-001','Director of Operations','MT',true,false),
  ('u1000000-0000-0000-0000-000000000004','a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'dispatch@guardian.demo','Lisa Brown','Dispatcher','DISP-001','Dispatch Supervisor','LB',true,false),
  ('u1000000-0000-0000-0000-000000000005','a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'supervisor@guardian.demo','David Wilson','Supervisor','SUP-401','Field Supervisor — Zone A','DW',true,false),
  ('u1000000-0000-0000-0000-000000000006','a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'mw@guardian.demo','Michael Williams','Officer','G-0241','Security Officer','MW',true,false),
  ('u1000000-0000-0000-0000-000000000007','a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'jd@guardian.demo','James Davis','Officer','G-0189','Security Officer','JD',true,false),
  ('u1000000-0000-0000-0000-000000000008','a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'at@guardian.demo','Ashley Thomas','Officer','G-0312','Security Officer','AT',true,false),
  ('u1000000-0000-0000-0000-000000000009','a1b2c3d4-e5f6-7890-abcd-ef1234567890',
   'rj@guardian.demo','Robert Johnson','Officer','G-0278','Security Officer','RJ',true,false);

-- ── INSERT CHECKPOINTS ────────────────────────────────────────────
insert into checkpoints (id, tenant_id, site_id, name, freq_min, qr_code)
values
  -- Orlando Regional Hospital
  ('c1000000-0000-0000-0000-000000000001','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000001','Main Entrance Lobby',30,'QR-GS001-CP001'),
  ('c1000000-0000-0000-0000-000000000002','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000001','Emergency Department Entry',30,'QR-GS001-CP002'),
  ('c1000000-0000-0000-0000-000000000003','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000001','Parking Garage Level 1',30,'QR-GS001-CP003'),
  ('c1000000-0000-0000-0000-000000000004','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000001','ICU Wing — Secured Entry',30,'QR-GS001-CP004'),
  ('c1000000-0000-0000-0000-000000000005','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000001','Pharmacy Secure Room',60,'QR-GS001-CP005'),
  -- Lake Nona Corporate
  ('c1000000-0000-0000-0000-000000000006','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000002','Executive Entrance',60,'QR-GS002-CP001'),
  ('c1000000-0000-0000-0000-000000000007','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000002','Server Room Corridor',60,'QR-GS002-CP002'),
  ('c1000000-0000-0000-0000-000000000008','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000002','Loading Bay East',60,'QR-GS002-CP003'),
  -- Winter Garden DC
  ('c1000000-0000-0000-0000-000000000009','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000003','Dock Gate 1',45,'QR-GS003-CP001'),
  ('c1000000-0000-0000-0000-000000000010','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000003','Dock Gate 2',45,'QR-GS003-CP002'),
  ('c1000000-0000-0000-0000-000000000011','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000003','North Fence Perimeter',45,'QR-GS003-CP003'),
  -- Resort Security Complex
  ('c1000000-0000-0000-0000-000000000012','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000004','Main Resort Lobby',30,'QR-GS004-CP001'),
  ('c1000000-0000-0000-0000-000000000013','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000004','Pool Deck A',30,'QR-GS004-CP002'),
  ('c1000000-0000-0000-0000-000000000014','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000004','Pool Deck B',30,'QR-GS004-CP003'),
  -- Metro Transit Hub
  ('c1000000-0000-0000-0000-000000000015','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000005','Main Terminal Entry',15,'QR-GS005-CP001'),
  ('c1000000-0000-0000-0000-000000000016','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000005','Bus Bay Alpha',15,'QR-GS005-CP002'),
  ('c1000000-0000-0000-0000-000000000017','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000005','Platform 1 North',15,'QR-GS005-CP003'),
  ('c1000000-0000-0000-0000-000000000018','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000005','Platform 2 South',15,'QR-GS005-CP004');

-- ── INSERT INCIDENTS ──────────────────────────────────────────────
insert into incidents (id, tenant_id, site_id, incident_num, type, severity, status, priority, narrative, occurred_at)
values
  ('i1000000-0000-0000-0000-000000000001','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000001',
   'GINC-1041','Combative Patient','Critical','Active',1,
   'Patient in ER Bay 4 became combative during triage. Code Gray activated. Law enforcement notified.',
   now() - interval '47 minutes'),
  ('i1000000-0000-0000-0000-000000000002','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000005',
   'GINC-1040','Suspicious Person','High','Investigating',2,
   'Male subject observed pacing Platform 2 for 40+ minutes. No ticket, no destination. Under observation.',
   now() - interval '81 minutes'),
  ('i1000000-0000-0000-0000-000000000003','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000004',
   'GINC-1039','Unauthorized Access','High','Investigating',2,
   'Non-registered individual found in Pool Deck B restricted area. Under investigation.',
   now() - interval '114 minutes'),
  ('i1000000-0000-0000-0000-000000000004','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000003',
   'GINC-1038','Vehicle Accident','Medium','Resolved',3,
   'Minor collision at Dock Gate 2. No injuries. Insurance report filed.',
   now() - interval '195 minutes'),
  ('i1000000-0000-0000-0000-000000000005','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000004',
   'GINC-1037','Lost Child','High','Resolved',2,
   'Child separated from family at resort pool. Located at front desk 14 minutes after report. Closed.',
   now() - interval '229 minutes');

-- ── INSERT VEHICLES ───────────────────────────────────────────────
insert into vehicles (id, tenant_id, plate, make, year, status, site_id, fuel_pct, mileage, condition, has_camera)
values
  ('v1000000-0000-0000-0000-000000000001','a1b2c3d4-e5f6-7890-abcd-ef1234567890','GSS-8421','Ford Explorer',2023,'Deployed','s1000000-0000-0000-0000-000000000001',82,18420,'Excellent',true),
  ('v1000000-0000-0000-0000-000000000002','a1b2c3d4-e5f6-7890-abcd-ef1234567890','GSS-7103','Ford Explorer',2023,'Deployed','s1000000-0000-0000-0000-000000000005',64,22810,'Good',true),
  ('v1000000-0000-0000-0000-000000000003','a1b2c3d4-e5f6-7890-abcd-ef1234567890','GSS-6284','Chevy Tahoe',2022,'Deployed','s1000000-0000-0000-0000-000000000003',71,34290,'Good',true),
  ('v1000000-0000-0000-0000-000000000004','a1b2c3d4-e5f6-7890-abcd-ef1234567890','GSS-5512','Toyota Highlander',2023,'Available',null,91,12440,'Excellent',true),
  ('v1000000-0000-0000-0000-000000000005','a1b2c3d4-e5f6-7890-abcd-ef1234567890','GSS-4897','Ford Explorer',2022,'Deployed','s1000000-0000-0000-0000-000000000004',48,41380,'Good',false),
  ('v1000000-0000-0000-0000-000000000006','a1b2c3d4-e5f6-7890-abcd-ef1234567890','GSS-3341','Chevy Tahoe',2021,'Maintenance',null,22,78920,'Needs Service',false),
  ('v1000000-0000-0000-0000-000000000007','a1b2c3d4-e5f6-7890-abcd-ef1234567890','GSS-9902','Ford Explorer',2023,'Available',null,88,9870,'Excellent',true),
  ('v1000000-0000-0000-0000-000000000008','a1b2c3d4-e5f6-7890-abcd-ef1234567890','GSS-2218','Toyota Highlander',2022,'Deployed','s1000000-0000-0000-0000-000000000005',55,29100,'Good',true);

-- ── INSERT AI ALERTS ──────────────────────────────────────────────
insert into ai_alerts (id, tenant_id, site_id, severity, message, action_label)
values
  ('a1000000-0000-0000-0000-000000000001','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000004',
   'Warning',
   'Officer G-0199 (Harris) completed 74% of assigned patrols this week — below the 90% threshold. Supervisor review recommended.',
   'Review Officer'),
  ('a1000000-0000-0000-0000-000000000002','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000005',
   'Info',
   'Metro Transit Hub generated 4 incidents in the last 24 hours — 3× the 7-day average. Increased patrol density recommended.',
   'Adjust Coverage'),
  ('a1000000-0000-0000-0000-000000000003','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000001',
   'Warning',
   'Average response time at Orlando Regional Hospital increased 18% over the past 7 days (3.2m → 3.8m).',
   'View Analysis'),
  ('a1000000-0000-0000-0000-000000000004','a1b2c3d4-e5f6-7890-abcd-ef1234567890',null,
   'Info',
   'Officer G-0140 (Hart): FL Class D license expires in 47 days. Renewal workflow should begin now.',
   'Start Renewal'),
  ('a1000000-0000-0000-0000-000000000005','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000004',
   'Critical',
   'Pool Deck B checkpoint missed 3 consecutive scans. SLA breach risk in 12 minutes. Supervisor notified.',
   'Dispatch Officer');

-- ── INSERT PATROL ROUTES ──────────────────────────────────────────
insert into patrol_routes (id, tenant_id, site_id, name, freq_min, est_duration_min, active)
values
  ('r1000000-0000-0000-0000-000000000001','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000001','Hospital Alpha Route',30,22,true),
  ('r1000000-0000-0000-0000-000000000002','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000005','Transit Hub Express',15,12,true),
  ('r1000000-0000-0000-0000-000000000003','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000002','Corporate Perimeter',60,35,true),
  ('r1000000-0000-0000-0000-000000000004','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000003','Distribution Center Full',45,30,true),
  ('r1000000-0000-0000-0000-000000000005','a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000004','Resort Grounds',30,25,true);

-- ── INSERT DAR REPORTS ────────────────────────────────────────────
insert into dar_reports (tenant_id, site_id, officer_id, report_date, shift_start, shift_end, patrols_done, checkpoints_done, incidents_count, summary, status)
values
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000001','u1000000-0000-0000-0000-000000000006',
   current_date, '07:00', '19:00', 4, 18, 1,
   'Shift began at 0700. Code Gray activation at 0822 — ER Bay 4 patient combative. Assisted clinical staff. Law enforcement arrived 0850. All checkpoints cleared except Parking Garage Level 1 at 0945 due to maintenance crew.',
   'Submitted'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890','s1000000-0000-0000-0000-000000000005','u1000000-0000-0000-0000-000000000007',
   current_date, '06:00', '18:00', 5, 22, 2,
   'GINC-1040 initiated 0748 — suspicious individual Platform 2. Identified and cleared. Medical assist at 0558 (prior shift overlap). All bus bay checkpoints complete. Platform 1 North missed at 1400 due to congestion.',
   'Submitted');

-- ── RLS POLICY HELPERS ────────────────────────────────────────────
-- Function to check if current user belongs to a given tenant
create or replace function user_tenant_id()
returns uuid language sql stable
as $$
  select tenant_id from users where auth_id = auth.uid() limit 1;
$$;

-- ── REALTIME SUBSCRIPTIONS ────────────────────────────────────────
-- Enable realtime on key tables for live dashboard updates
alter publication supabase_realtime add table checkpoint_scans;
alter publication supabase_realtime add table incidents;
alter publication supabase_realtime add table ai_alerts;
alter publication supabase_realtime add table patrol_sessions;
