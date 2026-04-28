import mongoose, { Schema } from 'mongoose';

// Ensure we don't redefine models in dev
const models = mongoose.models;

/**
 * -------------------
 * PROFILE (Staff)
 * -------------------
 */
const ProfileSchema = new Schema({
  _id: { type: String, required: true }, // Using Supabase UUID
  email: { type: String, required: true },
  full_name: { type: String, required: true },
  role: { type: String, required: true },
  avatar_url: { type: String },
  status: { type: String }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const Profile = models.Profile || mongoose.model('Profile', ProfileSchema);

/**
 * -------------------
 * CLIENT
 * -------------------
 */
const ClientSchema = new Schema({
  _id: { type: String, required: true }, // Using Supabase UUID
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  mobile: { type: String },
  address: { type: String },
  district: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const Client = models.Client || mongoose.model('Client', ClientSchema);

/**
 * -------------------
 * JOB
 * -------------------
 */
const JobSchema = new Schema({
  _id: { type: String, required: true }, // Using Supabase UUID
  job_number: { type: String, required: true, unique: true },
  client_id: { type: String, ref: 'Client', required: true },
  address: { type: String, required: true },
  suburb: { type: String },
  district: { type: String },
  status: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  po_number: { type: String },
  scheduled_date: { type: Date },
  completed_date: { type: Date },
  estimated_hours: { type: Number },
  system_size: { type: String },
  requires_site_visit: { type: Boolean, default: false },
  materials_status: { type: String },
  invoice_status: { type: String },
  total_value: { type: Number },
  assigned_to: { type: String, ref: 'Profile' },
  contact_name: { type: String },
  contact_email: { type: String },
  contact_phone: { type: String },
  billing_same_as_job: { type: Boolean, default: true },
  billing_address: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const Job = models.Job || mongoose.model('Job', JobSchema);

/**
 * -------------------
 * JOB CHECKLIST
 * -------------------
 */
const JobChecklistSchema = new Schema({
  _id: { type: String, required: true }, // Using Supabase UUID
  job_id: { type: String, ref: 'Job', required: true },
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  sort_order: { type: Number, default: 0 }
}, { timestamps: false });

export const JobChecklist = models.JobChecklist || mongoose.model('JobChecklist', JobChecklistSchema);

/**
 * -------------------
 * SITE VISIT
 * -------------------
 */
const SiteVisitSchema = new Schema({
  _id: { type: String, required: true }, // Using Supabase UUID
  job_id: { type: String, ref: 'Job', required: true, unique: true },
  engineer_id: { type: String, ref: 'Profile' },
  client_name: { type: String },
  client_phone: { type: String },
  site_address: { type: String },
  district: { type: String },
  site_gps: { type: String },
  no_of_floors: { type: String },
  other_floor_value: { type: String },
  phase: { type: String },
  photos: { type: Schema.Types.Mixed }, // Array of strings or objects depending on your structure
  videos: { type: Schema.Types.Mixed },
  solar_space: { type: Schema.Types.Mixed },
  structure: { type: Schema.Types.Mixed },
  electrical: { type: Schema.Types.Mixed },
  signature_url: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const SiteVisit = models.SiteVisit || mongoose.model('SiteVisit', SiteVisitSchema);

/**
 * -------------------
 * AUDIT LOG
 * -------------------
 */
const AuditLogSchema = new Schema({
  _id: { type: String, required: true }, // Using Supabase UUID
  user_id: { type: String, ref: 'Profile' },
  user_name: { type: String },
  action: { type: String, required: true },
  entity_type: { type: String },
  entity_id: { type: String },
  details: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export const AuditLog = models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
