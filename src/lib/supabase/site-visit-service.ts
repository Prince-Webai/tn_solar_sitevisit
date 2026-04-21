import { createClient } from './client';
import type { SiteVisitData } from '@/types/site-visit';

export const siteVisitService = {
  /**
   * Fetch a site visit by its job ID
   */
  async fetchByJobId(jobId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('site_visits')
      .select('*')
      .eq('job_id', jobId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching site visit:', error);
      throw error;
    }

    if (!data) return null;

    // Map database snake_case to frontend camelCase
    return {
      clientName: data.client_name,
      clientPhone: data.client_phone,
      siteAddress: data.site_address,
      siteGps: data.site_gps,
      noOfFloors: data.no_of_floors,
      otherFloorValue: data.other_floor_value,
      phase: data.phase,
      photos: data.photos,
      videos: data.videos,
      solarSpace: data.solar_space,
      structure: data.structure,
      electrical: data.electrical,
      signature: data.signature_url,
    } as SiteVisitData;
  },

  /**
   * Upsert a site visit for a specific job
   */
  async upsertSiteVisit(jobId: string, engineerId: string, data: SiteVisitData) {
    const supabase = createClient();
    
    // Map frontend camelCase to database snake_case
    const payload = {
      job_id: jobId,
      engineer_id: engineerId,
      client_name: data.clientName,
      client_phone: data.clientPhone,
      site_address: data.siteAddress,
      site_gps: data.siteGps,
      no_of_floors: data.noOfFloors,
      other_floor_value: data.otherFloorValue,
      phase: data.phase,
      photos: data.photos,
      videos: data.videos,
      solar_space: data.solarSpace,
      structure: data.structure,
      electrical: data.electrical,
      signature_url: data.signature,
      status: 'completed',
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await supabase
      .from('site_visits')
      .upsert(payload, { onConflict: 'job_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting site visit:', error);
      throw error;
    }

    // Sync GPS to jobs table for map view
    if (data.siteGps) {
      await supabase
        .from('jobs')
        .update({
          latitude: data.siteGps.lat,
          longitude: data.siteGps.lng,
          status: 'In Progress' // Automatically move to in progress on visit submission
        })
        .eq('id', jobId);
    }

    return result;
  }
};
