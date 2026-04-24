'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Settings as SettingsIcon, MapPin, LayoutDashboard, Trash2, Shield, Mail } from 'lucide-react';
import { AddUserDialog } from '@/components/settings/add-user-dialog';
import { toast } from 'sonner';
import type { Profile } from '@/lib/types';

export default function SettingsPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName}? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast.success(`${userName} has been removed.`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to remove user');
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-off-white overflow-auto h-full no-scrollbar">
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black text-charcoal flex items-center gap-4 tracking-tight">
              <div className="p-2.5 bg-primary/10 rounded-2xl shadow-sm border border-primary/10">
                <SettingsIcon className="w-8 h-8 text-primary" />
              </div>
              System Settings
            </h1>
            <p className="text-mid-gray text-base md:text-lg font-medium pl-1">Manage system configurations and team access.</p>
          </div>
          <AddUserDialog onSuccess={fetchUsers} />
        </div>

        <div className="grid gap-8">
          {/* User Management Card */}
          <div className="bg-white rounded-[2rem] border border-light-gray shadow-sm overflow-hidden">
            <div className="p-8 border-b border-light-gray bg-gray-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-black text-charcoal flex items-center gap-2.5 uppercase tracking-wider">
                  <Users className="w-5 h-5 text-secondary" />
                  Team Management
                </h2>
                <p className="text-xs font-bold text-mid-gray uppercase tracking-widest pl-7">Control access and roles for all staff</p>
              </div>
              {!loading && (
                <div className="bg-white px-4 py-2 rounded-xl border border-light-gray shadow-sm">
                  <span className="text-xs font-black text-primary uppercase tracking-widest">{users.length} Active Members</span>
                </div>
              )}
            </div>

            {loading ? (
              <div className="p-24 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                   <Loader2 className="w-12 h-12 text-primary animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center">
                     <Users className="w-4 h-4 text-primary/40" />
                   </div>
                </div>
                <p className="text-sm font-black text-mid-gray uppercase tracking-[0.2em] animate-pulse">Syncing Team Data</p>
              </div>
            ) : (
              <div className="divide-y divide-light-gray/60">
                {users.length > 0 ? (
                  users.map(user => (
                    <div key={user.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-off-white/40 transition-all duration-300 group relative">
                      <div className="flex items-center gap-5">
                        <Avatar className="w-14 h-14 border-4 border-white shadow-md ring-1 ring-light-gray/50 group-hover:scale-105 transition-transform duration-500">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-primary-dark text-white font-black text-xl">
                            {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="font-black text-charcoal text-lg group-hover:text-primary transition-colors leading-none tracking-tight">{user.full_name}</p>
                          <div className="flex items-center gap-2 text-xs font-bold text-mid-gray">
                            <Mail className="w-3.5 h-3.5" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 self-end sm:self-auto">
                        <div className="text-right hidden md:block">
                           <div className="flex items-center justify-end gap-1.5 mb-0.5">
                             <Shield className="w-3 h-3 text-primary" />
                             <span className="text-[10px] font-black text-primary uppercase tracking-widest">{user.role}</span>
                           </div>
                           <p className="text-[9px] font-bold text-mid-gray/60 uppercase tracking-widest">Access Permission</p>
                        </div>

                        <Badge 
                          variant="secondary" 
                          className={`
                            px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-none shadow-sm
                            ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 
                              user.role === 'Dispatcher' ? 'bg-blue-100 text-blue-700' :
                              user.role === 'Sales' ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'}
                          `}
                        >
                          {user.role}
                        </Badge>
                        
                        <button 
                          onClick={() => handleDeleteUser(user.id, user.full_name)}
                          className="p-3 text-mid-gray hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100 active:scale-90"
                          title="Remove user"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-off-white rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-light-gray">
                       <Users className="w-10 h-10 text-light-gray" />
                    </div>
                    <p className="text-sm font-black text-mid-gray uppercase tracking-widest">No users found in the system</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Additional Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
            <div className="bg-white rounded-[2rem] border border-light-gray p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer group">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-500 shadow-sm">
                <MapPin className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-black text-charcoal mb-2 uppercase tracking-tight">Regional Settings</h3>
              <p className="text-sm font-medium text-mid-gray leading-relaxed">Configure Chennai timezone, local currency (₹), and specific service areas across Tamil Nadu.</p>
            </div>
            
            <div className="bg-white rounded-[2rem] border border-light-gray p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer group">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-500 shadow-sm">
                <LayoutDashboard className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-xl font-black text-charcoal mb-2 uppercase tracking-tight">App Configuration</h3>
              <p className="text-sm font-medium text-mid-gray leading-relaxed">Customize dispatch board thresholds, automated notification triggers, and reporting schedules.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
