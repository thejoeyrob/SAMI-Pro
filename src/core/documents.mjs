import G from "./geometry.mjs";
import {
  planFeatures,
  boundsOfFeatures,
  coords,
  polygonArea,
  quantities,
} from "./model.mjs";
import { assetSVG, escapeXML, safeColor } from "./assets.mjs";
const num = (x) => Number(x).toFixed(3);
export function geometryPath(geometry, xy) {
  const line = (ps) =>
    ps.map((p, i) => `${i ? "L" : "M"}${xy(p).map(num).join(" ")}`).join(" ");
  if (geometry.type === "LineString") return line(geometry.coordinates);
  if (geometry.type === "MultiLineString")
    return geometry.coordinates.map(line).join(" ");
  if (geometry.type === "Polygon")
    return geometry.coordinates.map((r) => line(r) + "Z").join(" ");
  if (geometry.type === "MultiPolygon")
    return geometry.coordinates
      .flat()
      .map((r) => line(r) + "Z")
      .join(" ");
  return "";
}
export function renderFeatureSVG(
  f,
  xy,
  scale,
  { labels = true, technical = false } = {},
) {
  const p = f.properties,
    g = f.geometry,
    c = technical ? "#2c4149" : safeColor(p.color, "#526e76"),
    fill = technical ? "#ffffff" : safeColor(p.fill, "#d3ded8"),
    opacity = p.opacity ?? 0.5;
  let out = "";
  const ps = coords(g);
  if (!ps.length) return "";
  if (p.type === "asset" && p.assetKind && g.type === "Polygon") {
    const r = g.coordinates[0],
      tl = xy(r[3]),
      tr = xy(r[2]),
      bl = xy(r[0]),
      svg = assetSVG(p.assetKind, technical ? "#ffffff" : p.fill, c)
        .replace(/^<svg[^>]*>/, "")
        .replace(/<\/svg>$/, "");
    out = `<g opacity="${opacity}" transform="matrix(${num((tr[0] - tl[0]) / 100)} ${num((tr[1] - tl[1]) / 100)} ${num((bl[0] - tl[0]) / 100)} ${num((bl[1] - tl[1]) / 100)} ${num(tl[0])} ${num(tl[1])})">${svg}</g>`;
  } else if (
    p.type === "image" &&
    /^data:image\/(png|jpeg|webp);base64,/.test(p.image || "") &&
    g.type === "Polygon"
  ) {
    const r = g.coordinates[0],
      tl = xy(r[3]),
      tr = xy(r[2]),
      bl = xy(r[0]);
    out = `<image href="${p.image}" width="100" height="100" preserveAspectRatio="none" opacity="${opacity}" transform="matrix(${num((tr[0] - tl[0]) / 100)} ${num((tr[1] - tl[1]) / 100)} ${num((bl[0] - tl[0]) / 100)} ${num((bl[1] - tl[1]) / 100)} ${num(tl[0])} ${num(tl[1])})"/>`;
  } else if (g.type === "Point") {
    const [x, y] = xy(g.coordinates);
    if (p.type === "text") {
      return `<text x="${num(x)}" y="${num(y)}" font-family="Arial,sans-serif" font-size="${Math.max(1.8, Math.min(5, (p.fontSize || 12) * 0.25))}" text-anchor="middle" fill="${c}">${escapeXML(p.label)}</text>`;
    }
    if (p.type === "access")
      out = `<circle cx="${num(x)}" cy="${num(y)}" r="2.3" fill="#168a74"/><text x="${num(x)}" y="${num(y + 0.9)}" font-family="Arial" font-size="2.6" text-anchor="middle" fill="white">A</text>`;
    else
      out = `<circle cx="${num(x)}" cy="${num(y)}" r="1.3" fill="${fill}" stroke="${c}" stroke-width=".3"/>`;
  } else {
    const polygon = g.type.includes("Polygon"),
      dash =
        p.dash || p.type === "exclusion"
          ? "2 1"
          : p.layer === "ohl"
            ? "3 1.4"
            : "";
    out = `<path d="${geometryPath(g, xy)}" fill="${polygon ? fill : "none"}" fill-opacity="${polygon ? opacity : 1}" fill-rule="evenodd" stroke="${c}" stroke-width="${p.type === "panel" ? 0.12 : p.layer === "context" ? 0.18 : 0.32}" ${dash ? `stroke-dasharray="${dash}"` : ""} stroke-linejoin="round"/>`;
    if (p.type === "stone" || p.type === "stone-road")
      out += `<path d="${geometryPath(g, xy)}" fill="url(#gravel)" stroke="none"/>`;
    if (p.type === "measure" && g.type === "LineString") {
      const a = xy(ps[0]),
        b = xy(ps.at(-1)),
        label = G.length(ps).toFixed(2) + " m";
      out += `<path d="M${num(a[0] - 1)} ${num(a[1] - 1)}l2 2M${num(b[0] - 1)} ${num(b[1] - 1)}l2 2" stroke="${c}" stroke-width=".3"/><text x="${num((a[0] + b[0]) / 2)}" y="${num((a[1] + b[1]) / 2 - 1.6)}" font-family="Arial" font-size="2.8" text-anchor="middle" fill="${c}" >${label}</text>`;
    }
  }
  if (
    labels &&
    p.label &&
    p.type !== "panel" &&
    p.type !== "measure" &&
    p.layer !== "context" &&
    p.type !== "text"
  ) {
    const b = boundsOfFeatures([f]),
      at = xy([(b[0] + b[2]) / 2, b[1]]);
    out += `<text x="${num(at[0])}" y="${num(at[1] + 3.4)}" font-family="Arial" font-size="2.4" text-anchor="middle" fill="#38515a" >${escapeXML(p.label.slice(0, 48))}</text>`;
  }
  return out;
}
export function planSVG(
  p,
  {
    width = 394,
    height = 202,
    technical = false,
    labels = true,
    route = false,
    visibility = {},
  } = {},
) {
  let fs = planFeatures(p, visibility),
    b = p.area || boundsOfFeatures(fs);
  if (route && p.route?.geometry) {
    fs = [
      {
        type: "Feature",
        id: "route",
        geometry: p.route.geometry,
        properties: {
          type: "route",
          color: "#278e80",
          weight: 2,
          layer: "route",
        },
      },
      ...p.features.filter((f) => f.properties.type === "access"),
    ];
    b = boundsOfFeatures(fs);
  }
  if (!b)
    b = G.expandBoundsMeters(
      [
        p.origin[0] - 0.00001,
        p.origin[1] - 0.00001,
        p.origin[0] + 0.00001,
        p.origin[1] + 0.00001,
      ],
      50,
    );
  const origin = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2],
    pr = G.projection(origin),
    min = pr.xy([b[0], b[1]]),
    max = pr.xy([b[2], b[3]]),
    scale = Math.min(
      (width - 12) / Math.max(1, max[0] - min[0]),
      (height - 12) / Math.max(1, max[1] - min[1]),
    ),
    ox = (width - (max[0] - min[0]) * scale) / 2,
    oy = (height - (max[1] - min[1]) * scale) / 2,
    xy = (p) => {
      const [x, y] = pr.xy(p);
      return [(x - min[0]) * scale + ox, height - ((y - min[1]) * scale + oy)];
    };
  const metresPerMm = 1 / scale,
    scaleDenominator = 1000 / scale;
  const gridStep =
    [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].find((n) => n * scale > 12) ||
    1000;
  let grid = "";
  for (
    let x = Math.ceil(min[0] / gridStep) * gridStep;
    x < max[0];
    x += gridStep
  ) {
    const p1 = xy(pr.ll([x, min[1]])),
      p2 = xy(pr.ll([x, max[1]]));
    grid += `M${p1.join(",")}L${p2.join(",")}`;
  }
  for (
    let y = Math.ceil(min[1] / gridStep) * gridStep;
    y < max[1];
    y += gridStep
  ) {
    const p1 = xy(pr.ll([min[0], y])),
      p2 = xy(pr.ll([max[0], y]));
    grid += `M${p1.join(",")}L${p2.join(",")}`;
  }
  const occupied = [];
  const labelBox = (x, y, text) => [
    x - text.length * 0.72 - 1,
    y - 2.8,
    x + text.length * 0.72 + 1,
    y + 1,
  ];
  for (const f of fs.filter((f) =>
    ["measure", "text"].includes(f.properties.type),
  )) {
    const ps = coords(f.geometry),
      a = xy(ps[0]),
      b = xy(ps.at(-1));
    occupied.push(
      labelBox(
        (a[0] + b[0]) / 2,
        (a[1] + b[1]) / 2 - 1.6,
        f.properties.label || "000.00 m",
      ),
    );
  }
  let annotations = "";
  if (labels)
    for (const f of fs) {
      const p = f.properties;
      if (
        !p.label ||
        ["panel", "measure", "text"].includes(p.type) ||
        p.layer === "context"
      )
        continue;
      const label = p.label.slice(0, 48),
        b = boundsOfFeatures([f]);
      if (!b) continue;
      const bottom = xy([(b[0] + b[2]) / 2, b[1]]),
        top = xy([(b[0] + b[2]) / 2, b[3]]);
      const candidates = [
        [bottom[0], bottom[1] + 3.4],
        [top[0], top[1] - 2],
        ...[1, 2, 3, 4].map((i) => [bottom[0], bottom[1] + 3.4 + i * 4.2]),
      ];
      const at =
        candidates.find(([x, y]) => {
          const r = labelBox(x, y, label);
          return (
            r[0] > 2 &&
            r[2] < width - 2 &&
            r[1] > 2 &&
            r[3] < height - 2 &&
            !occupied.some(
              (q) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1],
            )
          );
        }) || candidates[0];
      occupied.push(labelBox(at[0], at[1], label));
      annotations += `<text x="${num(at[0])}" y="${num(at[1])}" font-family="Arial,sans-serif" font-size="2.4" text-anchor="middle" fill="#38515a">${escapeXML(label)}</text>`;
    }
  const content =
    fs
      .map((f) => renderFeatureSVG(f, xy, scale, { labels: false, technical }))
      .join("") + annotations;
  const boundary =
    !route && p.area
      ? `<path d="${geometryPath(G.boundsGeometry(p.area), xy)}" fill="none" stroke="#447f78" stroke-width=".35" stroke-dasharray="2 1.4"/>`
      : "";
  const scaleM =
    [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].find((n) => n * scale >= 24) ||
    1000;
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="0 0 ${width} ${height}"><defs><pattern id="gravel" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx=".6" cy=".7" r=".12" fill="#8e826d" opacity=".55"/><circle cx="2" cy="2.4" r=".1" fill="#8e826d" opacity=".4"/></pattern><clipPath id="sheetClip"><rect x="1" y="1" width="${width - 2}" height="${height - 2}"/></clipPath></defs><rect width="${width}" height="${height}" fill="white"/><g clip-path="url(#sheetClip)"><path d="${grid}" fill="none" stroke="#e6ece9" stroke-width=".12"/>${content}${boundary}</g><g transform="translate(${width - 12} 11)"><path d="M0 0l-2.2 7L0 5l2.2 2Z" fill="#35515a"/><text x="0" y="-2" font-family="Arial" font-size="3" text-anchor="middle" fill="#35515a">N</text></g><g transform="translate(8 ${height - 8})"><rect x="-2" y="-5" width="${scaleM * scale + 5}" height="9" fill="white" fill-opacity=".92"/><path d="M0 0h${scaleM * scale}M0 -1v2m${scaleM * scale} -2v2" stroke="#35515a" stroke-width=".4"/><text x="0" y="-2" font-family="Arial" font-size="2.5" fill="#35515a">0</text><text x="${scaleM * scale}" y="-2" font-family="Arial" font-size="2.5" text-anchor="end" fill="#35515a">${scaleM} m</text></g><rect x=".2" y=".2" width="${width - 0.4}" height="${height - 0.4}" fill="none" stroke="#ccd8d5" stroke-width=".3"/></svg>`,
    scaleDenominator,
    origin,
    metresPerMm,
  };
}
export function projectSVG(p, options = {}) {
  const plan = planSVG(p, options);
  return plan.svg;
}
export async function pdfDocument(
  p,
  {
    technical = false,
    labels = true,
    includeRoute = true,
    visibility = {},
  } = {},
) {
  const [{ jsPDF }] = await Promise.all([
    import("jspdf"),
    import("svg2pdf.js"),
  ]);
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a3",
    compress: true,
  });
  const q = quantities(p),
    total = includeRoute ? 2 : 1;
  const footer = (page, title, scale) => {
    pdf.setCharSpace(0);
    pdf.setDrawColor(190, 204, 201);
    pdf.line(13, 258, 407, 258);
    pdf.setTextColor(36, 62, 68);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(p.name.slice(0, 85), 17, 267);
    pdf.setFontSize(9);
    pdf.text(title, 17, 274);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    const meta = [
      `CLIENT  ${p.meta.client || "-"}`,
      `PREPARED  ${p.meta.author || "-"}${p.meta.jobTitle ? " / " + p.meta.jobTitle : ""}`,
      `COMPANY  ${p.meta.company || "-"}`,
      `REF  ${p.meta.reference || "-"}    REV  ${p.meta.revision || "P01"}`,
    ];
    meta.forEach((t, i) => pdf.text(t.slice(0, 100), 157, 265 + i * 5));
    pdf.text(
      `DATE  ${new Date().toLocaleDateString("en-GB")}    SHEET  ${page}/${total}`,
      305,
      267,
    );
    pdf.text(`SCALE  1:${Math.round(scale)} at A3 / print 100%`, 305, 274);
    pdf.text("Spatial Analysis & Mapping Intelligence", 305, 280);
    pdf.setFontSize(7);
    pdf.text(
      [p.meta.address, p.meta.contact]
        .filter(Boolean)
        .join("  |  ")
        .slice(0, 165),
      17,
      283,
    );
    pdf.setFontSize(6.5);
    pdf.setTextColor(101, 116, 119);
    pdf.text(
      "Planning reference. Verify dimensions, access and services on site and with the relevant owner before works.",
      17,
      289,
    );
    pdf.text("SAMI ELITE", 385, 289);
  };
  const header = (title) => {
    pdf.setCharSpace(0);
    pdf.setFillColor(17, 36, 43);
    pdf.rect(0, 0, 420, 25, "F");
    pdf.setTextColor(242, 249, 246);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("SAMI", 14, 16);
    pdf.setFontSize(8);
    pdf.setTextColor(130, 218, 194);
    pdf.text("ELITE", 40, 16);
    pdf.setTextColor(229, 238, 234);
    pdf.setFontSize(11);
    pdf.text(title, 64, 16);
    if (p.meta.logo && /^data:image\/(png|jpeg)/.test(p.meta.logo)) {
      try {
        const img = pdf.getImageProperties(p.meta.logo),
          ratio = Math.min(32 / img.width, 17 / img.height);
        pdf.addImage(
          p.meta.logo,
          undefined,
          407 - img.width * ratio,
          4,
          img.width * ratio,
          img.height * ratio,
        );
      } catch {}
    }
  };
  const plan = planSVG(p, { technical, labels, visibility });
  header("SITE LOGISTICS PLAN");
  await pdf.svg(
    new DOMParser().parseFromString(plan.svg, "image/svg+xml").documentElement,
    { x: 13, y: 32, width: 394, height: 202 },
  );
  pdf.setCharSpace(0);
  pdf.setTextColor(76, 98, 100);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(
    `SITE ${(q.siteArea / 10000).toFixed(2)} ha     TRAKWAY ${q.panels} panels     STONE ${q.stoneArea.toFixed(1)} m2     ASSETS ${q.assets}`,
    17,
    241,
  );
  const layers = [
    ...new Set(planFeatures(p, visibility).map((f) => f.properties.layer)),
  ].filter(Boolean);
  pdf.text("LAYERS  " + layers.join("  /  "), 17, 247);
  pdf.setFontSize(7);
  pdf.text(
    `Origin WGS84 ${plan.origin[1].toFixed(7)}, ${plan.origin[0].toFixed(7)}  |  ${p.example ? "Illustrative example geometry" : "Sources where loaded: © OpenStreetMap contributors (ODbL); Historic England; Natural England; Planning Data; contains OS data © Crown copyright"}`,
    17,
    253,
  );
  footer(1, "Site plan", plan.scaleDenominator);
  if (includeRoute) {
    pdf.addPage("a3", "landscape");
    header("ROUTE TO SITE & ACCESS BRIEF");
    let scale = plan.scaleDenominator;
    if (p.route?.geometry) {
      const routePlan = planSVG(p, {
        route: true,
        width: 270,
        height: 170,
        labels: true,
      });
      scale = routePlan.scaleDenominator;
      await pdf.svg(
        new DOMParser().parseFromString(routePlan.svg, "image/svg+xml")
          .documentElement,
        { x: 13, y: 33, width: 270, height: 170 },
      );
      pdf.setCharSpace(0);
      pdf.setTextColor(43, 69, 76);
      pdf.setFontSize(10);
      pdf.text(
        `${p.route.distanceKm.toFixed(1)} km   /   ${Math.round(p.route.durationSeconds / 60)} min   /   ${p.route.vehicle?.name || "Truck profile"}`,
        17,
        213,
      );
      pdf.setFontSize(7);
      pdf.text(
        pdf.splitTextToSize(
          p.route.warning || "Verify route and all restrictions before travel.",
          265,
        ),
        17,
        220,
      );
      pdf.text(
        (p.route.source || "") + " · " + (p.route.updatedAt || "").slice(0, 10),
        17,
        233,
      );
    } else {
      pdf.setTextColor(62, 84, 90);
      pdf.setFontSize(16);
      pdf.text("Access brief", 17, 45);
      pdf.setFontSize(10);
      pdf.text("No calculated route is saved in this project.", 17, 56);
      pdf.text(
        "Access points below remain part of the portable project.",
        17,
        63,
      );
    }
    pdf.setTextColor(46, 74, 79);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("ACCESS POINTS", 296, 42);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    let y = 51;
    for (const f of p.features
      .filter((f) => f.properties.type === "access")
      .slice(0, 8)) {
      pdf.setFont("helvetica", "bold");
      pdf.text(f.properties.label.slice(0, 45), 296, y);
      pdf.setFont("helvetica", "normal");
      const c = f.geometry.coordinates;
      pdf.text(`${c[1].toFixed(6)}, ${c[0].toFixed(6)}`, 296, y + 5);
      pdf.text(
        f.properties.words
          ? "///" + f.properties.words
          : "what3words address not saved",
        296,
        y + 10,
      );
      y += 22;
    }
    pdf.setFont("helvetica", "bold");
    pdf.text("DELIVERY NOTES", 296, Math.max(100, y + 3));
    pdf.setFont("helvetica", "normal");
    pdf.text(
      pdf
        .splitTextToSize(
          (p.meta.notes || "No delivery notes entered.").slice(0, 1400),
          105,
        )
        .slice(0, 20),
      296,
      Math.max(108, y + 11),
    );
    if (p.route?.maneuvers?.length) {
      pdf.setFontSize(7);
      let yy = 243;
      for (const m of p.route.maneuvers.slice(-2)) {
        pdf.text(pdf.splitTextToSize(m.instruction, 260)[0], 17, yy);
        yy += 5;
      }
    }
    footer(2, "Route and access brief", scale);
  }
  pdf.setProperties({
    title: p.name + " · SAMI Elite",
    author: p.meta.author || p.meta.company || "SAMI Elite",
    subject: "Site logistics and access planning",
    creator: "SAMI Elite 3.0.0",
  });
  return pdf.output("blob");
}
export function dxfDocument(p) {
  const origin = p.origin,
    pr = G.projection(origin),
    pairs = [
      0,
      "SECTION",
      2,
      "HEADER",
      9,
      "$ACADVER",
      1,
      "AC1015",
      9,
      "$INSUNITS",
      70,
      6,
      9,
      "$MEASUREMENT",
      70,
      1,
      0,
      "ENDSEC",
      0,
      "SECTION",
      2,
      "ENTITIES",
    ];
  const push = (...a) => pairs.push(...a);
  for (const f of planFeatures(p)) {
    const g = f.geometry,
      layer = String(f.properties.layer || "design")
        .replace(/[^a-z0-9_-]/gi, "_")
        .slice(0, 30);
    const line = (ps) => {
      for (let i = 1; i < ps.length; i++) {
        const a = pr.xy(ps[i - 1]),
          b = pr.xy(ps[i]);
        push(
          0,
          "LINE",
          8,
          layer,
          10,
          a[0],
          20,
          a[1],
          30,
          0,
          11,
          b[0],
          21,
          b[1],
          31,
          0,
        );
      }
    };
    if (g.type === "Point") {
      const [x, y] = pr.xy(g.coordinates);
      push(0, "POINT", 8, layer, 10, x, 20, y, 30, 0);
      if (f.properties.label)
        push(
          0,
          "TEXT",
          8,
          layer,
          10,
          x,
          20,
          y + 1,
          30,
          0,
          40,
          1,
          1,
          String(f.properties.label).replace(/[\r\n]/g, " "),
        );
    } else if (g.type === "LineString") line(g.coordinates);
    else if (g.type === "Polygon" || g.type === "MultiLineString")
      g.coordinates.forEach(line);
    else if (g.type === "MultiPolygon") g.coordinates.flat().forEach(line);
  }
  push(0, "ENDSEC", 0, "EOF");
  return (
    `999\nSAMI Elite - metres; local origin WGS84 lon ${origin[0]} lat ${origin[1]}; X east Y north; not OSGB36\n` +
    pairs.join("\n") +
    "\n"
  );
}
export function kmlDocument(p) {
  const geom = (g) => {
    const cs = (a) => a.map((c) => c[0] + "," + c[1] + ",0").join(" ");
    if (g.type === "Point")
      return `<Point><coordinates>${cs([g.coordinates])}</coordinates></Point>`;
    if (g.type === "LineString")
      return `<LineString><coordinates>${cs(g.coordinates)}</coordinates></LineString>`;
    if (g.type === "Polygon")
      return `<Polygon>${g.coordinates.map((r, i) => `<${i ? "inner" : "outer"}BoundaryIs><LinearRing><coordinates>${cs(r)}</coordinates></LinearRing></${i ? "inner" : "outer"}BoundaryIs>`).join("")}</Polygon>`;
    if (g.type === "MultiPolygon" || g.type === "MultiLineString")
      return `<MultiGeometry>${g.coordinates.map((c) => geom({ type: g.type === "MultiPolygon" ? "Polygon" : "LineString", coordinates: c })).join("")}</MultiGeometry>`;
    return "";
  };
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${escapeXML(p.name)}</name>${planFeatures(
    p,
  )
    .map(
      (f) =>
        `<Placemark><name>${escapeXML(f.properties.label)}</name><ExtendedData><Data name="samiProperties"><value>${escapeXML(JSON.stringify(f.properties))}</value></Data></ExtendedData>${geom(f.geometry)}</Placemark>`,
    )
    .join("")}</Document></kml>`;
}
export function csvDocument(p) {
  const esc = (s) => '"' + String(s ?? "").replaceAll('"', '""') + '"';
  return [
    [
      "id",
      "label",
      "type",
      "group",
      "area_m2",
      "length_m",
      "longitude",
      "latitude",
      "source",
    ],
    ...p.features
      .filter((f) => !f.properties.guideHidden)
      .map((f) => [
        f.id,
        f.properties.label,
        f.properties.type,
        f.properties.groupId,
        polygonArea(f.geometry).toFixed(2),
        f.geometry.type === "LineString"
          ? G.length(f.geometry.coordinates).toFixed(2)
          : "",
        coords(f.geometry)[0][0],
        coords(f.geometry)[0][1],
        f.properties.source || "User drawing",
      ]),
  ]
    .map((row) => row.map(esc).join(","))
    .join("\r\n");
}
