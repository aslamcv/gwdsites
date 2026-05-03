export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
};

export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Partially Paid' | 'Draft';

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  totalAmount: number;
  paidAmount?: number;
  status: InvoiceStatus;
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type ServiceCategory = 'Investigation' | 'Drilling' | 'Pumping Test' | 'Supervision' | 'Census';

export type GroundWaterService = {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  equipment: string[]; 
  basePrice: number;
  unit: string;
  customizationOptions: string[];
  complianceInfo: string[]; 
  scope: string; 
};

export type Employee = {
  id: string;
  name: string;
  name_ml?: string;
  designation: string;
  designation_ml?: string;
  pen: string;
  roles: string[];
  phone: string;
  dob: string;
  photoUrl: string;
  createdAt: string;
  email?: string;
  hasSystemAccess?: boolean;
};

export type AttendanceStatus = 'S' | 'W' | 'CL' | 'H' | 'A' | '';

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  year: number;
  month: number;
  type: 'SLR' | 'CLR';
  days: Record<number, AttendanceStatus>;
  updatedAt: string;
};

export type VesRow = {
  sNo: string;
  ab2: number;
  mn2: number;
  k: number;
  ves1_r?: string;
  ves1_ra?: string;
  ves2_r?: string;
  ves2_ra?: string;
};

export type WorkComponent = {
  dsrCode?: string;
  description: string;
  unit: string;
  no?: string;
  length?: string;
  breadth?: string;
  height?: string;
  quantity: string;
  group?: string;
  executionLocation?: string;
};

