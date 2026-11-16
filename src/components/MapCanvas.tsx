import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Project, Feature, Coord, Bounds, Tool } from "../types";
import G from "../core/geometry.mjs";
import {
  boundsOfFeatures,
  centerOf,
  coords,
  translate,
} from "../core/model.mjs";
import { assetSVG, escapeXML, safeColor } from "../core/assets.mjs";
export type MapAPI = {
  fit: () => void;
  fly: (p: Coord, zoom?: number) => void;
  zoom: (by: number) => void;
  bounds: () => Bounds;
  center: () => Coord;
  addCenter: () => void;
  map?: L.Map;
};
type Props = {
  project: Project;
  selected: string[];
  tool: Tool;
  points: Coord[];
  visibility: Record<string, boolean>;
  basemap: string;
  labels: boolean;
  snap: boolean;
  multi: boolean;
  apiRef: React.RefObject<MapAPI | null>;
  onPoint: (c: Coord) => void;
  onSelect: (id: string, add: boolean, individual?: boolean) => void;
  onClear: () => void;
  onFinish: () => void;
  onMove: (east: number, north: number) => void;
  onVertex: (id: string, ring: number, vertex: number, c: Coord) => void;
  onViewport: (b: Bounds, c: Coord, zoom: number) => void;
  onSourceSelect: (f: Feature) => void;
  onDropAsset: (id: string, c: Coord) => void;
  onMapError: (msg: string) => void;
};
const ll = (p: number[]) => L.latLng(p[1], p[0]);
const bb = (b: number[]) => L.latLngBounds([b[1], b[0]], [b[3], b[2]]);
export function MapCanvas(props: Props) {
  const el = useRef<HTMLDivElement>(null),
    mapRef = useRef<L.Map>(null),
    propsRef = useRef(props),
    layers = useRef<any>({}),
    renderRef = useRef<() => void>(() => {}),
    viewportTimer = useRef<any>(null);
  propsRef.current = props;
  useEffect(() => {
    const p = propsRef.current;
    const map = L.map(el.current!, {
      zoomControl: false,
      attributionControl: true,
      doubleClickZoom: false,
      preferCanvas: false,
      maxZoom: 23,
      minZoom: 3,
    }).setView(
      ll(p.project.view?.center || p.project.origin),
      p.project.view?.zoom || 18,
    );
    mapRef.current = map;
    map.attributionControl.setPrefix(false);
    layers.current.context = L.layerGroup().addTo(map);
    layers.current.features = L.layerGroup().addTo(map);
    layers.current.edit = L.layerGroup().addTo(map);
    layers.current.draft = L.layerGroup().addTo(map);
    layers.current.frame = L.layerGroup().addTo(map);
    const getBounds = () => {
      const b = map.getBounds();
      return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()] as Bounds;
    };
    const getCenter = () => [map.getCenter().lng, map.getCenter().lat] as Coord;
    const add = (c: Coord) => {
      const p = propsRef.current;
      if (p.tool === "select" || p.tool === "pan" || p.tool === "edit-points") {
        if (!p.multi) p.onClear();
        return;
      }
      let point = c;
      if (p.snap) {
        let nearest: Coord | null = null,
          dist = 13;
        const xy = map.latLngToContainerPoint(ll(c));
        for (const f of p.project.features.filter(
          (f) => !f.properties.hidden && !f.properties.guideHidden,
        ))
          for (const cp of coords(f.geometry)) {
            const d = map.latLngToContainerPoint(ll(cp)).distanceTo(xy);
            if (d < dist) {
              dist = d;
              nearest = cp;
            }
          }
        if (nearest) point = nearest;
        else {
          const pr = G.projection(p.project.origin),
            xy = pr.xy(c);
          point = pr.ll(xy.map((x: number) => Math.round(x * 2) / 2)) as Coord;
        }
      }
      p.onPoint(point);
    };
    map.on("click", (e: L.LeafletMouseEvent) =>
      add([e.latlng.lng, e.latlng.lat]),
    );
    map.on("dblclick", () => {
      const p = propsRef.current;
      if (p.points.length >= 2) p.onFinish();
    });
    map.on("moveend zoomend", () => {
      clearTimeout(viewportTimer.current);
      viewportTimer.current = setTimeout(
        () =>
          propsRef.current.onViewport(getBounds(), getCenter(), map.getZoom()),
        80,
      );
      renderRef.current();
    });
    props.apiRef.current = {
      map,
      fit: () => {
        const p = propsRef.current,
          b = p.project.area || boundsOfFeatures(p.project.features);
        if (b) map.fitBounds(bb(b), { padding: [38, 38], maxZoom: 21 });
      },
      fly: (c, z = 18) => map.setView(ll(c), z, { animate: false }),
      zoom: (by) => map.setZoom(map.getZoom() + by),
      bounds: getBounds,
      center: getCenter,
      addCenter: () => add(getCenter()),
    };
    const observer = new ResizeObserver(() =>
      map.invalidateSize({ pan: false }),
    );
    observer.observe(el.current!);
    map.whenReady(() =>
      propsRef.current.onViewport(getBounds(), getCenter(), map.getZoom()),
    );
    const drop = (e: DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer?.getData("application/sami-asset");
      if (!id) return;
      const rect = el.current!.getBoundingClientRect(),
        c = map.containerPointToLatLng([
          e.clientX - rect.left,
          e.clientY - rect.top,
        ]);
      propsRef.current.onDropAsset(id, [c.lng, c.lat]);
    };
    const over = (e: DragEvent) => e.preventDefault();
    el.current!.addEventListener("dragover", over);
    el.current!.addEventListener("drop", drop);
    return () => {
      observer.disconnect();
      clearTimeout(viewportTimer.current);
      el.current?.removeEventListener("drop", drop);
      el.current?.removeEventListener("dragover", over);
      map.remove();
      props.apiRef.current = null;
    };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const old = layers.current.base;
    if (old) {
      map.removeLayer(old);
      layers.current.base = null;
    }
    if (props.basemap === "street")
      layers.current.base = L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxNativeZoom: 19,
          maxZoom: 23,
          attribution: "© OpenStreetMap contributors",
          crossOrigin: true,
        },
      ).addTo(map);
    if (props.basemap === "satellite")
      layers.current.base = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxNativeZoom: 19,
          maxZoom: 23,
          attribution:
            "Imagery © Esri, Maxar, Earthstar Geographics and GIS User Community",
          crossOrigin: true,
        },
      ).addTo(map);
    let failures = 0;
    layers.current.base?.on("tileerror", () => {
      if (++failures === 3)
        propsRef.current.onMapError(
          "The basemap is unavailable. CAD and your saved drawings still work.",
        );
    });
  }, [props.basemap]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getContainer().style.cursor = ["select", "pan"].includes(props.tool)
      ? ""
      : "crosshair";
  }, [props.tool]);
  const render = () => {
    const map = mapRef.current;
    if (!map || !layers.current.features) return;
    const p = propsRef.current;
    for (const key of ["context", "features", "edit", "draft", "frame"])
      layers.current[key].clearLayers();
    const selected = new Set(p.selected);
    const click = (layer: any, f: Feature, source = false) => {
      layer.on("click", (e: any) => {
        L.DomEvent.stopPropagation(e);
        if (!["select", "pan", "edit-points"].includes(propsRef.current.tool)) {
          const c = e.latlng || ll(centerOf([f]));
          propsRef.current.onPoint([c.lng, c.lat]);
          return;
        }
        if (source) {
          propsRef.current.onSourceSelect(f);
          return;
        }
        if (f.properties.locked) return;
        propsRef.current.onSelect(
          f.id,
          propsRef.current.multi ||
            e.originalEvent?.shiftKey ||
            e.originalEvent?.ctrlKey,
          e.originalEvent?.altKey,
        );
      });
    };
    const draw = (
      f: Feature,
      layer: L.LayerGroup,
      source = false,
      preview = false,
    ) => {
      const m = f.properties;
      if (m.hidden || m.guideHidden || p.visibility[m.layer] === false) return;
      const color = safeColor(m.color, "#5a7f87"),
        fill = safeColor(m.fill, "#b0cdc4"),
        active = selected.has(f.id),
        g = f.geometry;
      let item: any;
      if (m.type === "asset" && m.assetKind && g.type === "Polygon") {
        const c = centerOf([f]),
          r = g.coordinates[0],
          width = Math.max(
            8,
            map
              .latLngToLayerPoint(ll(r[0]))
              .distanceTo(map.latLngToLayerPoint(ll(r[1]))),
          ),
          height = Math.max(
            8,
            map
              .latLngToLayerPoint(ll(r[1]))
              .distanceTo(map.latLngToLayerPoint(ll(r[2]))),
          );
        item = L.marker(ll(c), {
          icon: L.divIcon({
            className: "asset-marker",
            iconSize: [width, height],
            iconAnchor: [width / 2, height / 2],
            html: `<div class="plan-symbol" style="opacity:${Math.max(0, Math.min(1, m.opacity ?? 1))};width:${width}px;height:${height}px;transform:rotate(${-Number(m.angle || 0)}deg)">${assetSVG(m.assetKind, fill, color)}</div>`,
          }),
          keyboard: !source,
          title: m.label || "Asset",
          zIndexOffset: active ? 30 : 0,
        });
      } else if (
        m.type === "image" &&
        /^data:image\/(png|jpeg|webp);base64,/.test(m.image || "")
      ) {
        const r=g.coordinates[0],c=centerOf([f]),width=map.latLngToLayerPoint(ll(r[0])).distanceTo(map.latLngToLayerPoint(ll(r[1]))),height=map.latLngToLayerPoint(ll(r[1])).distanceTo(map.latLngToLayerPoint(ll(r[2])));
        item=L.marker(ll(c),{icon:L.divIcon({className:'reference-image-marker',iconSize:[width,height],iconAnchor:[width/2,height/2],html:`<img src="${m.image}" alt="" style="width:${width}px;height:${height}px;opacity:${Number(m.opacity??.8)};transform:rotate(${-Number(m.angle||0)}deg)"/>`}),title:m.label||'Reference image'});
      } else if (g.type === "Point") {
        const c = g.coordinates;
        if (m.type === "text")
          item = L.marker(ll(c), {
            icon: L.divIcon({
              className: "text-marker",
              iconSize: [180, 28],
              iconAnchor: [90, 14],
              html: `<span style="color:${color};font-size:${Math.min(36, Math.max(10, m.fontSize || 12))}px">${escapeXML(m.label)}</span>`,
            }),
            keyboard: true,
            title: m.label,
          });
        else if (m.type === "access")
          item = L.marker(ll(c), {
            icon: L.divIcon({
              className: "access-marker",
              iconSize: [30, 36],
              iconAnchor: [15, 32],
              html: "<span>A</span>",
            }),
            keyboard: true,
            title: m.label,
          });
        else if (m.type === "note")
          item = L.marker(ll(c), {
            icon: L.divIcon({
              className: "note-marker",
              iconSize: [24, 24],
              html: "<span>i</span>",
            }),
            keyboard: true,
            title: m.label,
          });
        else
          item = L.circleMarker(ll(c), {
            radius: m.power === "tower" ? 5 : 3,
            color,
            weight: 1.4,
            fillColor: fill,
            fillOpacity: 0.9,
          });
      } else {
        item = L.geoJSON(f as any, {
          style: () => ({
            color,
            fillColor: fill,
            fillOpacity: m.opacity ?? 0.35,
            weight: m.type === "panel" ? 0.7 : source ? 1.2 : m.weight || 1.6,
            dashArray:
              m.dash ||
              (["exclusion", "fence"].includes(m.type)
                ? "6 4"
                : m.layer === "ohl"
                  ? "10 5"
                  : undefined),
            className: m.type === "stone" ? "gravel-feature" : "",
          }),
        });
      }
      if (!item) return;
      item.addTo(layer);
      if (!preview) click(item, f, source);
      if (
        p.labels &&
        m.label &&
        m.type !== "panel" &&
        m.type !== "text" &&
        m.layer !== "context"
      ) {
        item.bindTooltip(
          () => {
            const s = document.createElement("span");
            s.textContent =
              m.label + (m.voltage ? " · " + m.voltage + " V" : "");
            return s;
          },
          {
            permanent:
              ["access", "asset"].includes(m.type) && map.getZoom() >= 18,
            direction: "bottom",
            className: "plan-label",
            offset: [0, 4],
          },
        );
      }
      if (m.type === "measure" && g.type === "LineString") {
        item.bindTooltip(G.length(g.coordinates).toFixed(2) + " m", {
          permanent: true,
          direction: "center",
          className: "dimension-label",
        });
      }
    };
    if (p.basemap === "cad")
      for (const f of p.project.planBase) draw(f, layers.current.context, true);
    if (p.project.area)
      L.rectangle(bb(p.project.area), {
        color: "#3c9585",
        weight: 1,
        dashArray: "8 6",
        fill: false,
        interactive: false,
      }).addTo(layers.current.frame);
    if (p.project.route?.geometry && p.visibility.route !== false)
      draw(
        {
          type: "Feature",
          id: "saved-route",
          geometry: p.project.route.geometry,
          properties: {
            type: "route",
            label: "Route to site",
            color: "#267fbd",
            weight: 3,
            layer: "route",
          },
        } as Feature,
        layers.current.context,
        true,
      );
    for (const s of Object.values(p.project.snapshots || {}))
      for (const f of s.features) draw(f, layers.current.context, true);
    for (const f of p.project.features) draw(f, layers.current.features);
    const chosen = p.project.features.filter(
      (f) =>
        selected.has(f.id) && !f.properties.hidden && !f.properties.guideHidden,
    );
    if (chosen.length && ["select", "pan", "edit-points"].includes(p.tool)) {
      const b = boundsOfFeatures(chosen),
        c = centerOf(chosen);
      if (b) {
        const pixelA = map.latLngToLayerPoint([b[1], b[0]]),
          pixelB = map.latLngToLayerPoint([b[3], b[2]]);
        if (pixelA.distanceTo(pixelB) < 10)
          L.circleMarker(ll(c), {
            radius: 18,
            color: "#0f9c82",
            weight: 1.5,
            fill: false,
            interactive: false,
          }).addTo(layers.current.edit);
        else
          L.rectangle(bb(b), {
            color: "#169d85",
            weight: 1.6,
            dashArray: "5 3",
            fill: false,
            interactive: false,
          }).addTo(layers.current.edit);
      }
      if (p.tool !== "edit-points") {
        const drag = L.marker(ll(c), {
          draggable: true,
          keyboard: true,
          title: "Drag to move selected objects",
          icon: L.divIcon({
            className: "move-handle",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            html: "<span>✥</span>",
          }),
          zIndexOffset: 1000,
        }).addTo(layers.current.edit);
        drag.on("dragstart", () => {
          map.dragging.disable();
        });
        drag.on("drag", (e: any) => {
          const now = e.target.getLatLng(),
            pr = G.projection(c),
            [x, y] = pr.xy([now.lng, now.lat]);
          layers.current.draft.clearLayers();
          for (const f of translate(chosen, x, y, c))
            draw(f, layers.current.draft, false, true);
        });
        drag.on("dragend", (e: any) => {
          map.dragging.enable();
          const now = e.target.getLatLng(),
            pr = G.projection(c),
            [x, y] = pr.xy([now.lng, now.lat]);
          p.onMove(x, y);
          layers.current.draft.clearLayers();
        });
      } else if (chosen.length === 1) {
        const f = chosen[0],
          g = f.geometry,
          rings =
            g.type === "Polygon" || g.type === "MultiLineString"
              ? g.coordinates
              : g.type === "LineString"
                ? [g.coordinates]
                : g.type === "Point"
                  ? [[g.coordinates]]
                  : [];
        rings.forEach((r: any[], ri: number) =>
          r
            .slice(0, g.type === "Polygon" ? -1 : undefined)
            .forEach((v: Coord, vi: number) => {
              const handle = L.marker(ll(v), {
                draggable: true,
                icon: L.divIcon({
                  className: "vertex-handle",
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                }),
                keyboard: true,
                title: `Move point ${vi + 1}`,
              }).addTo(layers.current.edit);
              handle.on("dragend", (e: any) => {
                const c = e.target.getLatLng();
                p.onVertex(f.id, ri, vi, [c.lng, c.lat]);
              });
            }),
        );
      }
    }
    if (p.points.length) {
      const ps = p.points.map(ll);
      L.polyline(ps, {
        color: "#149c83",
        weight: 2,
        dashArray: "5 4",
        interactive: false,
      }).addTo(layers.current.draft);
      for (const pt of ps)
        L.circleMarker(pt, {
          radius: 4,
          color: "#fff",
          weight: 2,
          fillColor: "#159b82",
          fillOpacity: 1,
          interactive: false,
        }).addTo(layers.current.draft);
      if (
        p.points.length > 2 &&
        ["area", "stone", "exclusion"].includes(p.tool)
      )
        L.polygon(ps, {
          color: "#149c83",
          weight: 1,
          fillOpacity: 0.1,
          interactive: false,
        }).addTo(layers.current.draft);
    }
  };
  renderRef.current = render;
  useEffect(() => {
    render();
  }, [
    props.project,
    props.selected,
    props.visibility,
    props.labels,
    props.basemap,
    props.tool,
    props.points,
  ]);
  useEffect(() => {
    const p = props.project;
    const map = mapRef.current;
    if (!map) return;
    if (p.area) map.fitBounds(bb(p.area), { padding: [35, 35], maxZoom: 20 });
    else map.setView(ll(p.view?.center || p.origin), p.view?.zoom || 18);
  }, [props.project.id]);
  return (
    <div
      className={`map-canvas ${props.basemap === "cad" ? "cad-background" : ""}`}
      ref={el}
      role="application"
      aria-label="Interactive site plan. Choose a drawing tool, then tap the map. Use Add centre point for precise placement."
    />
  );
}
