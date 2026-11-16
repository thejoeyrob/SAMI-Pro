import { feature } from "./model.mjs";
import G from "./geometry.mjs";
const a = (
  id,
  name,
  category,
  width,
  length,
  kind,
  color,
  description = "",
) => ({ id, name, category, width, length, kind, color, description });
export const ASSETS = [
  a("office", "Site office", "Welfare", 3, 9, "cabin", "#5a8f9c"),
  a("canteen", "Canteen", "Welfare", 3, 9, "cabin", "#6c9d7d"),
  a("drying", "Drying room", "Welfare", 3, 6, "cabin", "#8c9a78"),
  a("toilet", "Toilet block", "Welfare", 2.4, 6, "toilet", "#6e9ec0"),
  a("wc", "Portable WC", "Welfare", 1.2, 1.2, "toilet", "#6398ba"),
  a("security", "Security cabin", "Welfare", 2.4, 3, "cabin", "#8b95a4"),
  a(
    "container",
    "Storage container",
    "Logistics",
    2.44,
    6.06,
    "container",
    "#6b8c95",
  ),
  a(
    "container40",
    "40 ft container",
    "Logistics",
    2.44,
    12.19,
    "container",
    "#6b8c95",
  ),
  a("skip", "Waste skip", "Logistics", 1.8, 3.5, "skip", "#d6a14b"),
  a("wheelwash", "Wheel wash", "Logistics", 4, 8, "wheelwash", "#739baf"),
  a("stack", "Material stack", "Logistics", 3, 5, "stack", "#b29169"),
  a("fuel", "Fuel bowser", "Logistics", 1.5, 3, "tank", "#bd9b58"),
  a("generator", "Generator", "Logistics", 1.4, 3, "generator", "#687c87"),
  a("car", "Car", "Vehicles", 1.85, 4.6, "car", "#8b9da8"),
  a("van", "Van", "Vehicles", 2.05, 5.5, "van", "#7c92a6"),
  a("rigid", "Rigid HGV", "Vehicles", 2.55, 10, "truck", "#618a9f"),
  a("artic", "Articulated HGV", "Vehicles", 2.55, 16.5, "artic", "#658e9d"),
  a("tipper", "Tipper truck", "Vehicles", 2.55, 8, "tipper", "#d3a14d"),
  a("excavator", "Tracked excavator", "Plant", 3, 7, "excavator", "#dcaa46"),
  a("dumper", "Site dumper", "Plant", 2.2, 4.5, "dumper", "#d5a247"),
  a("telehandler", "Telehandler", "Plant", 2.5, 6, "telehandler", "#d5a247"),
  a("roller", "Road roller", "Plant", 2.1, 5, "roller", "#d5a247"),
  a("crane", "Mobile crane", "Plant", 3, 12, "crane", "#d5a247"),
  a("towercrane", "Tower crane", "Plant", 3, 3, "towercrane", "#be943a"),
  a("mewp", "Scissor lift", "Plant", 1.2, 2.5, "mewp", "#bb894f"),
  a("gate", "Vehicle gate", "Access", 6, 0.4, "gate", "#7c8f91"),
  a("barrier", "Concrete barrier", "Access", 0.6, 3, "barrier", "#9aa2a2"),
  a("turnstile", "Turnstile", "Access", 1.5, 1.5, "turnstile", "#899b9f"),
  a("parking", "Parking bay", "Access", 2.5, 5, "parking", "#77919a"),
  a("accessible", "Accessible bay", "Access", 3.6, 6, "parking", "#6687a5"),
  a("firstaid", "First aid", "Safety", 1.2, 1.2, "firstaid", "#398e6c"),
  a("fire", "Fire point", "Safety", 1.2, 1.2, "fire", "#c66c60"),
  a("muster", "Assembly point", "Safety", 1.5, 1.5, "muster", "#3a9775"),
  a("spill", "Spill kit", "Safety", 1, 1, "spill", "#c7a245"),
  a("pole", "OHL pole", "Utilities", 0.5, 0.5, "pole", "#a76571"),
  a("pylon", "Electricity pylon", "Utilities", 5, 5, "pylon", "#9b697b"),
  a("substation", "Substation", "Utilities", 5, 6, "substation", "#9b697b"),
  a("lighting", "Lighting tower", "Utilities", 1.5, 2, "lighting", "#baa15d"),
  a("marquee", "Marquee", "Events", 10, 20, "marquee", "#a3b3ab"),
  a("stage", "Stage", "Events", 12, 8, "stage", "#8c83a0"),
  a("vendor", "Vendor unit", "Events", 3, 6, "vendor", "#b98971"),
  a("tree", "Tree", "Landscape", 5, 5, "tree", "#679c74"),
];
export const categoryNames = [...new Set(ASSETS.map((a) => a.category))];
export const safeColor = (v, fallback = "#668b95") =>
  /^#[a-f0-9]{3,8}$/i.test(String(v)) ? String(v) : fallback;
