import { migrateProject, feature, validateFeatures } from "./model.mjs";
import G from "./geometry.mjs";
export async function importFile(file, origin) {
  if (file.size > 30_000_000) throw Error("Choose a file smaller than 30 MB.");
  const name = file.name.toLowerCase();
  if (/\.(sami|json|geojson)$/.test(name))
    return { project: migrateProject(JSON.parse(await file.text())) };
  if (/\.(kml|gpx|kmz)$/.test(name)) {
    let text;
    if (name.endsWith(".kmz")) {
      const { unzipSync } = await import("fflate");
      let expanded = 0,
        entries = 0;
      const parts = unzipSync(new Uint8Array(await file.arrayBuffer()), {
        filter: (e) => {
          entries++;
          expanded += e.originalSize;
          if (entries > 100 || expanded > 40_000_000)
            throw Error("Archive exceeds safe limits.");
          return e.name.toLowerCase().endsWith(".kml");
        },
      });
      const key = Object.keys(parts).find((k) =>
        k.toLowerCase().endsWith(".kml"),
      );
      if (!key) throw Error("No KML document found.");
      text = new TextDecoder().decode(parts[key]);
    } else text = await file.text();
    const doc = new DOMParser().parseFromString(text, "text/xml");
    if (doc.querySelector("parsererror")) throw Error("Invalid XML file.");
    const parse = (s) =>
      s
        .trim()
        .split(/\s+/)
        .map((x) => x.split(",").slice(0, 2).map(Number));
    const fs = [];
    if (name.endsWith(".gpx")) {
      for (const seg of doc.querySelectorAll("trkseg,rte")) {
        const ps = [...seg.querySelectorAll("trkpt,rtept")].map((n) => [
          +n.getAttribute("lon"),
          +n.getAttribute("lat"),
        ]);
        if (ps.length > 1)
          fs.push(
            feature(
              "line",
              { type: "LineString", coordinates: ps },
              { label: "Imported GPX track" },
            ),
          );
      }
    } else
      for (const pm of doc.querySelectorAll("Placemark")) {
        const label = pm.querySelector("name")?.textContent || "Imported KML";
        let props = {};
        try {
          props = JSON.parse(
            pm.querySelector('Data[name="samiProperties"] value')
              ?.textContent || "{}",
          );
        } catch {}
        for (const el of pm.querySelectorAll("Point,LineString,Polygon")) {
          let geometry;
          if (el.tagName === "Point")
            geometry = {
              type: "Point",
              coordinates: parse(
                el.querySelector("coordinates").textContent,
              )[0],
            };
          else if (el.tagName === "LineString")
            geometry = {
              type: "LineString",
              coordinates: parse(el.querySelector("coordinates").textContent),
            };
          else
            geometry = {
              type: "Polygon",
              coordinates: [
                ...el.querySelectorAll("LinearRing coordinates"),
              ].map((e) => parse(e.textContent)),
            };
          fs.push(
            feature(props.type || "import", geometry, {
              ...props,
              label,
              source: "Imported " + file.name,
            }),
          );
        }
      }
    return { features: validateFeatures(fs) };
  }
  if (name.endsWith(".dxf")) {
    const { default: Parser } = await import("dxf-parser"),
      text = await file.text(),
      data = new Parser().parseSync(text);
    let anchor = origin;
    const m = text.match(/local origin WGS84 lon (-?[\d.]+) lat (-?[\d.]+)/);
    if (m) anchor = [+m[1], +m[2]];
    if (!G.validCoord(anchor))
      throw Error(
        "Set the site location first. DXF imports use a local metre origin.",
      );
    const pr = G.projection(anchor),
      unit = data.header?.$INSUNITS,
      unitScale =
        unit === 4 ? 0.001 : unit === 1 ? 0.0254 : unit === 2 ? 0.3048 : 1,
      fs = [];
    for (const e of data.entities || []) {
      const point = (p) => pr.ll([p.x * unitScale, p.y * unitScale]);
      let geometry;
      if (["LINE", "LWPOLYLINE", "POLYLINE"].includes(e.type)) {
        const ps = (e.vertices || []).map(point);
        if (ps.length < 2) continue;
        if (e.shape && ps.length > 2) {
          ps.push(ps[0]);
          geometry = { type: "Polygon", coordinates: [ps] };
        } else geometry = { type: "LineString", coordinates: ps };
      } else if (e.type === "CIRCLE")
        geometry = G.circlePolygon(point(e.center), e.radius * unitScale, 48);
      else if (e.type === "POINT")
        geometry = { type: "Point", coordinates: point(e.position) };
      else if (e.type === "TEXT" || e.type === "MTEXT") {
        geometry = {
          type: "Point",
          coordinates: point(e.startPoint || e.position),
        };
      } else continue;
      fs.push(
        feature(
          e.type === "TEXT" || e.type === "MTEXT" ? "text" : "import",
          geometry,
          {
            label: e.text || e.layer || "DXF",
            layer: "imports",
            source: file.name,
          },
        ),
      );
    }
    return {
      features: validateFeatures(fs),
      notice:
        "DXF imported in metres relative to the project origin. LINE, POLYLINE, CIRCLE, POINT and TEXT supported; blocks, splines and other entities are skipped. Verify alignment.",
    };
  }
  if (/\.(png|jpe?g|webp)$/.test(name)) {
    const url = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    return {
      image: url,
      notice:
        "Place and size this reference image on the plan. It is not automatically georeferenced.",
    };
  }
  throw Error(
    "Supported: .sami, GeoJSON, KML/KMZ, GPX, DXF and reference images. Convert DWG to DXF first.",
  );
}
