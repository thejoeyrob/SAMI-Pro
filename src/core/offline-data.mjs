// SAMI Elite 3.0.0 - Offline Data Library
// Bundled datasets for CAD, services, and constraints
// Users can import additional survey data as needed

export const OFFLINE_DATA = {
  // Sample constraint features (users can import their own)
  constraints: [
    // Heritage designations, flood zones, ecological data
    // Users import specific constraints for their sites
  ],

  // Sample service features (users can import their own)
  services: [
    // Utilities, overhead lines, etc.
    // Users import specific service data for their sites
  ],

  // UK-specific reference data
  uk_references: {
    // Common utilities and their characteristics
    utilities: {
      electricity: {
        color: "#bf6e59",
        voltage_classes: ["LV", "MV", "HV", "EHV"],
        default_clearance: 5.3,
      },
      gas: {
        color: "#bd9e3f",
        pressure_classes: ["LMP", "MP", "IP"],
        default_clearance: 2,
      },
      water: {
        color: "#4b9bb9",
        types: ["potable", "waste", "surface"],
        default_clearance: 1,
      },
      telecom: {
        color: "#7d72b4",
        types: ["copper", "fibre", "wireless"],
        default_clearance: 1,
      },
      sewer: {
        color: "#948e77",
        types: ["foul", "combined", "surface"],
        default_clearance: 1,
      },
    },

    // Heritage constraint types
    heritage: [
      "Listed Building",
      "Conservation Area",
      "Scheduled Monument",
      "World Heritage Site",
      "Historic Battlefield",
      "Historic Landscape",
    ],

    // Environmental/ecological constraints
    ecology: [
      "Site of Special Scientific Interest (SSSI)",
      "Special Protection Area (SPA)",
      "Special Area of Conservation (SAC)",
      "Ramsar Site",
      "Ancient Woodland",
      "Protected Species Habitat",
    ],

    // Flood risk zones
    flood: [
      "Flood Zone 1 (Low Risk)",
      "Flood Zone 2 (Medium Risk)",
      "Flood Zone 3a (High Risk)",
      "Flood Zone 3b (Functional Floodplain)",
    ],

    // Planning constraints
    planning: [
      "Green Belt",
      "Area of Outstanding Natural Beauty (AONB)",
      "National Park",
      "World Heritage Site Buffer",
      "Proximity to Airport (safeguarding)",
      "Ministry of Defence Safeguarding",
      "Television Reception",
    ],
  },
};

// Local CAD data - returns empty with helpful message
export function getLocalCAD(bounds) {
  return {
    state: "empty",
    message: "Local mode: CAD data not bundled. Import survey/mapping data or draw manually.",
    features: [],
    source: "Local (offline)",
    bounds,
    cached: false,
  };
}

// Local constraints - returns reference data
export function getLocalConstraints(bounds) {
  return {
    state: "empty",
    message: "Local mode: Import specific constraint data for your site location",
    features: [],
    source: "Local (offline)",
    bounds,
    cached: false,
    reference: OFFLINE_DATA.uk_references.heritage.concat(
      OFFLINE_DATA.uk_references.ecology,
      OFFLINE_DATA.uk_references.flood,
      OFFLINE_DATA.uk_references.planning,
    ),
  };
}

// Local services - returns reference data
export function getLocalServices(bounds) {
  return {
    state: "empty",
    message: "Local mode: Import utility records from service providers",
    features: [],
    source: "Local (offline)",
    bounds,
    cached: false,
    reference: Object.entries(OFFLINE_DATA.uk_references.utilities).map(
      ([name, data]) => ({
        type: name,
        color: data.color,
        note: `Typical clearance: ${data.default_clearance}m`,
      }),
    ),
  };
}

// Store for user-imported data
let userImportedData = {
  constraints: [],
  services: [],
  cad: [],
  custom: [],
};

export function importUserData(type, features) {
  if (userImportedData[type]) {
    userImportedData[type] = userImportedData[type].concat(features);
    return { success: true, count: features.length };
  }
  return { success: false, error: "Unknown data type" };
}

export function getUserData(type) {
  return userImportedData[type] || [];
}

export function clearUserData(type) {
  if (userImportedData[type]) {
    userImportedData[type] = [];
    return true;
  }
  return false;
}
