'use client';

import { useState } from 'react';
import { WeatherWidget } from '@/components/dashboard/weather-widget';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { ActionKanban } from '@/components/dashboard/action-kanban';
import { MapPreview } from '@/components/dashboard/map-preview';
import { JobModal } from '@/components/job-modal/job-modal';

export default function DashboardPage() {
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();

  const handleJobClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setJobModalOpen(true);
  };

  return (
    <>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Dashboard</h1>
          <p className="text-sm text-dark-gray mt-0.5">Overview of your operations today</p>
        </div>

        {/* Top Row: Weather + KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <WeatherWidget />
          </div>
          <div className="lg:col-span-3">
            <KpiCards />
          </div>
        </div>

        {/* Bottom Row: Kanban + Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ActionKanban onJobClick={handleJobClick} />
          </div>
          <div className="lg:col-span-1">
            <MapPreview />
          </div>
        </div>
      </div>

      <JobModal
        open={jobModalOpen}
        onOpenChange={setJobModalOpen}
        jobId={selectedJobId}
      />
    </>
  );
}