export type GroundwaterReport = {
  id: string;
  fileNo: string;
  referenceNo?: string;
  applicantName: string;
  applicantAddress?: string;
  reportTitle: string;
  reportDate: string;
  village: string;
  locationDetails?: string;
  latitude?: string;
  longitude?: string;
  altitude?: string;
  lsgd?: string;
  ward?: string;
  assembly?: string;
  block?: string;
  typeAppliedFor?: string;
  dateOfFeasibility?: string;
  dateOfInvestigation?: string;
  noOfBeneficiaries?: string;
  toposheet?: string;
  surveyNoArea?: string;
  microWatershed?: string;
  hydrogeology?: string;
  nearbyBorewell1Depth?: string;
  nearbyBorewell1Diameter?: string;
  nearbyBorewell1Zones?: string;
  nearbyBorewell2Depth?: string;
  nearbyBorewell2Diameter?: string;
  nearbyBorewell2Zones?: string;
  nearbyBorewell3Depth?: string;
  nearbyBorewell3Diameter?: string;
  nearbyBorewell3Zones?: string;
  noNearbyBorewells?: boolean;
  nearbyOpenwell1Depth?: string;
  nearbyOpenwell1WaterLevel?: string;
  nearbyOpenwell1ParapetHeight?: string;
  nearbyOpenwell1Type?: string;
  nearbyOpenwell2Depth?: string;
  nearbyOpenwell2WaterLevel?: string;
  nearbyOpenwell2ParapetHeight?: string;
  nearbyOpenwell2Type?: string;
  nearbyOpenwell3Depth?: string;
  nearbyOpenwell3WaterLevel?: string;
  nearbyOpenwell3ParapetHeight?: string;
  nearbyOpenwell3Type?: string;
  noNearbyOpenwells?: boolean;
  recommendationType?: string;
  recBorewellTotalDepth?: string;
  recBorewellDiameter?: string;
  expectedOverburden?: string;
  recommendationBorewell?: string;
  recOpenwellTotalDepth?: string;
  recOpenwellDiameter?: string;
  recommendationOpenwell?: string;
  recommendedToGpSurvey?: boolean;
  gpSurveyLocation?: string;
  staffAssignment?: {
    geologicalAssistant?: string | string[];
    geologicalAssistant_ml?: string;
    juniorHydrogeologist?: string | string[];
    juniorHydrogeologist_ml?: string;
    hydrogeologist?: string | string[];
    hydrogeologist_ml?: string;
    geophysicist?: string | string[];
    juniorGeophysicist?: string | string[];
    geophysicalAssistant?: string | string[];
    unitInCharge?: string | string[];
    siteSupervisor?: string | string[];
    supervisor?: string | string[];
    assistantEngineer?: string | string[];
    assistantExecutiveEngineer?: string | string[];
    drillers?: string | string[];
    drillingAssistants?: string | string[];
    drivers?: string | string[];
    watchers?: string | string[];
    slr?: string | string[];
    clr?: string | string[];
    otherStaff?: string | string[];
    conveyance?: string;
  };
  purpose?: string;
  category: string; 
  reportType?: 'ESTIMATE' | 'MEASUREMENT';
  uploadedBy: string;
  createdAt: string;
  updatedAt?: string;
  nameOfSite?: string;
  nameOfSite_ml?: string;
  address?: string;
  address_ml?: string;
  applicantNameAddress_ml?: string;
  
  // Drilling specific technical fields
  borewellSize?: string;
  remittance?: string;
  totalDepth?: string;
  overburden?: string;
  pvc6kg?: string;
  pvc10kg?: string;
  discharge?: string;
  zoneDepth?: string;
  waterLevel?: string;
  compressorWorkingHour?: string;
  observations?: string;
  remarks?: string;

  // MWSS 39 Specific Parameters
  pump3hp?: string;
  cable4mm?: string;
  upvc50mm?: string;
  rope14mm?: string;
  union40mm?: string;
  nrv40mm?: string;
  bend40mm?: string;
  socket40mm?: string;
  hexNipple?: string;
  erection?: string;
  panelBoard?: string;
  cableCover25mmTrench?: string;
  cableCover25mmNoTrench?: string;
  ssAdaptor40mm?: string;
  pm50mmTrench?: string;
  tank?: string;
  structureTankPumpHouse?: string;
  tankConnector50mm?: string;
  tankConnector63mm?: string;
  pvcBallValve50mm?: string;
  pvcBallValve63mm?: string;
  distLine32mmTrench?: string;
  distLine32mmNoTrench?: string;
  giAsPvcCover32mm?: string;
  distLine40mmTrench?: string;
  distLine40mmNoTrench?: string;
  giAsPvcCover50mm?: string;
  distLine50mmTrench?: string;
  distLine50mmNoTrench?: string;
  giAsPvcCover50mmPipe?: string;
  distLine63mmTrench?: string;
  demolishingConcrete?: string;
  pccCoverDemolished?: string;
  pccGiFixing?: string;
  starter?: string;
  hydrants?: string;
  heavyDutyTap?: string;
  pvcEndCap140mm?: string;
  wellProtectionCover?: string;
  elecAccessories?: string;

  // Reno Specific Items (31 Items)
  pumpRepair?: string;
  cableReplacement?: string;
  upvcReplacement?: string;
  ropeReplacement?: string;
  unionReplacement?: string;
  nrvReplacement?: string;
  bendReplacement?: string;
  socketReplacement?: string;
  hexNippleReplacement?: string;
  reinstallationCharges?: string;
  panelBoardRepair?: string;
  cableCoverTrench?: string;
  cableCoverNoTrench?: string;
  ssAdaptorReplacement?: string;
  pipeReplacementTrench?: string;
  tankRepairCleaning?: string;
  structureRepair?: string;
  tankConnectorReplacement?: string;
  ballValveReplacement?: string;
  distLineTrenchRepair?: string;
  distLineNoTrenchRepair?: string;
  giPvcCoverReplacement?: string;
  pipelineRenovation?: string;
  concreteRepair?: string;
  pccRestoration?: string;
  starterRepair?: string;
  hydrantRepair?: string;
  tapReplacement?: string;
  endCapReplacement?: string;
  wellCoverRepair?: string;
  elecRepair?: string;
  natureOfRenovation?: string;
  reasonForRenovation?: string;

  // HPS Specific Fields
  nameOfPlace?: string;
  panchayathName?: string;
  wellSize?: string;
  typeOfHandPump?: string;
  staticWaterLevel?: string;
  depthOfPumpInstalled?: string;
  platformSize?: string;
  contractorName?: string;
  measurementTakenBy?: string;
  checkMeasurementBy?: string;
  supervisorSignature?: string;

  // Geophysical specific fields
  vesArea?: string;
  vesData?: VesRow[];
  spreadingDirection?: string;
  vesRecommendation?: string;

  // ARS Specific
  typeOfARS?: string;
  arsSubType?: 'ARS_PIT_RECHARGE' | 'ARS_DUG_WELL_RECHARGE';
  dugwellTable?: any[];
  pitTable?: any[];
  sites?: any[];
  nameOfContractor?: string;
  excavationDimensions?: string;
  liningDetails?: string;
  filtermediaBoulders?: string;
  filtermediaPebbles?: string;
  filtermediaCoarseSand?: string;
  filtermediaFineSand?: string;
  filterthickness?: string;
  collectionPitDetails?: string;
  desiltingChamberDimensions?: string;
  inflowPipeDia?: string;
  inflowPipeLength?: string;
  overflowPipeDetails?: string;
  boreholeDepth?: string;
  casingPipeDetails?: string;
  perforationDetails?: string;
  wellCapDetails?: string;
  masonryWorkDetails?: string;
  concretingRatio?: string;
  steelReinforcement?: string;
  plasteringDetails?: string;
  siteRestoration?: string;
  labourCharges?: string;
  materialCosts?: string;
  transportationCharges?: string;
  fencingDetails?: string;
  nameBoardInstallation?: string;
  completionStatus?: string;
  observations?: string;

  // ARS Page 2 Fields
  plasteringOutside?: string;
  plasteringTop?: string;
  whiteWashingArea?: string;
  metal20mmVolume?: string;
  gutterPipe160mm?: string;
  pvcPipe110mm?: string;
  pvcPipe90mm?: string;
  pvcCowls?: string;
  pvcElbows?: string;
  pvcBends?: string;
  pvcTees?: string;
  pvcReducers?: string;
  pvcClamps?: string;
  pvcScrews?: string;
  scaffoldingArea?: string;
  blackJapanPaint?: string;

  // ARS Dugwell Specific Page 2
  babyMetalVolume?: string;
  charcoalVolume?: string;
  charcoalWeight?: string;
  fiberMeshBaseArea?: string;
  fiberMeshArea?: string;
  internalPlasteringArea?: string;
  whiteWashingAlmirah1?: string;
  whiteWashingAlmirah2?: string;
  whiteWashingAlmirah3?: string;
  pvcPipe63mm?: string;
  pvcBallValve110mm?: string;
  nylonNetSafety?: boolean;
  graniteBoardLettering?: string;

  // Pumping Test specific completion fields
  typeOfPump?: string;
  diameterOfPump?: string;
  diameterOfPumpingLine?: string;
  diameterOfDeliveryPipe?: string;
  lengthOfRodsInstalled?: string;
  pumpSetAt?: string;
  initialDischarge?: string;
  finalDischarge?: string;
  compressorStartedAt?: string;
  compressorStoppedAt?: string;
  pumpingData?: any[];
  recoveryData?: any[];
  transmissivityPw?: string;
  transmissivityOw1?: string;
  transmissivityOw2?: string;
  averageDischarge?: string;
  periodPumped?: string;
  maxDrawdown?: string;
  district?: string;
  measuringPointHt?: string;

  // New Fields for ARS Completion Report Template
  schemeName?: string;
  yearOfImplementation?: string;
  accessibility?: string;
  swlBefore?: string;
  swlAfter?: string;
  dateOfCommencement?: string;
  fundingSource?: string;
  catchmentArea?: string;
  nearestLandmark?: string;
  landType?: string;
  rechargeMethod?: string;
  materialOther?: string;
  rechargeEffectiveness?: string;
  waterLevelImprovement?: string;
  seasonalPerformance?: string;

  // ARS Inspection Dashboard Fields
  costIndex?: number;
  isApproved?: boolean;
  hasDiscrepancy?: boolean;
  discrepancyNotes?: string;
  earthworkActual?: string;
  masonryActual?: string;
  rccActual?: string;
  steelActual?: string;
  plasteringActual?: string;
  brandingLarge?: string;
  brandingSmall?: string;
  fittingsVerified?: boolean;

  // Structured Work Items for Report Generation
  works?: {
    description: string;
    qty: number;
    unit: string;
    rate: number;
    amount: number;
  }[];
  totalAmount?: number;
  conveyance?: string;
};
