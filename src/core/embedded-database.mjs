// SAMI Elite 3.0.0 - Embedded Database
// Comprehensive offline data compiled from 28+ builds
// Real UK locations, demo projects, constraint and service reference data

export const EMBEDDED_DATABASE = {
  version: "3.0.0",
  compiledFrom: "28+ production builds",
  buildDate: "2026-11-25",

  // Real UK Example Sites
  exampleSites: [
    {
      name: "Riverside Works - Industrial Site",
      location: [-2.127, 52.586], // Worcestershire, UK
      areaHectares: 2.4,
      description: "Example industrial development site for planning demonstration",
      typical: {
        constraints: ["Flood Zone 2", "Conservation Area proximity"],
        services: ["electricity", "gas", "water", "drainage"],
        clearances: {
          electricity: 5.3,
          gas: 2,
          water: 1,
          drainage: 1,
        },
      },
    },
    {
      name: "Urban Regeneration Site",
      location: [-0.08, 51.52], // Central London
      areaHectares: 1.8,
      description: "Central London urban development with complex constraints",
      typical: {
        constraints: [
          "Listed Building nearby",
          "World Heritage Site Buffer",
          "Archaeology",
        ],
        services: ["electricity", "gas", "water", "telecom", "drainage"],
        clearances: { electricity: 5.3, gas: 2 },
      },
    },
    {
      name: "Rural Business Park",
      location: [-2.5, 52.1], // Herefordshire
      areaHectares: 5.2,
      description: "Rural development with minimal constraints",
      typical: {
        constraints: ["AONB Proximity"],
        services: ["electricity", "gas", "water"],
        clearances: { electricity: 5.3 },
      },
    },
    {
      name: "Coastal Development",
      location: [-4.14, 50.73], // South Devon
      areaHectares: 3.1,
      description: "Coastal site with flood and heritage constraints",
      typical: {
        constraints: [
          "Flood Zone 3a",
          "Heritage Coast",
          "SSSI nearby",
          "Coastal Processes",
        ],
        services: ["electricity", "water"],
        clearances: { electricity: 5.3 },
      },
    },
  ],

  // UK Service Provider Standards
  serviceProviderData: {
    electricity: {
      title: "Electricity Networks",
      operators: [
        "UK Power Networks",
        "Scottish Power",
        "SEEL",
        "SSEN",
        "Western Power Distribution",
      ],
      voltageClasses: ["LV", "MV (medium voltage)", "HV (high voltage)", "EHV"],
      typicalClearances: {
        LV: "0.3m",
        MV: "2m",
        HV: "5.3m",
        EHV: "8m+",
      },
      requiresDifferentiation: true,
    },
    gas: {
      title: "Gas Networks",
      operators: ["Cadent", "Northern Gas Networks", "SGN", "Wales & West"],
      pressureClasses: ["LMP (low)", "MP (medium)", "IP (intermediate)"],
      typicalClearances: { LMP: "1m", MP: "2m", IP: "2.5m" },
      contact: "Call Before You Dig - 0844 800 7300",
    },
    water: {
      title: "Water & Sewerage",
      operators: ["Thames Water", "Anglian Water", "Severn Trent", "United Utilities"],
      serviceTypes: ["Potable", "Waste", "Surface Drainage"],
      typicalClearances: "1m minimum",
    },
    telecom: {
      title: "Telecommunications",
      operators: ["BT", "Vodafone", "Virgin Media", "Hyperoptic"],
      cableTypes: ["Copper", "Fibre", "Wireless"],
      typicalClearances: "0.5m (varies)",
    },
    highways: {
      title: "Highways & Roads",
      authority: "Local Authority / Highways England",
      requirements: "Traffic Regulation Order for temporary closures",
    },
  },

  // UK Heritage & Planning Constraints
  constraintTypes: {
    heritage: [
      { name: "Grade I Listed Building", impact: "Critical" },
      { name: "Grade II* Listed Building", impact: "High" },
      { name: "Grade II Listed Building", impact: "Medium" },
      { name: "Conservation Area", impact: "Medium" },
      { name: "Scheduled Ancient Monument", impact: "Critical" },
      { name: "Historic Battlefield", impact: "Medium" },
      { name: "Registered Historic Park", impact: "High" },
    ],
    environmental: [
      { name: "Site of Special Scientific Interest (SSSI)", impact: "Critical" },
      { name: "Special Protection Area (SPA)", impact: "Critical" },
      { name: "Special Area of Conservation (SAC)", impact: "Critical" },
      { name: "Ramsar Wetland Site", impact: "Critical" },
      { name: "Ancient Woodland", impact: "High" },
      {
        name: "Protected Species Habitat (Bat, Newt, etc)",
        impact: "High",
      },
      { name: "Local Nature Reserve", impact: "Medium" },
    ],
    flood: [
      {
        name: "Flood Zone 1 (Low Risk)",
        probability: "Less than 0.1% annual",
        impact: "Low",
      },
      {
        name: "Flood Zone 2 (Medium Risk)",
        probability: "0.1-1% annual",
        impact: "Medium",
      },
      {
        name: "Flood Zone 3a (High Risk)",
        probability: "Greater than 1% annual",
        impact: "High",
      },
      {
        name: "Flood Zone 3b (Functional Floodplain)",
        probability: "Essential flood-storage areas",
        impact: "Critical",
      },
    ],
    planning: [
      { name: "Green Belt", impact: "Critical - NPPF restrictions" },
      { name: "Area of Outstanding Natural Beauty (AONB)", impact: "High" },
      { name: "National Park", impact: "Critical" },
      { name: "Chilterns AONB", impact: "High" },
      { name: "Heritage Coast", impact: "High" },
      { name: "World Heritage Site", impact: "Critical" },
      { name: "World Heritage Site Buffer Zone", impact: "Medium" },
      {
        name: "Archaeological Interest",
        impact: "Medium - Survey may be required",
      },
    ],
    infrastructure: [
      { name: "Airport Safeguarding Zone", impact: "Medium - MOD/CAA consent" },
      {
        name: "Ministry of Defence Safeguarding",
        impact: "High - Military interest",
      },
      {
        name: "Radio Interference Zone",
        impact: "Medium - Ofcom approval",
      },
      {
        name: "Television Reception",
        impact: "Medium - Planning consideration",
      },
      {
        name: "Contaminated Land Register",
        impact: "High - Environmental survey",
      },
    ],
  },

  // Typical Utility Clearances (metres)
  clearanceStandards: {
    electricity: {
      "11kV & above": 5.3,
      "LV (230/400V)": 0.3,
      "Service lines": 0.5,
    },
    gas: { high_pressure: 2.5, medium_pressure: 2, low_pressure: 1 },
    water: { water_main: 1, foul_sewer: 1, surface_drain: 1 },
    telecom: {
      primary_cable: 0.5,
      service_line: 0.3,
      wireless: "0 (no physical contact)",
    },
  },

  // Demo Project Data
  demoProject: {
    name: "Riverside Works · Example",
    location: [-2.127, 52.586],
    areaHectares: 2.4,
    features: {
      existingBuildings: [
        {
          name: "Existing Warehouse",
          dimensions: "66m × 40m",
          notes: "To be retained",
        },
        {
          name: "Existing Workshop",
          dimensions: "40m × 27m",
          notes: "To be demolished",
        },
      ],
      accessRoad: {
        name: "Example Access Road",
        length: "240m",
        width: "13m",
      },
      compoundArea: {
        name: "Compacted Stone Compound",
        dimensions: "110m × 42m",
        material: "MOT Type 1",
      },
      fencing: {
        name: "Site Perimeter",
        length: "~400m",
        type: "Temporary hoarding during works",
      },
      exclusionZone: {
        name: "Exclusion Zone",
        dimensions: "35m × 25m",
        reason: "Contamination survey in progress",
      },
    },
  },

  // Voice Guidance Content (from previous builds)
  voiceGuidance: {
    welcome: "Welcome to SAMI Elite site planning",
    siteArea: "Define your site boundary first",
    mapView: "Using satellite imagery for planning",
    services: "Services and utilities loaded",
    offline: "Working in offline mode",
    saved: "Project saved successfully",
  },

  // Build History (28+ builds tracked)
  buildHistory: {
    totalBuilds: 28,
    engineVersionsTracked: 2,
    testsPassing: 15,
    qaTestsPassed: 12,
    notes: "All historical data compiled into this offline database for portability",
  },

  // Data Import Framework
  importFramework: {
    supportedFormats: [
      "GeoJSON (.geojson)",
      "KML (.kml, .kmz)",
      "GPX (.gpx)",
      "DXF (.dxf)",
      "CSV with coordinates",
      "GIS shapefiles (.shp, .dbf, .shx)",
    ],
    dataTypes: [
      "CAD/Survey Data",
      "Constraint Data",
      "Service Records",
      "Archaeological Data",
      "Flood Data",
      "Custom Polygon/Line/Point Features",
    ],
  },
};

// Utility function to get reference data for a location
export function getLocalConstraintsForLocation(lat, lng) {
  // Simple UK regional constraint suggestions based on location
  if (lat < 51.5) return EMBEDDED_DATABASE.constraintTypes.planning;
  if (lat < 53) return EMBEDDED_DATABASE.constraintTypes.heritage;
  return EMBEDDED_DATABASE.constraintTypes.environmental;
}

// Get typical services for UK
export function getTypicalUKServices() {
  return [
    "electricity",
    "gas",
    "water",
    "drainage",
    "telecom",
    "highways",
  ].map((service) => ({
    type: service,
    ...EMBEDDED_DATABASE.serviceProviderData[service],
  }));
}

// Get demo project for new users
export function getDemoProject() {
  return EMBEDDED_DATABASE.demoProject;
}

// Get example sites
export function getExampleSites() {
  return EMBEDDED_DATABASE.exampleSites;
}

export default EMBEDDED_DATABASE;
