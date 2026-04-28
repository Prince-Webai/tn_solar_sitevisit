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
      district: data.district,
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
   * Upsert a site visit for a specific job using atomic RPC
   */
  async upsertSiteVisit(jobId: string, engineerId: string, data: SiteVisitData) {
    const supabase = createClient();
    
    // Get user name for audit log
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', engineerId)
      .single();

    const { data: result, error: rpcError } = await supabase
      .rpc('submit_site_visit_v2', {
        p_job_id: jobId,
        p_engineer_id: engineerId,
        p_client_name: data.clientName,
        p_client_phone: data.clientPhone,
        p_site_address: data.siteAddress,
        p_district: data.district,
        p_site_gps: data.siteGps,
        p_no_of_floors: data.noOfFloors,
        p_other_floor_value: data.otherFloorValue,
        p_phase: data.phase,
        p_photos: data.photos,
        p_videos: data.videos,
        p_solar_space: data.solarSpace,
        p_structure: data.structure,
        p_electrical: data.electrical,
        p_signature_url: data.signature,
        p_user_name: profile?.full_name || 'Engineer'
      });

    if (rpcError) {
      console.error('Error in submit_site_visit_v2 RPC:', rpcError);
      throw new Error(`Failed to save site visit data: ${rpcError.message}`);
    }

    if (result && !result.success) {
      console.error('RPC returned failure:', result.error);
      throw new Error(`Failed to save site visit data: ${result.error}`);
    }

    return result;
  }
};
