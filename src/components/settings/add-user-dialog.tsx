'use client';

import { useState } from 'react';
import { Plus, Loader2, UserPlus, Shield, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function AddUserDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'Technician' as any
  });
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // In a real app with Auth, you would use supabase.auth.admin.inviteUserByEmail
      // For this implementation, we'll create the profile directly.
      // NOTE: Without auth, this user won't be able to log in, but they will appear in the system.
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(), // Mock ID for demonstration if auth not handled
          full_name: formData.fullName,
          email: formData.email,
          role: formData.role,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('User added successfully');
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast.error(error.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="bg-primary hover:bg-primary-dark text-white gap-2 shadow-sm rounded-xl px-5 h-11">
            <UserPlus className="w-4 h-4" />
            Add Team Member
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-gradient-to-br from-primary to-primary-dark p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <UserPlus className="w-32 h-32" />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">New Member</DialogTitle>
          <DialogDescription className="text-white/80 mt-1 font-medium">
            Register a new staff member to the TN Solar team.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-black uppercase tracking-widest text-mid-gray px-1">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mid-gray" />
                <Input
                  id="fullName"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="pl-10 h-12 bg-off-white border-light-gray/60 focus-visible:ring-primary/20 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-mid-gray px-1">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mid-gray" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="rahul@tnsolar.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-12 bg-off-white border-light-gray/60 focus-visible:ring-primary/20 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs font-black uppercase tracking-widest text-mid-gray px-1">Access Role</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger className="h-12 bg-off-white border-light-gray/60 focus-visible:ring-primary/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-mid-gray" />
                    <SelectValue placeholder="Select role" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Admin">Administrator</SelectItem>
                  <SelectItem value="Dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="Sales">Sales Representative</SelectItem>
                  <SelectItem value="Technician">Technician / Engineer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-50 hover:text-red-600 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
