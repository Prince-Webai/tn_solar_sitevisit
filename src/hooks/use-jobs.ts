import useSWR, { useSWRConfig } from 'swr';
import { jobService } from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import type { Job } from '@/lib/types';

export function useJobs() {
  const { user, profile, loading: authLoading } = useAuth();
  const { mutate: globalMutate } = useSWRConfig();

  const key = !authLoading && user && profile 
    ? ['jobs', profile.role, user.id] 
    : null;

  const { data: jobs = [], error, isLoading, isValidating, mutate } = useSWR<Job[]>(
    key,
    async () => {
      return await jobService.fetchJobs({
        role: profile?.role,
        userId: user?.id
      });
    },
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      dedupingInterval: 2000, // Reduced for more frequent updates
    }
  );

  const revalidateJobs = async () => {
    if (key) {
      return await mutate();
    }
    // Fallback to global mutate if key isn't ready
    return await globalMutate(['jobs', profile?.role, user?.id]);
  };

  return {
    jobs,
    error,
    isLoading,
    isValidating,
    revalidateJobs,
    mutate
  };
}
