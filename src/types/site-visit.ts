export interface SiteVisitData {
  clientName: string;
  clientPhone: string;
  siteAddress: string;
  siteGps?: { lat: number; lng: number };
  noOfFloors?: string;
  otherFloorValue?: string;
  phase?: string;
  photos: {
    front?: string;
    left?: string;
    right?: string;
    back?: string;
    solarSystemLocation?: string;
    structureCustomDesign?: string;
    inverter?: string;
    engineer?: string;
    client?: string;
    roadAccess?: string;
    acdbDcdb?: string;
  };
  videos: {
    shadowAnalysis?: string;
    earthing?: string;
    lightningArrestorEarthing?: string;
    plantToInverter?: string;
    inverterToEarthing?: string;
  };
  solarSpace: {
    length: number | string;
    width: number | string;
    southFacing: boolean;
    shape?: string;
  };
  structure: {
    size: string;
    lightArrestorLocation?: string;
    lightningArrestor: boolean;
    additionalPipe: boolean;
    pipeLength: number | string;
  };
  electrical: {
    inverterLocation: string;
  };
  signature?: string;
}
