import { createClient } from './client';
import type { Job, Client } from '../types';

export const jobService = {
  /**
   * Fetch all jobs with their associated client data, optionally filtered by role/user
   */
  async fetchJobs(filters?: { assigned_to?: string; role?: string; userId?: string; statuses?: string[] }) {
    const supabase = createClient();
    try {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          client:clients(*),
          assigned_staff:profiles(*)
        `);
      
      // Auto-filter for Engineers/Technicians if role/userId provided
      if (filters?.role === 'Engineer' || filters?.role === 'Technician') {
        query = query.eq('assigned_to', filters.userId);
      } else if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters?.statuses && filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        return []; // Return empty instead of hanging
      }

      return (data || []) as Job[];
    } catch (err) {
      console.error('Unexpected error in fetchJobs:', err);
      return [];
    }
  },

  /**
   * Fetch a single job by ID with client data
   */
  async fetchJobById(jobId: string) {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error fetching job by ID:', error);
        return null;
      }

      return data as Job;
    } catch (err) {
      console.error('Unexpected error in fetchJobById:', err);
      return null;
    }
  },

  /**
   * Fetch unscheduled jobs
   */
  async fetchUnscheduledJobs() {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          client:clients(*)
        `)
        .is('scheduled_date', null)
        .not('status', 'in', '("Completed", "Cancelled", "Unsuccessful")')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching unscheduled jobs:', error);
        return [];
      }

      return (data || []) as Job[];
    } catch (err) {
      console.error('Unexpected error in fetchUnscheduledJobs:', err);
      return [];
    }
  },

  /**
   * Update a job's status or other fields
   */
  async updateJob(jobId: string, updates: Partial<Job>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('Error updating job:', error);
      throw error;
    }

    return data as Job;
  },

  /**
   * Assign a job to a staff member and set the schedule date
   */
  async assignJob(jobId: string, staffId: string, scheduledDate: string) {
    return this.updateJob(jobId, {
      assigned_to: staffId,
      scheduled_date: scheduledDate,
    });
  },

  /**
   * Create a new job
   */
  async createJob(job: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'job_number'>) {
    const supabase = createClient();
    
    // Generate a simple job number for now
    const jobNumber = `TN-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const { data, error } = await supabase
      .from('jobs')
      .insert({ ...job, job_number: jobNumber })
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      throw error;
    }

    return data as Job;
  },

  /**
   * Save checklist items for a job
   */
  async saveChecklist(jobId: string, items: { text: string; completed: boolean }[]) {
    const supabase = createClient();
    
    // First, delete existing items to replace them (simplest way for now)
    await supabase.from('job_checklist').delete().eq('job_id', jobId);
    
    if (items.length === 0) return;

    const itemsToInsert = items.map((item, index) => ({
      job_id: jobId,
      text: item.text,
      completed: item.completed,
      sort_order: index
    }));

    const { error } = await supabase
      .from('job_checklist')
      .insert(itemsToInsert);

    if (error) {
      console.error('Error saving checklist:', error);
      throw error;
    }
  },

  /**
   * Fetch checklist items for a job
   */
  async fetchChecklist(jobId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('job_checklist')
      .select('*')
      .eq('job_id', jobId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching checklist:', error);
      throw error;
    }

    return data;
  },

  /**
   * Create a new client
   */
  async createClient(client: Omit<Client, 'id' | 'created_at'>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      throw error;
    }

    return data as Client;
  },

  /**
   * Fetch all staff locations
   */
  async fetchStaffLocations() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('staff_locations')
      .select(`
        *,
        profile:profiles(*)
      `);

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Staff locations table not found. Please run the migration.');
        return [];
      }
      console.error('Error fetching staff locations:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Fetch all clients
   */
  async fetchClients() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('last_name', { ascending: true });

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    return data as Client[];
  },

  /**
   * Search for jobs and clients
   */
  async search(query: string) {
    const supabase = createClient();
    const q = `%${query}%`;

    // Search jobs
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('*, client:clients(*)')
      .or(`job_number.ilike.${q},address.ilike.${q},description.ilike.${q}`)
      .limit(5);

    // Search clients
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .or(`first_name.ilike.${q},last_name.ilike.${q},email.ilike.${q}`)
      .limit(5);

    // Search profiles (staff)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.${q},email.ilike.${q}`)
      .limit(5);

    if (jobError || clientError || profileError) {
      console.error('Search error:', jobError || clientError || profileError);
      return { jobs: [], clients: [], profiles: [] };
    }

    return { 
      jobs: (jobData || []) as Job[], 
      clients: (clientData || []) as Client[],
      profiles: (profileData || []) as any[]
    };
  },

  /**
   * Fetch audit logs for system activity
   */
  async fetchAuditLogs() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    return data;
  }
};
