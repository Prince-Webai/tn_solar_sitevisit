/**
 * Client-side API client — all calls go through Next.js API routes.
 * This file can safely be imported by 'use client' components.
 * Mongoose (and all Node.js-only code) lives server-side in /api/... routes.
 */

import type { Job, Client } from '@/lib/types';
import type { SiteVisitData } from '@/types/site-visit';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export const jobApi = {
  fetchJobs: (filters?: { role?: string; userId?: string; statuses?: string[] }): Promise<Job[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.set('role', filters.role);
    if (filters?.userId) params.set('userId', filters.userId);
    if (filters?.statuses?.length) params.set('statuses', filters.statuses.join(','));
    return apiFetch<Job[]>(`/api/jobs?${params.toString()}`);
  },

  fetchJobById: (jobId: string): Promise<Job | null> =>
    apiFetch<Job>(`/api/jobs/${jobId}`).catch(() => null),

  createJob: (job: any, userId?: string): Promise<Job> =>
    apiFetch<Job>('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...job, userId }),
    }),

  updateJob: (jobId: string, updates: Partial<Job>, userId?: string): Promise<Job> =>
    apiFetch<Job>(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, userId }),
    }),

  assignJob: (jobId: string, staffId: string, scheduledDate: string, userId?: string): Promise<Job> =>
    apiFetch<Job>(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to: staffId, scheduled_date: scheduledDate, userId }),
    }),

  deleteJob: (jobId: string): Promise<void> =>
    apiFetch<void>(`/api/jobs/${jobId}`, { method: 'DELETE' }),

  fetchChecklist: (jobId: string) =>
    apiFetch<any[]>(`/api/jobs/${jobId}/checklist`),

  saveChecklist: (jobId: string, items: { text: string; completed: boolean }[]) =>
    apiFetch<void>(`/api/jobs/${jobId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    }),

  fetchAuditLogsByJobId: (jobId: string) =>
    apiFetch<any[]>(`/api/jobs/${jobId}/audit-logs`),

  fetchStaffLocations: async () => [] as any[],
};

// ─── Clients ─────────────────────────────────────────────────────────────────

export const clientApi = {
  fetchClients: (): Promise<Client[]> => apiFetch<Client[]>('/api/clients'),

  createClient: (client: Omit<Client, 'id' | 'created_at'>): Promise<Client> =>
    apiFetch<Client>('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    }),
};

// ─── Search ──────────────────────────────────────────────────────────────────

export const searchApi = {
  search: (query: string) =>
    apiFetch<{ jobs: Job[]; clients: Client[]; profiles: any[] }>(`/api/search?q=${encodeURIComponent(query)}`),
};

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export const auditApi = {
  fetchAuditLogs: () => apiFetch<any[]>('/api/audit-logs'),

  logActivity: (params: { userId: string; action: string; entityType: string; entityId?: string; details?: string }) =>
    apiFetch<void>('/api/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }),
};

// ─── Site Visits ─────────────────────────────────────────────────────────────

export const siteVisitApi = {
  fetchByJobId: (jobId: string): Promise<SiteVisitData | null> =>
    apiFetch<SiteVisitData | null>(`/api/site-visits?jobId=${jobId}`),

  upsertSiteVisit: (jobId: string, engineerId: string, data: SiteVisitData) =>
    apiFetch<any>('/api/site-visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, engineerId, data }),
    }),
};

// ─── Unified jobService-compatible export (drop-in replacement) ──────────────
// Allows existing imports like `import { jobService } from '@/lib/api-client'` to work

export const jobService = {
  ...jobApi,
  ...clientApi,
  ...auditApi,
  search: searchApi.search,
};

export const siteVisitService = siteVisitApi;
