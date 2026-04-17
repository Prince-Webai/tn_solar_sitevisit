'use client';

import { useState } from 'react';
import { Plus, GripVertical, Trash2, Search, MapPin, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { mockClients } from '@/lib/mock-data';
import { JOB_STATUSES, JOB_CATEGORIES } from '@/lib/constants';

interface ChecklistItemType {
  id: string;
  text: string;
  completed: boolean;
}

export function DetailsTab() {
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [status, setStatus] = useState('Quote');
  const [category, setCategory] = useState('Installation');
  const [poNumber, setPoNumber] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItemType[]>([
    { id: '1', text: 'Confirm site access requirements', completed: false },
    { id: '2', text: 'Verify roof condition and measurements', completed: false },
  ]);
  const [billingSameAsJob, setBillingSameAsJob] = useState(true);

  const filteredClients = mockClients.filter(c => {
    if (!clientSearch) return true;
    const q = clientSearch.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
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
    ? mockClients.find(c => c.id === selectedClient)
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
              {filteredClients.map(c => (
                <button
                  key={c.id}
                  className="w-full text-left px-3 py-2 hover:bg-off-white transition-colors flex items-center gap-3"
                  onClick={() => {
                    setSelectedClient(c.id);
                    setClientSearch(`${c.first_name} ${c.last_name}`);
                    setShowClientDropdown(false);
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-vision-green/10 flex items-center justify-center text-xs font-semibold text-green-dark">
                    {c.first_name[0]}{c.last_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-charcoal">{c.first_name} {c.last_name}</p>
                    <p className="text-xs text-mid-gray">{c.email}</p>
                  </div>
                </button>
              ))}
              <button
                className="w-full text-left px-3 py-2 hover:bg-off-white transition-colors flex items-center gap-2 text-vision-green border-t border-light-gray"
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
          {checklist.map(item => (
            <div key={item.id} className="flex items-center gap-2 group">
              <GripVertical className="w-4 h-4 text-light-gray cursor-grab shrink-0" />
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => toggleChecklistItem(item.id)}
                className="border-light-gray data-[state=checked]:bg-vision-green data-[state=checked]:border-vision-green"
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
          className="text-vision-green hover:text-green-dark hover:bg-accent gap-1.5 h-8"
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
          <Input placeholder="Name" className="h-9 text-sm bg-off-white border-light-gray" />
          <Input placeholder="Email" className="h-9 text-sm bg-off-white border-light-gray" />
          <Input placeholder="Phone" className="h-9 text-sm bg-off-white border-light-gray" />
          <Input placeholder="Mobile" className="h-9 text-sm bg-off-white border-light-gray" />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="billing-same"
            checked={billingSameAsJob}
            onCheckedChange={(c) => setBillingSameAsJob(c === true)}
            className="border-light-gray data-[state=checked]:bg-vision-green data-[state=checked]:border-vision-green"
          />
          <label htmlFor="billing-same" className="text-sm text-dark-gray cursor-pointer select-none">
            Billing contact same as job contact
          </label>
        </div>
      </div>

      {/* Save button */}
      <div className="pt-2 pb-4">
        <Button className="w-full bg-vision-green hover:bg-green-light text-white h-10 font-semibold shadow-md shadow-vision-green/20">
          Save Job
        </Button>
      </div>
    </div>
  );
}
