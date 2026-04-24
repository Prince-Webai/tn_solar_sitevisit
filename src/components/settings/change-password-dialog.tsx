'use client';

import { useState } from 'react';
import { Loader2, KeyRound, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ChangePasswordDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ userId, userName, open, onOpenChange }: ChangePasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => { setPassword(''); setConfirm(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`Password updated for ${userName}`);
      onOpenChange(false);
      reset();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-7 text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 opacity-10">
            <KeyRound className="w-28 h-28" />
          </div>
          <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
            <KeyRound className="w-5 h-5" />
            Change Password
          </DialogTitle>
          <DialogDescription className="text-white/70 mt-1 text-sm font-medium">
            Set a new password for <span className="text-white font-bold">{userName}</span>
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-7 space-y-5 bg-white">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-mid-gray">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mid-gray" />
              <Input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-mid-gray">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mid-gray" />
              <Input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`pl-10 h-12 bg-off-white rounded-xl border ${
                  confirm && password !== confirm ? 'border-red-400 focus:ring-red-200' : 'border-light-gray/60'
                }`}
              />
            </div>
            {confirm && password !== confirm && (
              <p className="text-xs text-red-500 font-semibold pl-1">Passwords do not match</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 rounded-xl font-bold uppercase tracking-wider text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (!!confirm && password !== confirm)}
              className="flex-1 h-11 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold uppercase tracking-wider text-xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
