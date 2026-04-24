-- Seed data for VisionSolar
-- Run this in the Supabase SQL Editor

-- 1. Insert some Clients
INSERT INTO public.clients (first_name, last_name, email, phone, mobile, address)
VALUES 
('Michael', 'Thompson', 'michael.t@email.com', '03 9876 5432', '0412 345 678', '42 Lonsdale St, Melbourne VIC 3000'),
('Emma', 'Rodriguez', 'emma.r@email.com', '03 9123 4567', '0423 456 789', '15 Chapel St, South Yarra VIC 3141'),
('David', 'Wilson', 'david.w@email.com', '03 9234 5678', '0434 567 890', '88 Bridge Rd, Richmond VIC 3121'),
('Jennifer', 'Patel', 'jen.patel@email.com', '03 9345 6789', '0445 678 901', '23 High St, Kew VIC 3101');

-- 2. Insert some Jobs (linked to clients created above)
-- Note: Using subqueries to get the client IDs
INSERT INTO public.jobs (job_number, client_id, address, suburb, status, category, description, estimated_hours, total_value)
SELECT 
  'VS-1201', 
  id, 
  '42 Lonsdale St, Melbourne VIC 3000', 
  'Melbourne', 
  'Work Order', 
  'Installation', 
  '6.6kW solar panel system installation - 16x Trina Vertex S panels with Fronius inverter', 
  6, 
  8500
FROM public.clients WHERE first_name = 'Michael' AND last_name = 'Thompson' LIMIT 1;

INSERT INTO public.jobs (job_number, client_id, address, suburb, status, category, description, estimated_hours, total_value)
SELECT 
  'VS-1202', 
  id, 
  '15 Chapel St, South Yarra VIC 3141', 
  'South Yarra', 
  'Quote Sent', 
  'Installation', 
  '10kW commercial solar system with battery storage - SolarEdge inverter with Tesla Powerwall', 
  8, 
  18500
FROM public.clients WHERE first_name = 'Emma' AND last_name = 'Rodriguez' LIMIT 1;

INSERT INTO public.jobs (job_number, client_id, address, suburb, status, category, description, estimated_hours, total_value)
SELECT 
  'VS-1203', 
  id, 
  '88 Bridge Rd, Richmond VIC 3121', 
  'Richmond', 
  'Lead', 
  'Site Assessment', 
  'Roof assessment for potential 5kW residential installation', 
  2, 
  0
FROM public.clients WHERE first_name = 'David' AND last_name = 'Wilson' LIMIT 1;

-- 3. Insert Admin User Profile
INSERT INTO public.profiles (id, email, full_name, role)
VALUES ('8f570fdb-29cf-4e95-8e80-9d4a016e35b6', 'work.devashishbhavsar14@gmail.com', 'Devashish Bhavsar', 'Admin');

