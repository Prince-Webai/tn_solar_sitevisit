'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WeatherWidget } from '@/components/dashboard/weather-widget';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { useAuth } from '@/components/providers/auth-provider';
import { ActionKanban } from '@/components/dashboard/action-kanban';
import { MapPreview } from '@/components/dashboard/map-preview';
import { JobModal } from '@/components/job-modal/job-modal';
import { BookSiteVisitDialog } from '@/components/job-modal/book-site-visit-dialog';

export default function DashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const [jobModalOpen,   setJobModalOpen]   = useState(false);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [selectedJobId,  setSelectedJobId]  = useState<string | undefined>();
  const [refreshKey,     setRefreshKey]     = useState(0);

  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isAdminOrSales = ['Admin', 'Sales', 'Dispatcher'].includes(profile?.role || '');

  const handleJobClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setJobModalOpen(true);
  };

  return (
    <>
      <div className="space-y-4 md:space-y-6 max-w-[1600px] mx-auto pb-8">
        {/* Page Title & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-charcoal">Dashboard</h1>
            <p className="text-xs md:text-sm text-dark-gray mt-0.5">
              {profile?.role === 'Engineer' || profile?.role === 'Technician' 
                ? 'Your assigned solar assessments and tasks' 
                : 'Overview of your TN Solar operations today'}
            </p>
          </div>
          {/* Primary CTA for Sales/Admins */}
          {isAdminOrSales && (
            <Button
              id="dashboard-book-site-visit-btn"
              onClick={() => setBookDialogOpen(true)}
              className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white gap-2 shadow-md shadow-primary/20 h-10"
            >
              <Plus className="w-4 h-4" />
              Book Site Visit
            </Button>
          )}
        </div>

        {/* Top Row: Weather + KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <WeatherWidget />
          </div>
          <div className="lg:col-span-3">
            <KpiCards key={refreshKey} />
          </div>
        </div>

        {/* Bottom Row: Kanban + Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ActionKanban onJobClick={handleJobClick} key={refreshKey} />
          </div>
          <div className="lg:col-span-1">
            <div className="h-[300px] lg:h-full min-h-[400px]">
              <MapPreview />
            </div>
          </div>
        </div>
      </div>

      {/* Book Site Visit — customer-first dialog */}
      <BookSiteVisitDialog
        open={bookDialogOpen}
        onOpenChange={setBookDialogOpen}
        onSuccess={() => setRefreshKey(k => k + 1)}
      />

      {/* Job detail modal — opens when clicking existing job */}
      <JobModal
        open={jobModalOpen}
        onOpenChange={setJobModalOpen}
        jobId={selectedJobId}
      />
    </>
  );
}
