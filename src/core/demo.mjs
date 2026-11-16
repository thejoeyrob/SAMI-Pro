import G from "./geometry.mjs";
import { newProject, feature, trakwayRun } from "./model.mjs";
import { ASSETS, createAsset } from "./assets.mjs";
export function demoProject() {
  const p = newProject("Riverside works · Example");
  p.example = true;
  p.meta = {
    ...p.meta,
    client: "Example project",
    company: "YOUR COMPANY",
    author: "Site planning team",
    address: "Illustrative layout · not a surveyed site",
    reference: "SAM-001",
    revision: "P01",
    notes:
      "An editable example to explore SAMI Elite. All site geometry is illustrative.",
  };
  const pr = G.projection(p.origin),
    pt = (x, y) => pr.ll([x, y]),
    rect = (x, y, w, h, props) =>
      feature(props.type || "area", G.rectangle(pt(x, y), w, h), props);
  p.area = [...pt(-100, -72), ...pt(100, 72)];
  p.view = { center: p.origin, zoom: 18, basemap: "cad" };
  p.planBase = [
    rect(-36, 28, 66, 40, {
      type: "building",
      layer: "context",
      label: "Existing warehouse",
      color: "#a3afb0",
      fill: "#edf0ec",
      opacity: 1,
    }),
    rect(46, 36, 40, 27, {
      type: "building",
      layer: "context",
      label: "Existing workshop",
      color: "#a3afb0",
      fill: "#edf0ec",
      opacity: 1,
    }),
    rect(0, -84, 240, 13, {
      type: "road",
      layer: "context",
      label: "Example access road",
      color: "#b7bcba",
      fill: "#e8eae6",
      opacity: 1,
    }),
  ];
  p.features = [
    rect(8, -15, 110, 42, {
      type: "stone",
      label: "Compacted stone compound",
      color: "#b0a085",
      fill: "#d8c8a6",
      opacity: 0.4,
    }),
    feature(
      "fence",
      {
        type: "LineString",
        coordinates: [
          pt(-90, -56),
          pt(-90, 62),
          pt(89, 62),
          pt(89, -56),
          pt(7, -56),
        ],
      },
      {
        label: "Site perimeter",
        color: "#8c9a9b",
        dash: "6 4",
        layer: "design",
      },
    ),
    rect(-63, -10, 35, 25, {
      type: "exclusion",
      label: "Exclusion zone",
      color: "#c67a68",
      fill: "#e5b3a4",
      opacity: 0.24,
    }),
    feature(
      "access",
      { type: "Point", coordinates: pt(-2, -65) },
      {
        label: "Main delivery entrance",
        layer: "access",
        color: "#198e79",
        words: "",
      },
    ),
    feature(
      "measure",
      { type: "LineString", coordinates: [pt(-47, -40), pt(63, -40)] },
      { label: "Compound width", color: "#536f78" },
    ),
    feature(
      "text",
      { type: "Point", coordinates: pt(-35, 28) },
      { label: "EXISTING WAREHOUSE", fontSize: 12, color: "#718187" },
    ),
    feature(
      "text",
      { type: "Point", coordinates: pt(35, -4) },
      { label: "MATERIAL LAYDOWN", fontSize: 10, color: "#8c7c60" },
    ),
  ];
  const add = (id, x, y, angle = 90) =>
    p.features.push(
      createAsset(
        ASSETS.find((a) => a.id === id),
        pt(x, y),
        angle,
      ),
    );
  add("office", 69, 10);
  add("canteen", 69, -1);
  add("toilet", 69, -12);
  add("container", 43, -25);
  add("container", 27, -25);
  add("excavator", -28, -12, 40);
  add("dumper", -15, -21, 25);
  add("skip", -40, -25);
  add("firstaid", 60, 20, 0);
  add("muster", 81, 20, 0);
  add("car", -68, 48, 90);
  add("car", -68, 42, 90);
  add("tree", -80, 15, 0);
  add("tree", 78, 50, 0);
  const t = trakwayRun([pt(-2, -65), pt(-2, -20), pt(12, -20)], {
    product: "lion",
    name: "Lion",
    length: 2.41,
    width: 3,
    overlap: 0,
    lateralOverlap: 0,
    lanes: 2,
  });
  p.features.push(...t.features);
  return p;
}
