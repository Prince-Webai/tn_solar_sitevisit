'use client';

import { useState, useEffect } from 'react';
import { Search, Clock, MapPin, GripVertical, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { jobService } from '@/lib/supabase/service';
import { useAuth } from '@/components/providers/auth-provider';
import type { Job } from '@/lib/types';

function JobCard({ job }: { job: Job }) {
  const isQuoteType =
    ['Quote', 'Quote Sent', 'Lead', 'Site Assessment'].includes(job.status) ||
    job.category === 'Site Assessment';
  const borderColor = isQuoteType ? 'border-l-solar-orange' : 'border-l-blue-500';

  const handleDragStart = (e: React.DragEvent) => {
    // Set the job ID so the drop target can read it
    e.dataTransfer.setData('text/plain', job.id); // Standardize on 'text/plain' as used in other components
    e.dataTransfer.setData('application/job-id', job.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`bg-white rounded-lg border border-light-gray ${borderColor} border-l-[3px] p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 group select-none`}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-light-gray mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-vision-green">{job.job_number}</span>
            {job.estimated_hours && (
              <Badge variant="secondary" className="text-[10px] bg-off-white text-dark-gray px-1.5 py-0 h-5">
                <Clock className="w-2.5 h-2.5 mr-1" />
                {job.estimated_hours}h
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium text-charcoal truncate">
            {job.client?.first_name} {job.client?.last_name}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-mid-gray shrink-0" />
            <p className="text-xs text-mid-gray truncate">{job.suburb || job.address}</p>
          </div>
          {job.description && (
            <p className="text-xs text-dark-gray mt-1.5 line-clamp-2">
              {job.description.substring(0, 60)}{job.description.length > 60 ? '...' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface UnscheduledJobsProps {
  refreshKey?: number;
}

export function UnscheduledJobs({ refreshKey }: UnscheduledJobsProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const [search, setSearch]     = useState('');
  const [allJobs, setAllJobs]   = useState<Job[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      if (!user || !profile) return;
      setLoading(true);
      try {
        const data = await jobService.fetchJobs({
          role: profile.role,
          userId: user.id
        });
        setAllJobs(data);
      } catch (err) {
        console.error('Failed to load jobs:', err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) load();
  }, [refreshKey, user, profile, authLoading]);

  // Unscheduled = no assigned_to OR no scheduled_date, and not completed/cancelled
  // For Engineers, they only see jobs assigned to them, so "Unscheduled" would be jobs assigned but not dated
  const unscheduled = allJobs.filter(j =>
    (!j.assigned_to || !j.scheduled_date) &&
    !['Completed', 'Cancelled', 'Archived'].includes(j.status)
  );

  const filtered = unscheduled.filter(j => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      j.job_number.toLowerCase().includes(q) ||
      (j.client?.first_name?.toLowerCase() ?? '').includes(q) ||
      (j.client?.last_name?.toLowerCase() ?? '').includes(q) ||
      j.address.toLowerCase().includes(q)
    );
  });

  if (authLoading) return null;

  return (
    <div className="w-80 bg-white border-r border-light-gray flex flex-col shrink-0 h-full">
      <div className="p-4 border-b border-light-gray shrink-0">
        <h2 className="text-sm font-semibold text-charcoal mb-3">Unscheduled Jobs</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mid-gray" />
          <Input
            id="dispatch-search"
            placeholder="Search by name, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-off-white border-light-gray"
          />
        </div>
        <p className="text-xs text-mid-gray mt-2">
          {loading ? 'Loading...' : `${filtered.length} job${filtered.length !== 1 ? 's' : ''} unscheduled`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-vision-green animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-mid-gray">No unscheduled jobs</p>
            <p className="text-xs text-mid-gray mt-1">All jobs have been allocated!</p>
          </div>
        ) : (
          filtered.map(job => <JobCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}
