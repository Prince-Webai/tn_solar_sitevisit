'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { jobService } from '@/lib/supabase/service';
import { useAuth } from '@/components/providers/auth-provider';
import type { Job } from '@/lib/types';

const VIEWS = ['Day', 'Week', '2 Weeks', 'Month'] as const;
type ViewType = (typeof VIEWS)[number];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7am to 6pm
const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function MiniCalendar({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate));
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1));

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = viewMonth.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="text-mid-gray hover:text-charcoal p-1">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs font-semibold text-charcoal">{monthName}</span>
        <button onClick={nextMonth} className="text-mid-gray hover:text-charcoal p-1">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px]">
        {DAYS_OF_WEEK.map((d, i) => (
          <div key={i} className="text-mid-gray font-medium py-1">{d}</div>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const date = new Date(year, month, day);
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = date.toDateString() === selectedDate.toDateString();
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          return (
            <button
              key={day}
              onClick={() => onSelect(date)}
              className={`py-1 rounded-md text-[10px] transition-all ${
                isSelected ? 'bg-vision-green text-white font-bold'
                : isToday ? 'bg-solar-orange/20 text-solar-orange font-bold ring-1 ring-solar-orange'
                : isWeekend ? 'text-mid-gray hover:bg-off-white'
                : 'text-charcoal hover:bg-off-white'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
      <button onClick={() => onSelect(new Date())} className="w-full text-center text-xs text-vision-green font-medium mt-2 hover:underline">Today</button>
    </div>
  );
}

export function CalendarView({ refreshKey, onJobClick }: { refreshKey?: number; onJobClick?: (id: string) => void }) {
  const { user, profile, loading: authLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('Day');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      if (!user || !profile) return;
      setLoading(true);
      try {
        const data = await jobService.fetchJobs({ role: profile.role, userId: user.id });
        setJobs(data);
      } catch (error) {
        console.error('Failed to load jobs:', error);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) loadJobs();
  }, [refreshKey, user, profile, authLoading]);

  const dayLabelFull = selectedDate.toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const dayLabelShort = selectedDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });

  const prevDay = () => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
  const nextDay = () => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-white">
      {/* Mini Calendar Sidebar (Desktop Only) */}
      <div className="hidden md:block w-[200px] shrink-0 border-r border-light-gray bg-white p-4 space-y-4 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
        <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* Responsive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 border-b border-light-gray bg-white shrink-0 gap-3">
          
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-off-white rounded-lg p-0.5 border border-light-gray/60 shadow-sm">
              <button onClick={prevDay} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all active:scale-90"><ChevronLeft className="w-4 h-4 text-dark-gray" /></button>
              <Popover>
                <PopoverTrigger className="px-2 py-1.5 text-xs font-bold text-charcoal flex items-center gap-1.5 hover:bg-white rounded-md transition-all">
                  <CalendarIcon className="w-3.5 h-3.5 text-vision-green" />
                  <span className="hidden xs:inline">{dayLabelFull}</span>
                  <span className="xs:hidden">{dayLabelShort}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
              <button onClick={nextDay} className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all active:scale-90"><ChevronRight className="w-4 h-4 text-dark-gray" /></button>
            </div>
            <button onClick={() => setSelectedDate(new Date())} className="text-[10px] uppercase tracking-wider font-bold text-vision-green bg-vision-green/5 border border-vision-green/20 px-3 py-2 rounded-lg hover:bg-vision-green hover:text-white transition-all active:scale-95">Today</button>
          </div>

          <div className="flex items-center overflow-x-auto no-scrollbar bg-off-white rounded-lg p-1 border border-light-gray/60 w-full sm:w-auto justify-between sm:justify-start">
            {VIEWS.map(v => (
              <button 
                key={v} 
                onClick={() => setView(v)}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight rounded-md transition-all whitespace-nowrap ${
                  view === v ? 'bg-white text-vision-green shadow-sm ring-1 ring-black/5' : 'text-mid-gray hover:text-charcoal'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Time Grid Area */}
        <div className="flex-1 overflow-y-auto bg-white relative no-scrollbar">
          {loading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
              <Loader2 className="w-8 h-8 text-vision-green animate-spin" />
            </div>
          )}

          <div className="min-h-full">
            {/* Background Lines */}
            {HOURS.map(hour => {
              const label = hour > 12 ? `${hour - 12}pm` : hour === 12 ? '12pm' : `${hour}am`;
              return (
                <div key={hour} className="flex border-b border-light-gray/40 h-[72px] group">
                  <div className="w-14 md:w-20 shrink-0 pr-3 md:pr-4 flex items-start justify-end pt-3 bg-off-white/20">
                    <span className="text-[10px] md:text-xs font-black text-mid-gray/40 uppercase tracking-tighter transition-colors group-hover:text-vision-green">{label}</span>
                  </div>
                  <div className="flex-1 border-l border-light-gray/40 transition-colors group-hover:bg-off-white/10" />
                </div>
              );
            })}

            {/* Render Jobs Overlay */}
            {!loading && jobs
              .filter(j => j.scheduled_date && new Date(j.scheduled_date).toDateString() === selectedDate.toDateString())
              .map(job => {
                const d = new Date(job.scheduled_date!);
                const hours = d.getHours();
                const minutes = d.getMinutes();
                if (hours < 7 || hours > 18) return null;

                const durationHours = job.estimated_hours ? Math.max(1, Number(job.estimated_hours)) : 1.5;
                const top = (hours - 7) * 72 + (minutes / 60) * 72;
                const height = durationHours * 72 - 6;
                const isQuote = ['Lead', 'Site Visit'].includes(job.status);

                return (
                  <div
                    key={job.id}
                    onClick={() => onJobClick?.(job.id)}
                    className={`absolute left-16 md:left-24 right-3 md:right-8 rounded-xl p-3 shadow-lg border z-10 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.98] group/job overflow-hidden
                      ${isQuote ? 'bg-solar-orange/10 border-solar-orange/30 shadow-solar-orange/5' : 'bg-blue-50 border-blue-200 shadow-blue-500/5'}`}
                    style={{ top: top + 3, height }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-xs font-black uppercase tracking-tight truncate ${isQuote ? 'text-orange-dark' : 'text-blue-800'}`}>
                          {job.client?.first_name} {job.client?.last_name}
                        </p>
                        <p className={`text-[10px] font-bold truncate opacity-80 mt-0.5 ${isQuote ? 'text-solar-orange' : 'text-blue-600'}`}>
                          {job.job_number}
                        </p>
                      </div>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[9px] font-black uppercase border-none bg-white/50 backdrop-blur-sm text-dark-gray shadow-sm">
                        {Math.floor(durationHours)}h {minutes > 0 ? '30m' : ''}
                      </Badge>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-1.5 opacity-80">
                      <Clock className="w-3 h-3" />
                      <p className="text-[10px] font-bold truncate">{job.address}</p>
                    </div>

                    {job.assigned_to && (
                       <div className="absolute bottom-2 right-3 flex items-center gap-1.5 bg-white/40 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/50">
                         <div className="w-1 h-1 rounded-full bg-vision-green animate-pulse" />
                         <span className="text-[9px] font-black uppercase tracking-tighter text-dark-gray/70">Assigned</span>
                       </div>
                    )}
                  </div>
                );
              })
            }
          </div>
        </div>

        {/* Footer Hint */}
        <div className="bg-off-white/60 backdrop-blur-md border-t border-light-gray px-4 py-2 shrink-0 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-mid-gray/50">Tap a time block to view or manage site visit</p>
        </div>
      </div>
    </div>
  );
}
