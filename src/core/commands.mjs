import { ASSETS, createAsset } from "./assets.mjs";
import {
  feature,
  trakwayPad,
  PRODUCTS,
  groupFeatures,
  ungroupFeatures,
  translate,
} from "./model.mjs";
import G from "./geometry.mjs";
export const commandExamples = [
  "Add a site office",
  "Create a 20 by 15 metre stone area",
  "Create a 15 by 15 metre Lion pad",
  "Make the selection blue",
  "Move selection 5 m east",
  "Group selected items",
];
const base = (type) => ({
  type,
  assetId: null,
  label: null,
  width: null,
  length: null,
  east: null,
  north: null,
  color: null,
  product: null,
  view: null,
});
export function localCommand(text) {
  if (/\b(and|then|avoid|don.t|do not)\b|^(how|why|what|where)\b/i.test(text))
    return null;
  const s = text.toLowerCase().trim(),
    size = s.match(
      /(\d+(?:\.\d+)?)\s*(?:m|metres?|meters?)?\s*(?:by|x|×)\s*(\d+(?:\.\d+)?)/,
    ),
    colours = {
      blue: "#4c8eb5",
      red: "#c67565",
      green: "#418f76",
      yellow: "#cead49",
      grey: "#97a6ab",
      gray: "#97a6ab",
      orange: "#d19a4c",
      white: "#ffffff",
      black: "#263d45",
    };
  let action;
  if (/\bungroup\b/.test(s)) action = base("ungroup");
  else if (/\bgroup\b/.test(s)) action = base("group");
  else if (/\b(delete|remove)\b.*\bselect/.test(s)) action = base("delete");
  else if (/\b(move|shift)\b/.test(s)) {
    const n = +(s.match(/(\d+(?:\.\d+)?)\s*(?:m|metres?|meters?)?/)?.[1] || 0);
    if (n && n <= 500)
      action = {
        ...base("move"),
        east: /west/.test(s) ? -n : /east/.test(s) ? n : 0,
        north: /south/.test(s) ? -n : /north/.test(s) ? n : 0,
      };
  } else if (/\b(make|colour|color|style)\b/.test(s)) {
    const color = Object.keys(colours).find((c) => s.includes(c));
    if (color) action = { ...base("style"), color: colours[color] };
  } else if (
    /\b(cad|satellite|street)\b/.test(s) &&
    /\b(show|switch|view|open)\b/.test(s)
  )
    action = {
      ...base("view"),
      view: s.includes("cad")
        ? "cad"
        : s.includes("satellite")
          ? "satellite"
          : "street",
    };
  else if (size && /pad|trakway/.test(s)) {
    const product = Object.keys(PRODUCTS).find((k) => s.includes(k)) || "lion";
    action = {
      ...base("trakwayPad"),
      width: +size[1],
      length: +size[2],
      product,
    };
  } else if (size && /area|compound|rectangle|stone/.test(s))
    action = {
      ...base("rectangle"),
      width: +size[1],
      length: +size[2],
      label: s.includes("stone")
        ? "Stone area"
        : s.includes("exclusion")
          ? "Exclusion zone"
          : "Compound",
    };
  else if (/\b(add|place|create)\b/.test(s)) {
    const asset =
      ASSETS.find((a) => s.includes(a.name.toLowerCase())) ||
      ASSETS.find((a) => s.includes(a.id));
    if (asset) {
      if (
        /\b(?:[2-9]|\d{2,}|two|three|four|five|six|seven|eight|nine|ten|multiple|several)\b/.test(
          s,
        )
      )
        return null;
      action = { ...base("asset"), assetId: asset.id };
    }
  }
  if (!action) return null;
  return {
    reply:
      "Ready to apply this change to your plan. Review it below; you can undo it afterwards.",
    actions: [action],
    mode: "local",
  };
}
export function describeAction(a) {
  switch (a.type) {
    case "asset":
      return (
        "Place " + (ASSETS.find((x) => x.id === a.assetId)?.name || a.assetId)
      );
    case "rectangle":
      return `Create ${a.width} × ${a.length} m ${a.label || "area"}`;
    case "trakwayPad":
      return `Create ${a.width} × ${a.length} m ${PRODUCTS[a.product || "lion"].name} pad`;
    case "style":
      return "Change selected item colour";
    case "move":
      return `Move selection ${a.east || 0} m east, ${a.north || 0} m north`;
    case "delete":
      return "Delete selected items";
    case "group":
      return "Group selected items";
    case "ungroup":
      return "Ungroup selected items";
    case "view":
      return "Open " + a.view + " view";
    default:
      return "No drawing change";
  }
}
export function applyActions(project, actions, selected, center) {
  let p = structuredClone(project),
    newIds = [];
  const pr = G.projection(center);
  for (const a of actions) {
    const at = pr.ll([a.east || 0, a.north || 0]);
    if (
      ["style", "move", "delete", "group", "ungroup"].includes(a.type) &&
      !selected.length
    )
      throw Error("Select the objects to change first.");
    if (
      ["rectangle", "trakwayPad"].includes(a.type) &&
      (!(a.width > 0 && a.length > 0) || a.width > 500 || a.length > 500)
    )
      throw Error("Choose dimensions between 0 and 500 m.");
    if (a.type === "asset") {
      const def = ASSETS.find((x) => x.id === a.assetId);
      if (!def) throw Error("This asset is not in the library.");
      const f = createAsset(def, at);
      p.features.push(f);
      newIds.push(f.id);
    } else if (a.type === "rectangle") {
      const stone = /stone/i.test(a.label),
        exclude = /exclusion/i.test(a.label);
      const f = feature(
        stone ? "stone" : exclude ? "exclusion" : "area",
        G.rectangle(at, a.width, a.length),
        {
          label: a.label || "Area",
          fill: stone ? "#d2c2a0" : exclude ? "#e0a99b" : "#a5c7bb",
          color: stone ? "#a18c67" : exclude ? "#be796b" : "#508a79",
        },
      );
      p.features.push(f);
      newIds.push(f.id);
    } else if (a.type === "trakwayPad") {
      const result = trakwayPad(
        at,
        a.width,
        a.length,
        PRODUCTS[a.product || "lion"],
      );
      p.features.push(...result.features);
      newIds.push(...result.features.map((f) => f.id));
    } else if (a.type === "style")
      p.features = p.features.map((f) =>
        selected.includes(f.id)
          ? {
              ...f,
              properties: {
                ...f.properties,
                fill: a.color || f.properties.fill,
                color: a.color || f.properties.color,
              },
            }
          : f,
      );
    else if (a.type === "move") {
      const moved = new Map(
        translate(
          p.features.filter((f) => selected.includes(f.id)),
          a.east || 0,
          a.north || 0,
        ).map((f) => [f.id, f]),
      );
      p.features = p.features.map((f) => moved.get(f.id) || f);
    } else if (a.type === "delete")
      p.features = p.features.filter((f) => !selected.includes(f.id));
    else if (a.type === "group")
      p.features = groupFeatures(p.features, selected);
    else if (a.type === "ungroup")
      p.features = ungroupFeatures(p.features, selected);
    else if (a.type === "view") p.view.basemap = a.view;
  }
  if (p.features.length > 15000)
    throw Error("This would exceed the project object limit.");
  return {
    project: p,
    selected: newIds.length
      ? newIds
      : selected.filter((id) => p.features.some((f) => f.id === id)),
  };
}
