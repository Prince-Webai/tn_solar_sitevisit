import connectToDatabase from '../mongodb';
import { Job as JobModel, Client as ClientModel, Profile as ProfileModel, AuditLog as AuditLogModel, JobChecklist as JobChecklistModel } from '../models';
import type { Job, Client } from '../types';

/**
 * Helper to convert Mongo document to App Type (mapping _id to id)
 */
const mapDoc = (doc: any) => {
  if (!doc) return null;
  // Handle both Mongoose documents and plain objects
  const obj = doc.toObject ? doc.toObject() : doc;
  const { _id, ...rest } = obj;
  return { id: _id, ...rest };
};

export const jobService = {
  /**
   * Fetch all jobs with their associated client data, optionally filtered by role/user
   */
  async fetchJobs(filters?: { assigned_to?: string; role?: string; userId?: string; statuses?: string[]; fields?: string }) {
    await connectToDatabase();
    try {
      let query: any = {};
      
      // Auto-filter for Engineers/Technicians if role/userId provided
      if (filters?.role === 'Engineer' || filters?.role === 'Technician') {
        query.assigned_to = filters.userId;
      } else if (filters?.assigned_to) {
        query.assigned_to = filters.assigned_to;
      }

      if (filters?.statuses && filters.statuses.length > 0) {
        query.status = { $in: filters.statuses };
      }

      const jobs = await JobModel.find(query)
        .populate('client_id')
        .populate('assigned_to')
        .sort({ created_at: -1 });

      return jobs.map(job => {
        const mapped = mapDoc(job);
        if (job.client_id) mapped.client = mapDoc(job.client_id);
        if (job.assigned_to) mapped.assigned_staff = mapDoc(job.assigned_to);
        return mapped;
      }) as Job[];
    } catch (err) {
      console.error('Unexpected error in fetchJobs:', err);
      return [];
    }
  },

  /**
   * Fetch a single job by ID with client data
   */
  async fetchJobById(jobId: string) {
    await connectToDatabase();
    try {
      const job = await JobModel.findById(jobId).populate('client_id');
      if (!job) return null;
      
      const mapped = mapDoc(job);
      if (job.client_id) mapped.client = mapDoc(job.client_id);
      return mapped as Job;
    } catch (err) {
      console.error('Unexpected error in fetchJobById:', err);
      return null;
    }
  },

  /**
   * Fetch unscheduled jobs
   */
  async fetchUnscheduledJobs() {
    await connectToDatabase();
    try {
      const jobs = await JobModel.find({
        scheduled_date: null,
        status: { $nin: ["Completed", "Cancelled", "Unsuccessful"] }
      })
      .populate('client_id')
      .sort({ created_at: -1 });

      return jobs.map(job => {
        const mapped = mapDoc(job);
        if (job.client_id) mapped.client = mapDoc(job.client_id);
        return mapped;
      }) as Job[];
    } catch (err) {
      console.error('Unexpected error in fetchUnscheduledJobs:', err);
      return [];
    }
  },

  /**
   * Update a job's status or other fields
   */
  async updateJob(jobId: string, updates: Partial<Job>, userId?: string) {
    await connectToDatabase();
    // Remove id from updates to avoid Mongo error if it's passed in
    const { id, ...cleanUpdates } = updates as any;
    
    const job = await JobModel.findByIdAndUpdate(jobId, { $set: cleanUpdates }, { new: true });
    if (!job) throw new Error('Job not found');

    // Auto-log activity
    if (userId) {
      this.logActivity({
        userId,
        action: 'job_updated',
        entityType: 'job',
        entityId: jobId,
        details: `Updated job status to ${updates.status || 'current status'}`
      }).catch(err => console.error('Silent logging failure:', err));
    }

    return mapDoc(job) as Job;
  },

  /**
   * Assign a job to a staff member and set the schedule date
   */
  async assignJob(jobId: string, staffId: string, scheduledDate: string, userId?: string) {
    return this.updateJob(jobId, {
      assigned_to: staffId,
      scheduled_date: scheduledDate,
    } as any, userId);
  },

  /**
   * Create a new job
   */
  async createJob(job: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'job_number'>, userId?: string) {
    await connectToDatabase();
    
    let attempts = 0;
    let lastError = null;

    while (attempts < 3) {
      const phoneDigits = job.contact_phone ? job.contact_phone.replace(/\D/g, '').slice(-10) : '';
      const suffix = Math.floor(1000 + Math.random() * 8999);
      const jobNumber = phoneDigits 
        ? `TN-${phoneDigits}-${suffix}` 
        : `TN-${Date.now().toString().slice(-6)}-${suffix}`;
      
      try {
        const newJob = new JobModel({
          ...job,
          _id: crypto.randomUUID(), 
          job_number: jobNumber
        });
        const saved = await newJob.save();

        if (userId) {
          this.logActivity({
            userId,
            action: 'job_created',
            entityType: 'job',
            entityId: saved._id,
            details: `Created new Job #${saved.job_number} for ${job.contact_name}`
          }).catch(err => console.error('Silent logging failure:', err));
        }
        return mapDoc(saved) as Job;
      } catch (error: any) {
        if (error.code === 11000 && error.message?.includes('job_number')) {
          attempts++;
          lastError = error;
          continue;
        }
        throw error;
      }
    }
    throw lastError || new Error('Failed to generate a unique job number');
  },

  /**
   * Delete a job and its associated data
   */
  async deleteJob(jobId: string) {
    await connectToDatabase();
    // Delete checklist items first
    await JobChecklistModel.deleteMany({ job_id: jobId });
    // Delete the job
    await JobModel.findByIdAndDelete(jobId);
  },

  /**
   * Save checklist items for a job
   */
  async saveChecklist(jobId: string, items: { text: string; completed: boolean }[]) {
    await connectToDatabase();
    
    // Replace existing items
    await JobChecklistModel.deleteMany({ job_id: jobId });
    
    if (items.length === 0) return;

    const itemsToInsert = items.map((item, index) => ({
      _id: crypto.randomUUID(),
      job_id: jobId,
      text: item.text,
      completed: item.completed,
      sort_order: index
    }));

    await JobChecklistModel.insertMany(itemsToInsert);
  },

  /**
   * Fetch checklist items for a job
   */
  async fetchChecklist(jobId: string) {
    await connectToDatabase();
    const items = await JobChecklistModel.find({ job_id: jobId }).sort({ sort_order: 1 });
    return items.map(mapDoc);
  },

  /**
   * Create a new client
   */
  async createClient(client: Omit<Client, 'id' | 'created_at'>) {
    await connectToDatabase();
    const newClient = new ClientModel({
      ...client,
      _id: crypto.randomUUID()
    });
    const saved = await newClient.save();
    return mapDoc(saved) as Client;
  },

  /**
   * Fetch all staff locations
   */
  async fetchStaffLocations() {
    // Currently placeholder
    return [];
  },

  /**
   * Fetch all clients
   */
  async fetchClients() {
    await connectToDatabase();
    const clients = await ClientModel.find({}).sort({ last_name: 1 });
    return clients.map(mapDoc) as Client[];
  },

  /**
   * Search for jobs and clients
   */
  async search(query: string) {
    await connectToDatabase();
    const regex = new RegExp(query, 'i');

    const [jobData, clientData, profileData] = await Promise.all([
      JobModel.find({
        $or: [
          { job_number: regex },
          { address: regex },
          { description: regex },
          { contact_name: regex }
        ]
      }).populate('client_id').limit(5),
      ClientModel.find({
        $or: [
          { first_name: regex },
          { last_name: regex },
          { email: regex },
          { phone: regex }
        ]
      }).limit(5),
      ProfileModel.find({
        $or: [
          { full_name: regex },
          { email: regex }
        ]
      }).limit(5)
    ]);

    return { 
      jobs: jobData.map(j => {
        const m = mapDoc(j);
        if (j.client_id) m.client = mapDoc(j.client_id);
        return m;
      }) as Job[], 
      clients: clientData.map(mapDoc) as Client[],
      profiles: profileData.map(mapDoc) as any[]
    };
  },

  /**
   * Fetch audit logs for a specific job
   */
  async fetchAuditLogsByJobId(jobId: string) {
    await connectToDatabase();
    const logs = await AuditLogModel.find({ entity_id: jobId, entity_type: 'job' }).sort({ created_at: -1 });
    return logs.map(mapDoc);
  },

  /**
   * Fetch audit logs for system activity
   */
  async fetchAuditLogs() {
    await connectToDatabase();
    const logs = await AuditLogModel.find({}).sort({ created_at: -1 }).limit(50);
    return logs.map(mapDoc);
  },

  /**
   * Log a system activity/audit event
   */
  async logActivity(params: { userId: string; action: string; entityType: string; entityId?: string; details?: string }) {
    await connectToDatabase();
    const profile = await ProfileModel.findById(params.userId);
    
    const log = new AuditLogModel({
      _id: crypto.randomUUID(),
      user_id: params.userId,
      user_name: profile?.full_name || 'Staff User',
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId,
      details: params.details
    });
    await log.save();
  }
};
