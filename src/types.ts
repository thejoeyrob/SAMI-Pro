export type Coord = [number, number];
export type Bounds = [number, number, number, number];
export type Feature = {
  type: "Feature";
  id: string;
  geometry: { type: string; coordinates: any };
  properties: Record<string, any>;
};
export type DataStatus = {
  state: "idle" | "loading" | "ready" | "empty" | "error" | "partial";
  message: string;
  count?: number;
  updatedAt?: string;
  source?: string;
  cached?: boolean;
};
export type Project = {
  format: "SAMI-ELITE-1";
  version: number;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  origin: Coord;
  area: Bounds | null;
  features: Feature[];
  planBase: Feature[];
  snapshots: Record<
    string,
    { features: Feature[]; status: DataStatus; bounds: Bounds }
  >;
  meta: {
    client: string;
    company: string;
    author: string;
    jobTitle: string;
    contact: string;
    address: string;
    reference: string;
    revision: string;
    notes: string;
    logo?: string;
  };
  view: { center: Coord; zoom: number; basemap: string };
  route?: any;
  library?: any[];
  legacy?: any;
  [key: string]: any;
};
export type Tool =
  | "select"
  | "pan"
  | "boundary"
  | "area"
  | "stone"
  | "line"
  | "stone-road"
  | "fence"
  | "exclusion"
  | "measure"
  | "text"
  | "note"
  | "access"
  | "trakway"
  | "asset"
  | "box"
  | "edit-points";
export type Asset = {
  id: string;
  name: string;
  category: string;
  width: number;
  length: number;
  color: string;
  kind: string;
  description?: string;
};
