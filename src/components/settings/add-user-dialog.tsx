'use client';

import { useState } from 'react';
import { Plus, Loader2, UserPlus, Shield, Mail, User, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const ROLES = ['Admin', 'Dispatcher', 'Sales', 'Engineer', 'Technician'];

export function AddUserDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Technician',
  });

  const reset = () => setFormData({ fullName: '', email: '', password: '', role: 'Technician' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`${formData.fullName} added to the team!`);
      setOpen(false);
      reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger
        render={
          <Button className="bg-primary hover:bg-primary-dark text-white gap-2 shadow-sm rounded-xl px-5 h-11">
            <UserPlus className="w-4 h-4" />
            Add Team Member
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[480px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-gradient-to-br from-primary to-primary-dark p-8 text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 opacity-10">
            <UserPlus className="w-32 h-32" />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight">New Team Member</DialogTitle>
          <DialogDescription className="text-white/80 mt-1 font-medium">
            Create a login account for a TN Solar staff member.
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 bg-white">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-mid-gray">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mid-gray" />
              <Input
                required
                placeholder="e.g. Rahul Sharma"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="pl-10 h-12 bg-off-white border-light-gray/60 rounded-xl"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-mid-gray">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mid-gray" />
              <Input
                required
                type="email"
                placeholder="rahul@tnsolar.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10 h-12 bg-off-white border-light-gray/60 rounded-xl"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-mid-gray">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mid-gray" />
              <Input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10 pr-10 h-12 bg-off-white border-light-gray/60 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mid-gray hover:text-charcoal transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-mid-gray">Access Role</Label>
            <Select value={formData.role} onValueChange={(v) => v && setFormData({ ...formData, role: v })}>
              <SelectTrigger className="h-12 bg-off-white border-light-gray/60 rounded-xl">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-mid-gray" />
                  <SelectValue placeholder="Select role" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {ROLES.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-50 hover:text-red-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
