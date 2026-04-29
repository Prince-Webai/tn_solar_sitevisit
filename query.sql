SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'jobs_status_check';
