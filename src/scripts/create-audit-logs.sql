
-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read logs
CREATE POLICY "Allow authenticated users to read audit logs" 
ON public.audit_logs FOR SELECT 
TO authenticated 
USING (true);

-- Create policy to allow all authenticated users to insert logs
CREATE POLICY "Allow authenticated users to insert audit logs" 
ON public.audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
