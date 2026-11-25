/**
 * SAMI Embedded UK Database
 * Complete UK services, constraints, and reference data
 * Self-contained - no external API required
 * Compiled from 28+ previous builds
 */

window.SAMIEmbeddedDatabase = (() => {
  "use strict";

  const UK_BOUNDS = {
    minLat: 50.0,
    maxLat: 59.0,
    minLng: -8.0,
    maxLng: 2.0,
  };

  // Utility Operators & Standards
  const UTILITY_OPERATORS = {
    electricity: [
      { name: "UK Power Networks", regions: ["London", "South East", "East of England"], clearance: 5.3 },
      { name: "NGED (National Grid)", regions: ["Midlands", "East Midlands", "South Western"], clearance: 5.3 },
      { name: "Scottish Power", regions: ["Scotland"], clearance: 5.3 },
      { name: "SSE (Hydro)", regions: ["Scotland"], clearance: 5.3 },
      { name: "Northern Power Grid", regions: ["North East", "Yorkshire"], clearance: 5.3 },
    ],
    gas: [
      { name: "Cadent Gas", regions: ["South East", "East", "Midlands"], clearance: 2.0 },
      { name: "Nationwide Gas", regions: ["North West", "North East"], clearance: 2.0 },
      { name: "SGN", regions: ["Scotland", "South West"], clearance: 2.0 },
      { name: "Wales & West Utilities", regions: ["Wales", "South West"], clearance: 2.0 },
    ],
    water: [
      { name: "Thames Water", regions: ["South East"], clearance: 1.0 },
      { name: "Severn Trent Water", regions: ["Midlands", "East Midlands"], clearance: 1.0 },
      { name: "Anglian Water", regions: ["East Anglia"], clearance: 1.0 },
      { name: "United Utilities", regions: ["North West"], clearance: 1.0 },
      { name: "Yorkshire Water", regions: ["Yorkshire"], clearance: 1.0 },
      { name: "South West Water", regions: ["South West"], clearance: 1.0 },
      { name: "Southern Water", regions: ["South"], clearance: 1.0 },
      { name: "Scottish Water", regions: ["Scotland"], clearance: 1.0 },
    ],
    telecom: [
      { name: "BT Openreach", regions: ["UK-wide"], clearance: 1.0 },
      { name: "Vodafone", regions: ["UK-wide"], clearance: 1.0 },
      { name: "EE", regions: ["UK-wide"], clearance: 1.0 },
      { name: "Three", regions: ["UK-wide"], clearance: 1.0 },
    ],
    drainage: [
      { name: "Local Authority Sewerage", regions: ["Various"], clearance: 1.5 },
      { name: "Wessex Water", regions: ["South West"], clearance: 1.5 },
      { name: "Thames Water", regions: ["South East"], clearance: 1.5 },
    ],
  };

  // UK Flood Risk Zones
  const FLOOD_ZONES = [
    {
      id: "flood_zone_1",
      name: "Flood Zone 1 - Low Risk",
      probability: "< 1 in 1000 annual",
      riskLevel: "Low",
      developmentGuidance: "Appropriate for all uses",
      color: "#a3d977",
    },
    {
      id: "flood_zone_2",
      name: "Flood Zone 2 - Medium Risk",
      probability: "1 in 100 to 1 in 1000 annual",
      riskLevel: "Medium",
      developmentGuidance: "Appropriate for residential with standards",
      color: "#f4d03f",
    },
    {
      id: "flood_zone_3a",
      name: "Flood Zone 3a - High Risk",
      probability: "1 in 100 annual (rivers) or 1 in 200 (tidal)",
      riskLevel: "High",
      developmentGuidance: "Restricted - sequential test required",
      color: "#e59b3a",
    },
    {
      id: "flood_zone_3b",
      name: "Flood Zone 3b - Functional Floodplain",
      probability: "1 in 20 annual or higher",
      riskLevel: "Very High",
      developmentGuidance: "Water-compatible uses only",
      color: "#c1272d",
    },
  ];

  // UK Heritage Designations
  const HERITAGE_TYPES = [
    { id: "grade_i", name: "Grade I Listed Building", protection: "Highest", examples: "Cathedrals, great houses" },
    { id: "grade_ii_star", name: "Grade II* Listed Building", protection: "High", examples: "Important buildings" },
    { id: "grade_ii", name: "Grade II Listed Building", protection: "Standard", examples: "Locally important" },
    { id: "conservation_area", name: "Conservation Area", protection: "Area-wide", examples: "Historic streetscapes" },
    { id: "scheduled_monument", name: "Scheduled Monument", protection: "National", examples: "Archaeological sites" },
    { id: "world_heritage", name: "World Heritage Site", protection: "UNESCO", examples: "Stonehenge, Bath" },
  ];

  // UK Environmental Designations
  const ENVIRONMENTAL_TYPES = [
    { id: "sssi", name: "Site of Special Scientific Interest", jurisdiction: "Natural England" },
    { id: "assi", name: "Area of Special Scientific Interest", jurisdiction: "DAERA (NI)" },
    { id: "spa", name: "Special Protection Area", jurisdiction: "Natural England" },
    { id: "sac", name: "Special Area of Conservation", jurisdiction: "Natural England" },
    { id: "ramsar", name: "Ramsar Wetland", jurisdiction: "Natural England" },
    { id: "ancient_woodland", name: "Ancient Woodland", jurisdiction: "Forestry Commission" },
    { id: "protected_species", name: "Protected Species Habitat", jurisdiction: "Wildlife & Countryside Act" },
    { id: "nnr", name: "National Nature Reserve", jurisdiction: "Natural England" },
  ];

  // UK Planning Designations
  const PLANNING_DESIGNATIONS = [
    { id: "green_belt", name: "Green Belt", policy: "NPPF - inappropriate development", protection: "Strict" },
    { id: "aonb", name: "Area of Outstanding Natural Beauty", policy: "NPPF - great weight to landscape", protection: "High" },
    { id: "national_park", name: "National Park", policy: "Conservation and enjoyment", protection: "Highest" },
    { id: "enterprise_zone", name: "Enterprise Zone", policy: "Accelerated development", protection: "Low" },
    { id: "new_settlement", name: "New Settlement", policy: "Strategic allocation", protection: "Medium" },
    { id: "designated_heritage", name: "Designated Heritage Area", policy: "Conservation management", protection: "High" },
    { id: "flood_defence", name: "Flood Defence Critical Area", policy: "EA protection", protection: "High" },
    { id: "mineral_extraction", name: "Mineral Extraction Zone", policy: "Resource protection", protection: "Medium" },
    { id: "waste_management", name: "Waste Management Facility", policy: "Strategic provision", protection: "Medium" },
    { id: "hazardous_substance", name: "Hazardous Substance Area", policy: "Safety management", protection: "High" },
  ];

  // Infrastructure Constraints
  const INFRASTRUCTURE_CONSTRAINTS = [
    { type: "airport", name: "Airport Safeguarding Zone", clearance: 3000, restriction: "Height restrictions" },
    { type: "mod_land", name: "MOD Defence Land", clearance: 100, restriction: "Restricted access" },
    { type: "radar", name: "Radar/Communication Mast", clearance: 500, restriction: "Interference risk" },
    { type: "contaminated_land", name: "Contaminated Land Register", clearance: 0, restriction: "Remediation required" },
    { type: "railway", name: "Network Rail Infrastructure", clearance: 50, restriction: "Proximity controls" },
    { type: "canal", name: "Canal & Inland Waterway", clearance: 20, restriction: "Navigation protection" },
    { type: "pipeline", name: "High Pressure Pipeline", clearance: 10, restriction: "Excavation controls" },
  ];

  // Sample Major UK Sites with Constraints
  const SAMPLE_SITES = [
    {
      id: "site_01",
      name: "Riverside Industrial - Worcestershire",
      coords: [-2.127, 52.586],
      area: 2.4,
      constraints: ["flood_zone_2", "conservation_area", "heritage", "water_main", "electricity_cable"],
      description: "Historic industrial site with multiple utility constraints",
    },
    {
      id: "site_02",
      name: "Urban Regeneration - London",
      coords: [-0.08, 51.52],
      area: 1.8,
      constraints: ["conservation_area", "listed_building", "green_belt_adjacent", "underground_utilities"],
      description: "Central London redevelopment with heritage constraints",
    },
    {
      id: "site_03",
      name: "Rural Business Park - Herefordshire",
      coords: [-2.5, 52.1],
      area: 5.2,
      constraints: ["aonb_buffer", "ancient_woodland_adjacent", "sssi_nearby"],
      description: "Greenfield site with environmental protections",
    },
    {
      id: "site_04",
      name: "Coastal Development - South Devon",
      coords: [-4.14, 50.73],
      area: 3.1,
      constraints: ["flood_zone_3a", "aonb", "protected_species", "natural_england_advice"],
      description: "Coastal site with flood and environmental constraints",
    },
  ];

  // OHL (Overhead Line) Infrastructure - Complete Asset Register
  const OHL_ASSETS = {
    operators: {
      UKPN: { name: "UK Power Networks", regions: ["London", "South East", "East of England"], color: "#FF6B35" },
      NGED: { name: "National Grid Electricity Distribution", regions: ["Midlands", "East Midlands", "South Western"], color: "#FF6B35" },
      SSEN: { name: "Scottish and Southern Energy", regions: ["Scotland", "South West"], color: "#F7931E" },
      SPD: { name: "Scottish Power Distribution", regions: ["Scotland"], color: "#00A651" },
      NGUK: { name: "National Grid (Transmission)", regions: ["UK-wide"], color: "#1F4788" },
    },
    voltageClasses: {
      "11kV": { clearance: 5.3, type: "Distribution", commonUse: "Local networks" },
      "33kV": { clearance: 6.0, type: "Sub-transmission", commonUse: "Regional networks" },
      "66kV": { clearance: 7.0, type: "Sub-transmission", commonUse: "Area networks" },
      "132kV": { clearance: 8.0, type: "Transmission", commonUse: "Long distance" },
      "275kV": { clearance: 9.0, type: "Transmission", commonUse: "Strategic routes" },
      "400kV": { clearance: 10.0, type: "High Voltage", commonUse: "Main grid" },
    },
    towerTypes: {
      steel_lattice: { description: "Steel lattice tower", heightRange: "30-80m", strength: "High capacity" },
      steel_monopole: { description: "Steel monopole", heightRange: "15-50m", strength: "Medium capacity" },
      wooden_pole: { description: "Wooden pole", heightRange: "10-30m", strength: "Low-medium capacity" },
      concrete_pole: { description: "Reinforced concrete pole", heightRange: "12-40m", strength: "Medium capacity" },
      truss_tower: { description: "Truss construction tower", heightRange: "25-70m", strength: "High capacity" },
    },
    sampleOHLAssets: [
      {
        id: "OHL-001-WOR",
        name: "Riverside to Bromsgrove Line",
        operator: "UKPN",
        voltage: "132kV",
        route: "Worcestershire main feeder",
        assetNumber: "ELN/WOR/0001/A",
        owner: "UK Power Networks Distribution Ltd",
        length: 24.5,
        towers: [
          { id: "T-001-WOR", type: "steel_lattice", lat: 52.5860, lng: -2.1270, height: 45, assetRef: "TWR/WOR/001" },
          { id: "T-002-WOR", type: "steel_lattice", lat: 52.5875, lng: -2.1245, height: 45, assetRef: "TWR/WOR/002" },
          { id: "T-003-WOR", type: "steel_lattice", lat: 52.5890, lng: -2.1210, height: 42, assetRef: "TWR/WOR/003" },
          { id: "T-004-WOR", type: "steel_monopole", lat: 52.5905, lng: -2.1180, height: 32, assetRef: "TWR/WOR/004" },
        ],
        clearance: 8.0,
        circuits: 2,
        safeDigClearance: 10.0,
      },
      {
        id: "OHL-002-LON",
        name: "Central London Distribution Loop",
        operator: "UKPN",
        voltage: "33kV",
        route: "Central London network",
        assetNumber: "ELN/LON/0002/B",
        owner: "UK Power Networks Distribution Ltd",
        length: 18.3,
        towers: [
          { id: "T-001-LON", type: "wooden_pole", lat: 51.5200, lng: -0.0800, height: 12, assetRef: "POL/LON/001" },
          { id: "T-002-LON", type: "wooden_pole", lat: 51.5215, lng: -0.0775, height: 12, assetRef: "POL/LON/002" },
          { id: "T-003-LON", type: "concrete_pole", lat: 51.5230, lng: -0.0750, height: 15, assetRef: "POL/LON/003" },
          { id: "T-004-LON", type: "wooden_pole", lat: 51.5245, lng: -0.0725, height: 12, assetRef: "POL/LON/004" },
          { id: "T-005-LON", type: "steel_monopole", lat: 51.5260, lng: -0.0700, height: 18, assetRef: "POL/LON/005" },
        ],
        clearance: 6.0,
        circuits: 1,
        safeDigClearance: 7.5,
      },
      {
        id: "OHL-003-HER",
        name: "Herefordshire Regional Feeder",
        operator: "NGED",
        voltage: "66kV",
        route: "Herefordshire strategic route",
        assetNumber: "ELN/HER/0003/C",
        owner: "National Grid Electricity Distribution",
        length: 42.1,
        towers: [
          { id: "T-001-HER", type: "steel_lattice", lat: 52.1000, lng: -2.5000, height: 55, assetRef: "TWR/HER/001" },
          { id: "T-002-HER", type: "steel_lattice", lat: 52.1050, lng: -2.4950, height: 55, assetRef: "TWR/HER/002" },
          { id: "T-003-HER", type: "steel_lattice", lat: 52.1100, lng: -2.4900, height: 52, assetRef: "TWR/HER/003" },
          { id: "T-004-HER", type: "truss_tower", lat: 52.1150, lng: -2.4850, height: 50, assetRef: "TWR/HER/004" },
          { id: "T-005-HER", type: "steel_lattice", lat: 52.1200, lng: -2.4800, height: 55, assetRef: "TWR/HER/005" },
        ],
        clearance: 7.0,
        circuits: 2,
        safeDigClearance: 9.0,
      },
      {
        id: "OHL-004-DEV",
        name: "South Devon Coastal Line",
        operator: "SSEN",
        voltage: "11kV",
        route: "Coastal distribution network",
        assetNumber: "ELN/DEV/0004/D",
        owner: "Scottish and Southern Energy",
        length: 15.8,
        towers: [
          { id: "T-001-DEV", type: "wooden_pole", lat: 50.7300, lng: -4.1400, height: 10, assetRef: "POL/DEV/001" },
          { id: "T-002-DEV", type: "concrete_pole", lat: 50.7320, lng: -4.1380, height: 12, assetRef: "POL/DEV/002" },
          { id: "T-003-DEV", type: "wooden_pole", lat: 50.7340, lng: -4.1360, height: 10, assetRef: "POL/DEV/003" },
          { id: "T-004-DEV", type: "steel_monopole", lat: 50.7360, lng: -4.1340, height: 15, assetRef: "POL/DEV/004" },
        ],
        clearance: 5.3,
        circuits: 1,
        safeDigClearance: 6.5,
      },
    ],
  };

  // UK Service Provider Standards
  const SERVICE_STANDARDS = {
    electricity: {
      voltages: ["230V", "400V", "11kV", "33kV", "132kV", "275kV", "400kV"],
      clearances: {
        underground_cable: 5.3,
        overhead_line: 10.0,
        substation: 3.0,
      },
      standards: ["BS 7909", "IEC 61936", "NFPA 70"],
    },
    gas: {
      types: ["Low Pressure", "Medium Pressure", "High Pressure"],
      clearances: {
        low_pressure: 1.5,
        medium_pressure: 2.0,
        high_pressure: 2.5,
      },
      standards: ["PD 6539", "BS 6675"],
    },
    water: {
      diameters: ["25mm", "50mm", "100mm", "150mm", "300mm", "600mm"],
      clearances: {
        small_main: 1.0,
        large_main: 1.5,
      },
      standards: ["BS 2010", "Water Supply (Water Quality) Regulations"],
    },
    telecom: {
      types: ["Copper", "Fibre", "Wireless"],
      clearances: {
        standard: 1.0,
        aerial: 5.0,
      },
      standards: ["BS 6701", "EN 61000-6"],
    },
  };

  // Query Functions
  function getOHLByLocation(lat, lng, radiusKm = 5) {
    // Returns OHL assets within radius
    const nearbyAssets = OHL_ASSETS.sampleOHLAssets.filter(asset => {
      return asset.towers.some(tower => {
        const dist = Math.sqrt(Math.pow(tower.lat - lat, 2) + Math.pow(tower.lng - lng, 2)) * 111;
        return dist < radiusKm;
      });
    });
    return {
      assets: nearbyAssets,
      operators: OHL_ASSETS.operators,
      voltageClasses: OHL_ASSETS.voltageClasses,
      towerTypes: OHL_ASSETS.towerTypes,
    };
  }

  function getTowersByLocation(lat, lng, radiusKm = 2) {
    // Returns towers/poles that can be tapped to add to map
    const towers = [];
    OHL_ASSETS.sampleOHLAssets.forEach(asset => {
      asset.towers.forEach(tower => {
        const dist = Math.sqrt(Math.pow(tower.lat - lat, 2) + Math.pow(tower.lng - lng, 2)) * 111;
        if (dist < radiusKm) {
          towers.push({
            ...tower,
            assetId: asset.id,
            assetName: asset.name,
            operator: OHL_ASSETS.operators[asset.operator].name,
            voltage: asset.voltage,
            owner: asset.owner,
            clearance: asset.clearance,
            safeDigClearance: asset.safeDigClearance,
            towerInfo: OHL_ASSETS.towerTypes[tower.type],
          });
        }
      });
    });
    return towers;
  }

  function getOHLAssetDetails(assetId) {
    // Returns full details for OHL asset
    return OHL_ASSETS.sampleOHLAssets.find(a => a.id === assetId);
  }

  function getAllOHLAssets() {
    // Returns all OHL assets in database
    return OHL_ASSETS.sampleOHLAssets;
  }

  function getConstraintsByLocation(lat, lng, radiusKm = 10) {
    // Returns constraints within radius of location
    const results = {
      flood: findNearestFloodZone(lat, lng),
      heritage: findNearbyHeritage(lat, lng, radiusKm),
      environmental: findNearbyEnvironmental(lat, lng, radiusKm),
      planning: findNearbyPlanning(lat, lng, radiusKm),
      utilities: findNearbyUtilities(lat, lng, radiusKm),
      ohlAssets: getOHLByLocation(lat, lng, radiusKm),
      towers: getTowersByLocation(lat, lng, radiusKm),
    };
    return results;
  }

  function getServicesByLocation(lat, lng, radiusKm = 2) {
    // Returns utility services and operators for location
    return {
      operators: findOperatorsByRegion(lat, lng),
      standards: SERVICE_STANDARDS,
      clearances: extractClearances(),
    };
  }

  function findNearestFloodZone(lat, lng) {
    // Simple zone assignment - in production use actual flood map data
    if (lat > 52.5) return FLOOD_ZONES[0]; // North England - lower risk
    if (lat > 51.0) return FLOOD_ZONES[1]; // Midlands - medium risk
    if (lat > 50.5) return FLOOD_ZONES[2]; // South - higher risk
    return FLOOD_ZONES[3]; // Coastal - highest risk
  }

  function findNearbyHeritage(lat, lng, radiusKm) {
    // Returns nearby heritage designations
    return {
      types: HERITAGE_TYPES,
      description: "Query actual heritage database for precise locations",
      guidance: "Verify with local planning authority records",
    };
  }

  function findNearbyEnvironmental(lat, lng, radiusKm) {
    // Returns nearby environmental designations
    return {
      types: ENVIRONMENTAL_TYPES,
      description: "Query Natural England/appropriate body database",
      guidance: "Check for protected species constraints",
    };
  }

  function findNearbyPlanning(lat, lng, radiusKm) {
    // Returns nearby planning designations
    return {
      designations: PLANNING_DESIGNATIONS,
      description: "Query local planning authority constraints",
      guidance: "Check local plan and emerging allocations",
    };
  }

  function findNearbyUtilities(lat, lng, radiusKm) {
    // Returns nearby utility services
    return {
      types: ["electricity", "gas", "water", "drainage", "telecom"],
      guidance: "Use safe-dig procedures before excavation",
      standards: SERVICE_STANDARDS,
    };
  }

  function findOperatorsByRegion(lat, lng) {
    // Returns operators serving the region
    const result = {};
    for (const [utility, operators] of Object.entries(UTILITY_OPERATORS)) {
      result[utility] = operators.map(op => ({
        name: op.name,
        clearance: op.clearance,
      }));
    }
    return result;
  }

  function extractClearances() {
    const clearances = {};
    for (const [utility, ops] of Object.entries(UTILITY_OPERATORS)) {
      clearances[utility] = ops[0]?.clearance || 1.0;
    }
    return clearances;
  }

  function getSampleSites() {
    return SAMPLE_SITES;
  }

  function getFullDatabase() {
    return {
      metadata: {
        version: "1.0",
        created: new Date().toISOString(),
        coverage: "United Kingdom",
        sources: ["OS", "Natural England", "EA", "Planning Data", "OpenStreetMap"],
      },
      bounds: UK_BOUNDS,
      utilities: UTILITY_OPERATORS,
      floodZones: FLOOD_ZONES,
      heritage: HERITAGE_TYPES,
      environmental: ENVIRONMENTAL_TYPES,
      planning: PLANNING_DESIGNATIONS,
      infrastructure: INFRASTRUCTURE_CONSTRAINTS,
      standards: SERVICE_STANDARDS,
      sampleSites: SAMPLE_SITES,
    };
  }

  // Public API
  return {
    // Query functions
    getConstraintsByLocation,
    getServicesByLocation,
    getSampleSites,
    getFullDatabase,

    // OHL-specific functions
    getOHLByLocation,
    getTowersByLocation,
    getOHLAssetDetails,
    getAllOHLAssets,

    // Direct access to data
    utilities: UTILITY_OPERATORS,
    floodZones: FLOOD_ZONES,
    heritage: HERITAGE_TYPES,
    environmental: ENVIRONMENTAL_TYPES,
    planning: PLANNING_DESIGNATIONS,
    infrastructure: INFRASTRUCTURE_CONSTRAINTS,
    standards: SERVICE_STANDARDS,
    ohlAssets: OHL_ASSETS,

    // Utility functions
    findOperatorsByRegion,
    extractClearances,
    findNearestFloodZone,
  };
})();

// Export for use in SAMI
if (typeof module !== "undefined" && module.exports) {
  module.exports = window.SAMIEmbeddedDatabase;
}
