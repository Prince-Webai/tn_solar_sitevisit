import connectToDatabase from '../mongodb';
import { SiteVisit as SiteVisitModel, Profile as ProfileModel } from '../models';
import type { SiteVisitData } from '@/types/site-visit';

export const siteVisitService = {
  /**
   * Fetch a site visit by its job ID
   */
  async fetchByJobId(jobId: string) {
    await connectToDatabase();
    const data = await SiteVisitModel.findOne({ job_id: jobId });

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
   * Upsert a site visit for a specific job
   */
  async upsertSiteVisit(jobId: string, engineerId: string, data: SiteVisitData) {
    await connectToDatabase();
    
    const updateData = {
      engineer_id: engineerId,
      client_name: data.clientName,
      client_phone: data.clientPhone,
      site_address: data.siteAddress,
      district: data.district,
      site_gps: data.siteGps,
      no_of_floors: data.noOfFloors,
      other_floor_value: data.otherFloorValue,
      phase: data.phase,
      photos: data.photos,
      videos: data.videos,
      solar_space: data.solarSpace,
      structure: data.structure,
      electrical: data.electrical,
      signature_url: data.signature
    };

    try {
      const result = await SiteVisitModel.findOneAndUpdate(
        { job_id: jobId },
        { 
          $set: updateData,
          $setOnInsert: { _id: crypto.randomUUID() } 
        },
        { upsert: true, new: true }
      );

      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error upserting site visit:', error);
      throw new Error(`Failed to save site visit data: ${error.message}`);
    }
  }
};
