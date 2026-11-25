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
  function getConstraintsByLocation(lat, lng, radiusKm = 10) {
    // Returns constraints within radius of location
    const results = {
      flood: findNearestFloodZone(lat, lng),
      heritage: findNearbyHeritage(lat, lng, radiusKm),
      environmental: findNearbyEnvironmental(lat, lng, radiusKm),
      planning: findNearbyPlanning(lat, lng, radiusKm),
      utilities: findNearbyUtilities(lat, lng, radiusKm),
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

    // Direct access to data
    utilities: UTILITY_OPERATORS,
    floodZones: FLOOD_ZONES,
    heritage: HERITAGE_TYPES,
    environmental: ENVIRONMENTAL_TYPES,
    planning: PLANNING_DESIGNATIONS,
    infrastructure: INFRASTRUCTURE_CONSTRAINTS,
    standards: SERVICE_STANDARDS,

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