export const escapeXML = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
export function assetSVG(kind, color = "#739eaa", stroke = "#253c45") {
  const c = safeColor(color),
    s = safeColor(stroke, "#253c45"),
    body = `fill="${c}" stroke="${s}" stroke-width="2"`,
    dark = `fill="${s}" stroke="none"`,
    white = 'fill="#f5f8f7" stroke="none"';
  const box = (x, y, w, h, r = 2) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${body}/>`;
  const wheel = (x, y) =>
    `<rect x="${x}" y="${y}" width="10" height="16" rx="2" ${dark}/>`;
  const lines = (n, x, y, w, gap) =>
    Array.from(
      { length: n },
      (_, i) =>
        `<path d="M${x} ${y + i * gap}h${w}" fill="none" stroke="${s}" stroke-opacity=".45" stroke-width="1.4"/>`,
    ).join("");
  let content = "";
  switch (kind) {
    case "cabin":
      content =
        box(10, 4, 80, 92) +
        `<path d="M10 35h80M10 68h80M49 4v31" fill="none" stroke="${s}" stroke-width="1.5"/><path d="M12 16v12m0 18v12m76-42v12m0 18v12m0 28v10M27 94h24" stroke="#d8efed" stroke-width="4"/><path d="M45 96v-18a18 18 0 0 1 18 18" fill="none" stroke="${s}" stroke-width="1"/>`;
      break;
    case "toilet":
      content =
        box(10, 4, 80, 92) +
        `<path d="M10 35h80M10 66h80M50 4v92" fill="none" stroke="${s}"/>` +
        [
          [30, 20],
          [70, 20],
          [30, 51],
          [70, 51],
          [30, 82],
          [70, 82],
        ]
          .map(
            ([x, y]) =>
              `<ellipse cx="${x}" cy="${y}" rx="9" ry="10" ${white}/><path d="M${x - 8} ${y - 7}h16" stroke="${s}"/>`,
          )
          .join("");
      break;
    case "container":
      content =
        box(9, 3, 82, 94, 1) +
        lines(11, 14, 10, 72, 8) +
        `<path d="M50 87v10M9 87h82" stroke="${s}" fill="none"/>`;
      break;
    case "skip":
      content = `<path d="M12 9h76l8 20-10 62H14L4 29Z" ${body}/><path d="M22 19h56l7 13-8 48H23l-8-48Z" fill="${s}" opacity=".35"/><path d="M4 29h92M17 57l25-16 22 23 20-21" fill="none" stroke="${s}"/>`;
      break;
    case "stack":
      content =
        box(5, 5, 90, 90, 1) +
        lines(7, 8, 17, 84, 12) +
        `<path d="M33 5v90M67 5v90" stroke="${s}" stroke-width="2"/>`;
      break;
    case "car":
    case "van":
      content =
        wheel(7, 18) +
        wheel(83, 18) +
        wheel(7, 71) +
        wheel(83, 71) +
        box(17, 3, 66, 94, 12) +
        `<path d="M25 20h50l4 15H21ZM21 70h58l-4 12H25Z" fill="#c6e1e6" stroke="${s}"/><path d="M23 41v21m54-21v21" stroke="${s}" stroke-width="2"/>`;
      break;
    case "truck":
    case "artic":
    case "tipper":
      content =
        wheel(5, 12) +
        wheel(85, 12) +
        wheel(5, 72) +
        wheel(85, 72) +
        wheel(5, 52) +
        wheel(85, 52) +
        box(15, 3, 70, 23, 4) +
        `<path d="M23 8h54v7H23Z" fill="#c6e1e6" stroke="${s}"/>` +
        box(13, 33, 74, 64, 1) +
        lines(
          kind === "tipper" ? 4 : 9,
          20,
          40,
          60,
          kind === "tipper" ? 15 : 6,
        );
      break;
    case "excavator":
      content =
        `<rect x="9" y="45" width="18" height="48" rx="4" ${dark}/><rect x="73" y="45" width="18" height="48" rx="4" ${dark}/>` +
        box(25, 43, 50, 49, 10) +
        `<circle cx="50" cy="66" r="17" ${body}/><path d="M48 62L56 28 66 8 77 7 65 34 57 67Z" ${body}/><path d="M64 5h24l3 13-27-1Z" ${body}/><path d="M28 53h16v23H28Z" fill="#c6e1e6" stroke="${s}"/>`;
      break;
    case "dumper":
      content =
        wheel(5, 12) +
        wheel(85, 12) +
        wheel(5, 73) +
        wheel(85, 73) +
        box(18, 5, 64, 49, 5) +
        box(23, 63, 54, 30, 4) +
        `<path d="M27 13h46l-4 31H31Z" fill="${s}" opacity=".35"/>`;
      break;
    case "telehandler":
      content =
        wheel(7, 16) +
        wheel(83, 16) +
        wheel(7, 72) +
        wheel(83, 72) +
        box(20, 27, 60, 65, 6) +
        `<path d="M51 70V9h10v61ZM40 2h34v7H40Z" ${body}/><path d="M27 40h20v28H27Z" fill="#c6e1e6" stroke="${s}"/>`;
      break;
    case "roller":
      content =
        `<rect x="8" y="5" width="84" height="26" rx="6" ${body}/><rect x="8" y="69" width="84" height="26" rx="6" ${body}/>` +
        box(28, 30, 44, 40, 5) +
        `<path d="M8 16h84M8 82h84" stroke="${s}"/><rect x="35" y="39" width="30" height="22" fill="#c6e1e6"/>`;
      break;
    case "crane":
      content =
        wheel(8, 10) +
        wheel(82, 10) +
        wheel(8, 65) +
        wheel(82, 65) +
        wheel(8, 80) +
        wheel(82, 80) +
        box(20, 6, 60, 88, 5) +
        `<path d="M48 83V1h12v82Z" ${body}/><path d="M5 30h90M5 75h90" stroke="${s}" stroke-width="4"/><path d="M5 23v14m90-14v14M5 68v14m90-14v14" stroke="${s}" stroke-width="5"/>`;
      break;
    case "towercrane":
      content = `<path d="M6 46h88v10H6ZM45 6h10v88H45Z" ${body}/><circle cx="50" cy="50" r="12" ${body}/><path d="M5 45l15 11 15-11 15 11 15-11 15 11 15-11" stroke="${s}" fill="none"/>`;
      break;
    case "mewp":
      content =
        wheel(8, 15) +
        wheel(82, 15) +
        wheel(8, 70) +
        wheel(82, 70) +
        box(18, 5, 64, 90, 4) +
        `<path d="M25 15l50 70M75 15L25 85" stroke="${s}" stroke-width="3"/>`;
      break;
    case "generator":
      content =
        box(12, 4, 76, 92, 7) +
        lines(6, 24, 15, 52, 5) +
        `<circle cx="50" cy="72" r="15" fill="${s}" opacity=".4"/><path d="M52 57l-10 17h10l-3 15 14-20H52Z" fill="#f4da91"/>`;
      break;
    case "tank":
      content =
        box(16, 4, 68, 92, 24) +
        `<ellipse cx="50" cy="49" rx="26" ry="39" fill="none" stroke="${s}"/><circle cx="50" cy="22" r="7" ${body}/>`;
      break;
    case "wheelwash":
      content =
        box(4, 4, 92, 92, 1) +
        `<path d="M24 6v88M76 6v88" stroke="${s}" stroke-width="8"/>` +
        lines(9, 8, 12, 84, 9);
      break;
    case "gate":
      content = `<path d="M4 45h92v10H4Z" ${body}/><path d="M5 35v30m90-30v30M12 45l12 10 12-10 12 10 12-10 12 10 12-10" fill="none" stroke="${s}" stroke-width="2"/>`;
      break;
    case "barrier":
      content = `<path d="M12 2h76l6 94H6Z" ${body}/><path d="M26 2v94m48-94v94" stroke="${s}"/>`;
      break;
    case "turnstile":
      content =
        box(5, 5, 90, 90, 8) +
        `<circle cx="50" cy="50" r="32" fill="none" stroke="${s}" stroke-width="3"/><path d="M50 50V18m0 32L22 66m28-16 28 16" stroke="${s}" stroke-width="5"/>`;
      break;
    case "parking":
      content = `<path d="M8 5v90h84V5" fill="${c}" fill-opacity=".15" stroke="${s}" stroke-width="2"/><text x="50" y="64" font-family="Arial" font-size="40" text-anchor="middle" fill="${s}">P</text>`;
      break;
    case "firstaid":
      content =
        box(5, 5, 90, 90, 10) +
        `<path d="M41 22h18v19h19v18H59v19H41V59H22V41h19Z" ${white}/>`;
      break;
    case "fire":
      content =
        box(5, 5, 90, 90, 10) +
        `<path d="M53 18c12 22-3 23 9 33 8-6 9-11 7-17 20 28 10 48-19 48-26 0-36-24-18-43-1 18 7 13 9 5 4-9 8-15 12-26Z" ${white}/>`;
      break;
    case "muster":
      content =
        box(5, 5, 90, 90, 8) +
        `<circle cx="50" cy="44" r="8" ${white}/><path d="M39 72V59q11-13 22 0v13M13 13l18 18m-18 56 18-18m56-56L69 31m18 56L69 69" stroke="#fff" stroke-width="5" fill="none"/>`;
      break;
    case "spill":
      content =
        box(5, 5, 90, 90, 9) +
        `<path d="M50 20c7 14 23 29 23 42a23 23 0 0 1-46 0c0-13 16-28 23-42Z" fill="#fff"/>`;
      break;
    case "pole":
      content = `<circle cx="50" cy="50" r="17" ${body}/><path d="M50 4v92M4 50h92" stroke="${s}" stroke-width="3"/>`;
      break;
    case "pylon":
      content = `<path d="M9 9h82v82H9ZM9 9l82 82M91 9 9 91M35 35h30v30H35Z" fill="none" stroke="${c}" stroke-width="5"/>`;
      break;
    case "substation":
      content =
        box(4, 4, 92, 92, 1) +
        `<path d="M25 22h50v54H25Z" ${body}/><path d="M51 26L36 51h15l-4 24 19-30H52Z" fill="#f3d38c"/>`;
      break;
    case "lighting":
      content =
        box(20, 26, 60, 58, 5) +
        `<path d="M50 20v58M10 18h80" stroke="${s}" stroke-width="5"/><rect x="10" y="8" width="25" height="14" fill="#f6df94" stroke="${s}"/><rect x="65" y="8" width="25" height="14" fill="#f6df94" stroke="${s}"/>`;
      break;
    case "marquee":
      content =
        box(3, 3, 94, 94, 1) +
        `<path d="M3 3l47 25L97 3M3 97l47-25 47 25M50 28v44M3 3v94M97 3v94" stroke="${s}" fill="none"/><path d="M50 28L3 50l47 22 47-22Z" fill="#fff" fill-opacity=".2" stroke="${s}"/>`;
      break;
    case "stage":
      content =
        box(3, 15, 94, 82, 1) +
        `<path d="M3 15V3h94v12M12 15v72h76V15" fill="none" stroke="${s}" stroke-width="3"/>`;
      break;
    case "vendor":
      content =
        box(8, 5, 84, 90, 4) +
        `<path d="M8 64h84v23H8Z" fill="#f0e4cd" stroke="${s}"/>` +
        lines(5, 17, 15, 66, 8);
      break;
    case "tree":
      content = `<path d="M50 6c18-10 30 3 28 17 22 0 26 21 10 32 17 21-4 36-20 31-5 17-32 15-35 1C10 94-2 72 12 56-4 39 10 19 27 22 24 8 36 0 50 6Z" ${body}/><circle cx="49" cy="51" r="10" fill="${s}" opacity=".25"/>`;
      break;
    default:
      content = box(5, 5, 90, 90, 8);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><g stroke-linejoin="round" stroke-linecap="round">${content}</g></svg>`;
}
export function createAsset(asset, center, angle = 0) {
  return feature(
    "asset",
    G.rectangle(center, asset.width, asset.length, angle),
    {
      label: asset.name,
      assetId: asset.id,
      assetKind: asset.kind,
      width: asset.width,
      length: asset.length,
      angle,
      color: "#304c56",
      fill: asset.color,
      opacity: 1,
      layer: "assets",
    },
  );
}
