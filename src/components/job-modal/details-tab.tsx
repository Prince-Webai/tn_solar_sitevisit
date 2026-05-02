'use client';

import { useState, useEffect } from 'react';
import { Plus, GripVertical, Trash2, Search, MapPin, MapPinned, User, CalendarDays, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { JOB_STATUSES, JOB_CATEGORIES, TN_DISTRICTS } from '@/lib/constants';
import { jobService } from '@/lib/supabase/service';
import { useAuth } from '@/components/providers/auth-provider';
import { toast } from 'sonner';
import type { Client } from '@/lib/types';

const MAX_JOBS_PER_DAY = 6;

function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

interface ChecklistItemType {
  id: string;
  text: string;
  completed: boolean;
}

interface DetailsTabProps {
  jobId?: string;
  onSuccess?: () => void;
}

export function DetailsTab({ jobId, onSuccess }: DetailsTabProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [status, setStatus] = useState('Lead');
  const [category, setCategory] = useState('Installation');
  const [poNumber, setPoNumber] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Chennai');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItemType[]>([
    { id: '1', text: 'Confirm site access requirements', completed: false },
    { id: '2', text: 'Verify roof condition and measurements', completed: false },
  ]);
  const [billingSameAsJob, setBillingSameAsJob] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [slotCount, setSlotCount] = useState(0);
  const [checkingSlots, setCheckingSlots] = useState(false);

  const handleDateSelect = async (date: Date | undefined) => {
    setScheduledDate(date);
    setCalendarOpen(false);
    if (!date) { setSlotCount(0); return; }
    setCheckingSlots(true);
    try {
      const count = await jobService.countJobsForDate(toLocalDateString(date));
      // When editing an existing job that already has this date, don't count itself
      setSlotCount(count);
    } finally {
      setCheckingSlots(false);
    }
  };

  const slotsLeft = MAX_JOBS_PER_DAY - slotCount;
  const dayFull = scheduledDate !== undefined && slotsLeft <= 0;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Fetch clients (non-fatal — some roles may not have access)
        try {
          const clientsData = await jobService.fetchClients();
          setClients(clientsData);
        } catch (clientErr) {
          console.warn('Could not fetch clients (may be RLS restricted):', clientErr);
        }

        if (jobId) {
          const jobData = await jobService.fetchJobById(jobId);
          if (jobData) {
            setSelectedClient(jobData.client_id);
            if (jobData.client) {
              setClientSearch(`${jobData.client.first_name} ${jobData.client.last_name}`);
            }
            setAddress(jobData.address || '');
            setDistrict(jobData.district || 'Chennai');
            setStatus(jobData.status || 'Lead');
            setCategory(jobData.category || 'Installation');
            setPoNumber(jobData.po_number || '');
            setDescription(jobData.description || '');
            setContactName(jobData.contact_name || '');
            setContactEmail(jobData.contact_email || '');
            setContactPhone(jobData.contact_phone || '');
            setBillingSameAsJob(jobData.billing_same_as_job !== false);
            if (jobData.scheduled_date) {
              const d = new Date(jobData.scheduled_date + 'T00:00:00');
              setScheduledDate(d);
              const count = await jobService.countJobsForDate(jobData.scheduled_date);
              // Subtract 1 because this job itself is counted
              setSlotCount(Math.max(0, count - 1));
            }

            // Fetch checklist (non-fatal)
            try {
              const checklistData = await jobService.fetchChecklist(jobId);
              if (checklistData && checklistData.length > 0) {
                setChecklist(checklistData.map((item: any) => ({
                  id: item.id,
                  text: item.text,
                  completed: item.completed
                })));
              }
            } catch (checklistErr) {
              console.warn('Could not fetch checklist:', checklistErr);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load job data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [jobId]);

  const filteredClients = clients.filter(c => {
    if (!clientSearch) return true;
    const q = clientSearch.toLowerCase();
    return (
      (c.first_name ?? '').toLowerCase().includes(q) ||
      (c.last_name ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    );
  });

  const addChecklistItem = () => {
    setChecklist([
      ...checklist,
      { id: Date.now().toString(), text: '', completed: false },
    ]);
  };

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const updateChecklistText = (id: string, text: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, text } : item
    ));
  };

  const selectedClientData = selectedClient
    ? clients.find(c => c.id === selectedClient)
    : null;

  return (
    <div className="p-6 space-y-6">
      {/* Client Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-charcoal flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-mid-gray" />
          Client
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mid-gray" />
          <Input
            id="client-search"
            placeholder="Search existing client or add new..."
            value={clientSearch}
            onChange={(e) => {
              setClientSearch(e.target.value);
              setShowClientDropdown(true);
            }}
            onFocus={() => setShowClientDropdown(true)}
            className="pl-9 h-10 bg-off-white border-light-gray"
          />
          {showClientDropdown && clientSearch && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-light-gray rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {filteredClients.map((c: any) => (
                <button
                  key={c.id}
                  className="w-full text-left px-3 py-2 hover:bg-off-white transition-colors flex items-center gap-3"
                  onClick={() => {
                    setSelectedClient(c.id);
                    setClientSearch(`${c.first_name} ${c.last_name}`);
                    setShowClientDropdown(false);
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary-dark">
                    {c.first_name[0]}{c.last_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">{c.first_name} {c.last_name}</p>
                    <p className="text-xs text-mid-gray">{c.email}</p>
                  </div>
                </button>
              ))}
              <button
                className="w-full text-left px-3 py-2 hover:bg-off-white transition-colors flex items-center gap-2 text-primary border-t border-light-gray"
                onClick={() => setShowClientDropdown(false)}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Create new client</span>
              </button>
            </div>
          )}
        </div>
        {selectedClientData && (
          <div className="bg-off-white rounded-lg p-3 text-xs text-dark-gray space-y-0.5">
            <p><span className="text-mid-gray">Phone:</span> {selectedClientData.phone}</p>
            <p><span className="text-mid-gray">Mobile:</span> {selectedClientData.mobile}</p>
            <p><span className="text-mid-gray">Email:</span> {selectedClientData.email}</p>
          </div>
        )}
      </div>

      {/* Job Address */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-charcoal flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-mid-gray" />
          Job Address
        </label>
        <Input
          id="job-address"
          placeholder="Start typing an address..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="h-10 bg-off-white border-light-gray"
        />
      </div>

      {/* District */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-charcoal flex items-center gap-1.5">
          <MapPinned className="w-3.5 h-3.5 text-mid-gray" />
          District
        </label>
        <Select value={district} onValueChange={(v) => v && setDistrict(v)}>
          <SelectTrigger className="h-10 bg-off-white border-light-gray">
            <SelectValue placeholder="Select District" />
          </SelectTrigger>
          <SelectContent>
            {TN_DISTRICTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status + Category */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-charcoal">Job Status</label>
          <Select value={status} onValueChange={(v) => v && setStatus(v)}>
            <SelectTrigger className="h-10 bg-off-white border-light-gray">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(JOB_STATUSES).map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-charcoal">Category</label>
          <Select value={category} onValueChange={(v) => v && setCategory(v)}>
            <SelectTrigger className="h-10 bg-off-white border-light-gray">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(JOB_CATEGORIES).map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PO Number */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-charcoal">PO Number</label>
        <Input
          id="po-number"
          placeholder="Enter PO number"
          value={poNumber}
          onChange={(e) => setPoNumber(e.target.value)}
          className="h-10 bg-off-white border-light-gray"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-charcoal">Job Description</label>
        <Textarea
          id="job-description"
          placeholder="Describe the work that needs to be done"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-24 bg-off-white border-light-gray resize-none"
        />
      </div>

      <Separator className="bg-light-gray" />

      {/* Checklist */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-charcoal">Checklist</label>
        <div className="space-y-2">
          {checklist.map((item: any) => (
            <div key={item.id} className="flex items-center gap-2 group">
              <GripVertical className="w-4 h-4 text-light-gray cursor-grab shrink-0" />
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => toggleChecklistItem(item.id)}
                className="border-light-gray data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Input
                value={item.text}
                onChange={(e) => updateChecklistText(item.id, e.target.value)}
                placeholder="Checklist item..."
                className={`h-8 flex-1 text-sm bg-transparent border-transparent hover:border-light-gray focus:border-light-gray ${
                  item.completed ? 'line-through text-mid-gray' : ''
                }`}
              />
              <button
                onClick={() => removeChecklistItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-mid-gray hover:text-destructive transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={addChecklistItem}
          className="text-primary hover:text-primary-dark hover:bg-accent gap-1.5 h-8"
        >
          <Plus className="w-3.5 h-3.5" />
          New Item
        </Button>
      </div>

      <Separator className="bg-light-gray" />

      {/* Contacts */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-charcoal">Job Contact</label>
        <div className="grid grid-cols-2 gap-3">
          <Input 
            placeholder="Name" 
            className="h-9 text-sm bg-off-white border-light-gray" 
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
          <Input 
            placeholder="Email" 
            className="h-9 text-sm bg-off-white border-light-gray" 
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
          <Input 
            placeholder="Phone" 
            className="h-9 text-sm bg-off-white border-light-gray" 
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
          <Input 
            placeholder="Mobile" 
            className="h-9 text-sm bg-off-white border-light-gray" 
            value={contactMobile}
            onChange={(e) => setContactMobile(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="billing-same"
            checked={billingSameAsJob}
            onCheckedChange={(c) => setBillingSameAsJob(c === true)}
            className="border-light-gray data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <label htmlFor="billing-same" className="text-sm text-dark-gray cursor-pointer select-none">
            Billing contact same as job contact
          </label>
        </div>
      </div>

      {/* Scheduled Date */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-charcoal flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-mid-gray" />
          Scheduled Date <span className="text-red-500">*</span>
        </label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            className={`w-full h-10 flex items-center justify-between px-3 rounded-lg border text-sm transition-colors
              ${scheduledDate ? 'text-charcoal' : 'text-mid-gray'}
              ${dayFull ? 'border-red-400 bg-red-50' : 'border-light-gray bg-off-white hover:border-primary/50'}`}
          >
            <span>
              {scheduledDate
                ? scheduledDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                : 'Select a date'}
            </span>
            <CalendarDays className="w-4 h-4 text-mid-gray shrink-0" />
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={scheduledDate}
              onSelect={handleDateSelect}
              disabled={{ before: new Date() }}
            />
          </PopoverContent>
        </Popover>

        {scheduledDate && (
          <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg
            ${dayFull ? 'bg-red-50 text-red-600 border border-red-200'
            : slotsLeft <= 2 ? 'bg-amber-50 text-amber-700 border border-amber-200'
            : 'bg-green-50 text-green-700 border border-green-200'}`}
          >
            {checkingSlots ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : dayFull ? (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center font-black text-[10px]">{slotsLeft}</span>
            )}
            {checkingSlots
              ? 'Checking availability…'
              : dayFull
              ? `Fully booked — all ${MAX_JOBS_PER_DAY} slots used`
              : `${slotsLeft} of ${MAX_JOBS_PER_DAY} slots available`}
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="pt-2 pb-4">
        <Button
          onClick={async () => {
            try {
              setLoading(true);
              let clientId = selectedClient;

              if (!scheduledDate) {
                toast.error('Please select a scheduled date');
                return;
              }
              if (dayFull) {
                toast.error(`${scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} is fully booked (${MAX_JOBS_PER_DAY}/${MAX_JOBS_PER_DAY} slots used)`);
                return;
              }

              // If no client selected but name/email provided, create a new one
              if (!clientId && contactName) {
                const names = contactName.split(' ');
                const newClient = await jobService.createClient({
                  first_name: names[0] || 'Unknown',
                  last_name: names.slice(1).join(' ') || 'Client',
                  email: contactEmail || `${contactName.toLowerCase().replace(' ', '.')}@example.com`,
                  phone: contactPhone,
                  mobile: contactMobile,
                  address: address
                });
                clientId = newClient.id;
              }

              if (!clientId) {
                toast.error('Please select or create a client');
                return;
              }

              const jobData = {
                client_id: clientId,
                address,
                district,
                status: status as any,
                category: category as any,
                description,
                po_number: poNumber,
                contact_name: contactName,
                contact_email: contactEmail,
                contact_phone: contactPhone,
                billing_same_as_job: billingSameAsJob,
                scheduled_date: toLocalDateString(scheduledDate),
              };

              let savedJob;
              if (jobId) {
                savedJob = await jobService.updateJob(jobId, jobData);
              } else {
                savedJob = await jobService.createJob(jobData);
              }

              // Save checklist
              await jobService.saveChecklist(savedJob.id, checklist.map(item => ({
                text: item.text,
                completed: item.completed
              })));

              // Log activity
              if (user) {
                console.log('Attempting to log activity for job:', savedJob.job_number);
                await jobService.logActivity({
                  userId: user.id,
                  action: jobId ? 'job_updated' : 'job_created',
                  entityType: 'job',
                  entityId: savedJob.id,
                  details: jobId 
                    ? `Updated details for Job #${savedJob.job_number}`
                    : `Created new Job #${savedJob.job_number} for ${contactName}`
                });
                console.log('Activity logged successfully in UI');
              }

              toast.success(jobId ? 'Job updated' : 'Job created');
              onSuccess?.();
            } catch (error) {
              console.error('Failed to save job:', error);
              toast.error('Failed to save job');
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading || dayFull || checkingSlots}
          className="w-full bg-primary hover:bg-green-light text-white h-10 font-semibold shadow-md shadow-primary/20"
        >
          {loading ? 'Saving...' : 'Save Job'}
        </Button>
      </div>
    </div>
  );
}
