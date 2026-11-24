import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudDownload,
  CloudUpload,
  Copy,
  Download,
  Expand,
  Eye,
  EyeOff,
  FileDown,
  FilePlus2,
  FolderOpen,
  Focus,
  Grid2X2,
  Group,
  Hand,
  HelpCircle,
  Layers,
  Link,
  Lock,
  MapPin,
  Maximize2,
  MessageCircle,
  Minus,
  MousePointer2,
  Navigation,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Redo2,
  RotateCcw,
  RotateCw,
  Route,
  Ruler,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  SquareDashed,
  StickyNote,
  Sun,
  Trash2,
  Type,
  Undo2,
  Ungroup,
  Unlock,
  Upload,
  Wifi,
  WifiOff,
  X,
  ZoomIn,
  ZoomOut,
  Box,
  TriangleAlert,
  Mic,
  Camera,
  Move,
  CheckCircle2,
  Package,
  Building2,
  HardHat,
  LayoutGrid,
  FileText,
  Send,
} from "lucide-react";
import type {
  Project,
  Feature,
  Coord,
  Bounds,
  Tool,
  Asset,
  DataStatus,
} from "./types";
import { PlanPreview } from "./components/PlanPreview";
import { MapCanvas, type MapAPI } from "./components/MapCanvas";
import { IconButton, Field, Status, Modal, Busy } from "./components/UI";
import { ConfirmBoundaryModal } from "./components/ConfirmBoundaryModal";
import G from "./core/geometry.mjs";
import {
  newProject,
  migrateProject,
  feature,
  expandSelection,
  groupFeatures,
  ungroupFeatures,
  duplicateFeatures,
  translate,
  rotate,
  scaleFeatures,
  centerOf,
  boundsOfFeatures,
  polygonArea,
  quantities,
  PRODUCTS,
  trakwayRun,
  trakwayPad,
  replaceSnapshot,
  uid,
} from "./core/model.mjs";
import {
  ASSETS,
  categoryNames,
  assetSVG,
  createAsset,
} from "./core/assets.mjs";
import {
  saveProject,
  readProject,
  listProjects,
  deleteProject,
  getSetting,
  setSetting,
} from "./core/storage";
import { request, apiBase } from "./core/network.mjs";
import { demoProject } from "./core/demo.mjs";
import {
  localCommand,
  commandExamples,
  describeAction,
  applyActions,
} from "./core/commands.mjs";
const TOOL_LABELS: Record<string, string> = {
  select: "Select",
  pan: "Move map",
  boundary: "Site boundary",
  area: "Compound area",
  stone: "Stone area",
  line: "Site route",
  "stone-road": "Stone road",
  fence: "Fence",
  exclusion: "Exclusion zone",
  measure: "Dimension",
  text: "Text",
  note: "Note",
  access: "Access point",
  trakway: "Trakway run",
  asset: "Place asset",
  box: "Box select",
  "edit-points": "Edit points",
};
const DRAW_TOOLS: any[] = [
  ["boundary", "Working area", SquareDashed, "Draw a rectangle to set the site boundary"],
  ["stone", "Stone area", Grid2X2, "Tap around an area"],
  ["stone-road", "Stone road", Route, "Draw a road with a width"],
  ["area", "Compound", Box, "Draw any enclosed area"],
  ["line", "Site route", Route, "Connect points on the plan"],
  ["fence", "Fence line", Pencil, "Perimeter or temporary fencing"],
  ["exclusion", "Exclusion zone", ShieldCheck, "Mark a restricted area"],
  ["measure", "Dimension", Ruler, "Measure between points"],
  ["access", "Access point", MapPin, "Delivery entrance and what3words"],
  ["text", "Text label", Type, "Annotate your plan"],
  ["note", "Site note", StickyNote, "Add notes and photos"],
];
const VEHICLES = [
  { name: "3.5 t van", height: 3, width: 2.1, length: 6, weight: 3.5 },
  { name: "7.5 t rigid", height: 3.7, width: 2.5, length: 8, weight: 7.5 },
  { name: "24 t rigid", height: 4, width: 2.55, length: 10, weight: 24 },
  { name: "44 t artic", height: 4.5, width: 2.55, length: 16.5, weight: 44 },
];
export function App() {
  const [projects, setProjects] = useState<Project[]>([]),
    [project, setProject] = useState<Project | null>(null),
    [loading, setLoading] = useState(true),
    [selected, setSelected] = useState<string[]>([]),
    [tool, setTool] = useState<Tool>("select"),
    [points, setPoints] = useState<Coord[]>([]),
    [tab, setTab] = useState("build"),
    [buildTab, setBuildTab] = useState("assets"),
    [sidebar, setSidebar] = useState(true),
    [librarySearch, setLibrarySearch] = useState(""),
    [category, setCategory] = useState("All"),
    [asset, setAsset] = useState<Asset | null>(null),
    [theme, setTheme] = useState(
      () => localStorage.getItem("sami.elite.theme") || "studio",
    ),
    [labels, setLabels] = useState(true),
    [snap, setSnap] = useState(true),
    [multi, setMulti] = useState(false),
    [visibility, setVisibility] = useState<Record<string, boolean>>({}),
    [modal, setModal] = useState(() =>
      window.location.pathname === "/privacy" ? "privacy" : "",
    ),
    [toast, setToast] = useState(""),
    [saveState, setSaveState] = useState("saved"),
    [online, setOnline] = useState(navigator.onLine),
    [dataStatuses, setDataStatuses] = useState<Record<string, DataStatus>>({}),
    [health, setHealth] = useState<any>(null),
    [query, setQuery] = useState(""),
    [searching, setSearching] = useState(false),
    [searchResults, setSearchResults] = useState<any[]>([]),
    [sourceInfo, setSourceInfo] = useState<Feature | null>(null),
    [cloudInfo, setCloudInfo] = useState<any>(null),
    [cloudBusy, setCloudBusy] = useState(false),
    [cloudConflict, setCloudConflict] = useState(false),
    [exportBusy, setExportBusy] = useState(""),
    [exportStyle, setExportStyle] = useState("presentation"),
    [exportRoute, setExportRoute] = useState(true),
    [textInput, setTextInput] = useState(""),
    [pendingPoint, setPendingPoint] = useState<Coord | null>(null),
    [roadWidth, setRoadWidth] = useState(4),
    [product, setProduct] = useState("lion"),
    [lanes, setLanes] = useState(2),
    [padW, setPadW] = useState(15),
    [padL, setPadL] = useState(15),
    [padPreview, setPadPreview] = useState<any>(null),
    [vehicle, setVehicle] = useState(VEHICLES[3]),
    [fromQuery, setFromQuery] = useState(""),
    [fromPoint, setFromPoint] = useState<Coord | null>(null),
    [fromName, setFromName] = useState(""),
    [routeAccess, setRouteAccess] = useState(""),
    [routeBusy, setRouteBusy] = useState(false),
    [askText, setAskText] = useState(""),
    [askBusy, setAskBusy] = useState(false),
    [conversation, setConversation] = useState<any[]>([]),
    [proposal, setProposal] = useState<any>(null),
    [metadata, setMetadata] = useState<any>(null),
    [newName, setNewName] = useState(""),
    [viewport, setViewport] = useState<any>(null),
    [nudge, setNudge] = useState(1),
    [focus, setFocus] = useState(false),
    [imagePending, setImagePending] = useState<string | null>(null),
    [speechListening, setSpeechListening] = useState(false),
    [showConfirmBoundaryModal, setShowConfirmBoundaryModal] = useState(false),
    [boundaryMetricsForConfirm, setBoundaryMetricsForConfirm] = useState<{ hectares: number; perimeter: number } | null>(null),
    [pendingBoundary, setPendingBoundary] = useState<Bounds | null>(null);
  const mapApi = useRef<MapAPI | null>(null),
    projectRef = useRef<Project | null>(null),
    history = useRef<{ past: Project[]; future: Project[] }>({
      past: [],
      future: [],
    }),
    fileInput = useRef<HTMLInputElement>(null),
    logoInput = useRef<HTMLInputElement>(null),
    photoInput = useRef<HTMLInputElement>(null),
    saveQueue = useRef(Promise.resolve()),
    requests = useRef<Record<string, AbortController>>({}),
    toastTimer = useRef<any>(null),
    speechRef = useRef<any>(null),
    epoch = useRef(0);
  projectRef.current = project;
  const notify = useCallback((s: string) => {
    setToast(s);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 6500);
  }, []);
  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() =>
        notify(
          "Project storage could not be opened. Export backups before closing the app.",
        ),
      )
      .finally(() => setLoading(false));
    request("health", undefined, { timeout: 6000 })
      .then(setHealth)
      .catch(() => setHealth({ unavailable: true }));
    const on = () => setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
      clearTimeout(toastTimer.current);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("sami.elite.theme", theme);
  }, [theme]);
  const persist = async (p: Project) => {
    setSaveState("saving");
    const task = saveQueue.current.catch(() => {}).then(() => saveProject(p));
    saveQueue.current = task;
    try {
      await task;
      if (
        projectRef.current?.revision === p.revision &&
        projectRef.current?.id === p.id
      )
        setSaveState("saved");
    } catch {
      setSaveState("error");
      notify("Save failed. Keep this window open and export a project backup.");
      throw Error(
        "Project could not be saved. Export a backup before switching.",
      );
    }
  };
  useEffect(() => {
    if (!project) return;
    setSaveState("saving");
    const timer = setTimeout(() => persist(project).catch(() => {}), 180);
    return () => clearTimeout(timer);
  }, [project]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (saveState !== "saved") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [saveState]);
  const commit = (
    change: Project | ((p: Project) => Project),
    options: { history?: boolean } = {},
  ) => {
    const prev = projectRef.current;
    if (!prev) return;
    try {
      const next = typeof change === "function" ? change(prev) : change;
      if (options.history !== false) {
        history.current.past.push(prev);
        if (history.current.past.length > 60) history.current.past.shift();
        history.current.future = [];
      }
      const out = {
        ...next,
        updatedAt: new Date().toISOString(),
        revision: prev.revision + 1,
      };
      projectRef.current = out;
      setProject(out);
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const undo = () => {
    const p = history.current.past.pop();
    if (p) {
      history.current.future.push(projectRef.current!);
      const next = {
        ...p,
        revision: projectRef.current!.revision + 1,
        updatedAt: new Date().toISOString(),
      };
      projectRef.current = next;
      setProject(next);
      setSelected([]);
    }
  };
  const redo = () => {
    const p = history.current.future.pop();
    if (p) {
      history.current.past.push(projectRef.current!);
      const next = {
        ...p,
        revision: projectRef.current!.revision + 1,
        updatedAt: new Date().toISOString(),
      };
      projectRef.current = next;
      setProject(next);
      setSelected([]);
    }
  };
  const openProject = async (p: Project) => {
    try {
      if (projectRef.current) await persist(projectRef.current);
      for (const r of Object.values(requests.current)) r.abort();
      epoch.current++;
      requests.current = {};
      history.current = { past: [], future: [] };
      projectRef.current = p;
      setProject(p);
      setSelected([]);
      setPoints([]);
      setTool("select");
      setDataStatuses(
        Object.fromEntries(
          Object.entries(p.snapshots || {}).map(([k, s]) => [k, s.status]),
        ),
      );
      setCloudInfo((await getSetting("cloud:" + p.id)) || null);
      setCloudConflict(false);
      setModal("");
      setConversation([]);
      setProposal(null);
      setSearchResults([]);
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const goHome = async () => {
    try {
      if (projectRef.current) await persist(projectRef.current);
      for (const r of Object.values(requests.current)) r.abort();
      epoch.current++;
      setProject(null);
      projectRef.current = null;
      setProjects(await listProjects());
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const startTool = (next: Tool) => {
    setTool(next);
    setPoints([]);
    setSourceInfo(null);
    if (!["select", "pan", "edit-points"].includes(next)) setSelected([]);
    if (window.innerWidth < 780) setSidebar(false);
  };
  const addFeatures = (fs: Feature[]) => {
    commit((p) => ({ ...p, features: [...p.features, ...fs] }));
    setSelected(fs.map((f) => f.id));
  };
  const selectedFeatures =
      project?.features.filter((f) => selected.includes(f.id)) || [],
    first = selectedFeatures[0],
    q = project ? quantities(project) : null;
  const updateSelected = (props: any) =>
    commit((p) => ({
      ...p,
      features: p.features.map((f) =>
        selected.includes(f.id)
          ? { ...f, properties: { ...f.properties, ...props } }
          : f,
      ),
    }));
  const moveSelection = (x: number, y: number) =>
    commit((p) => {
      const moved = new Map<string, Feature>(
        translate(
          p.features.filter((f) => selected.includes(f.id)),
          x,
          y,
        ).map((f) => [f.id, f]),
      );
      return { ...p, features: p.features.map((f) => moved.get(f.id) || f) };
    });
  const rotateSelection = (degrees: number) =>
    commit((p) => {
      const moved = new Map<string, Feature>(
        rotate(
          p.features.filter((f) => selected.includes(f.id)),
          degrees,
        ).map((f) => [f.id, f]),
      );
      return { ...p, features: p.features.map((f) => moved.get(f.id) || f) };
    });
  const deleteSelection = () => {
    commit((p) => ({
      ...p,
      features: p.features.filter((f) => !selected.includes(f.id)),
    }));
    setSelected([]);
  };
  const group = () =>
    commit((p) => ({ ...p, features: groupFeatures(p.features, selected) }));
  const ungroup = () =>
    commit((p) => ({ ...p, features: ungroupFeatures(p.features, selected) }));
  const confirmBoundary = (bounds: Bounds) => {
    if (!project) return;
    try {
      // Calculate area metrics for confirmation modal
      const width = bounds[2] - bounds[0];
      const height = bounds[3] - bounds[1];
      const areaSquareMetres = width * height;
      const areaHectares = areaSquareMetres / 10000;
      const perimeter = 2 * (width + height);
      const centroidLat = (bounds[1] + bounds[3]) / 2;
      const centroidLng = (bounds[0] + bounds[2]) / 2;

      setPendingBoundary(bounds);
      setBoundaryMetricsForConfirm({
        hectares: parseFloat(areaHectares.toFixed(2)),
        perimeter: parseFloat(perimeter.toFixed(2)),
      });
      setShowConfirmBoundaryModal(true);
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const finalizeBoundary = (bounds: Bounds) => {
    if (!project) return;
    try {
      // Calculate area metrics
      const width = bounds[2] - bounds[0];
      const height = bounds[3] - bounds[1];
      const areaSquareMetres = width * height;
      const areaHectares = areaSquareMetres / 10000;
      const perimeter = 2 * (width + height);
      const centroidLat = (bounds[1] + bounds[3]) / 2;
      const centroidLng = (bounds[0] + bounds[2]) / 2;

      // Abort any pending requests and increment epoch
      for (const r of Object.values(requests.current)) r.abort();
      epoch.current++;

      // Commit the boundary with metrics and locked state
      commit((p) => ({
        ...p,
        area: bounds,
        areaConfirmed: true,
        areaLocked: true,
        areaMetrics: {
          hectares: parseFloat(areaHectares.toFixed(2)),
          perimeter: parseFloat(perimeter.toFixed(2)),
          centroidLat,
          centroidLng,
        },
        origin: [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2],
        planBase: [],
        snapshots: {},
      }));

      setDataStatuses({});
      setShowConfirmBoundaryModal(false);
      setBoundaryMetricsForConfirm(null);
      setTimeout(() => loadData("cad"), 0);
      notify(
        "Site boundary confirmed. CAD is ready; load map detail when you need it.",
      );
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const redefineBoundary = () => {
    if (!project) return;
    try {
      // Clear the boundary and metrics
      commit((p) => ({
        ...p,
        area: null,
        areaConfirmed: false,
        areaLocked: false,
        areaMetrics: null,
        origin: p.origin,
        planBase: [],
        snapshots: {},
      }));

      setDataStatuses({});
      setShowConfirmBoundaryModal(false);
      setBoundaryMetricsForConfirm(null);
      setPoints([]);
      setTool("boundary");
      notify("Boundary cleared. Draw a new boundary to continue.");
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const cancelBoundaryConfirmation = () => {
    setShowConfirmBoundaryModal(false);
    setBoundaryMetricsForConfirm(null);
    setPoints([]);
    setTool("select");
  };
  const finishDrawing = (pts = points) => {
    if (!project) return;
    try {
      if (tool === "boundary" || tool === "box") {
        if (pts.length < 2) throw Error("Choose two opposite corners.");
        const b = [
          Math.min(pts[0][0], pts.at(-1)![0]),
          Math.min(pts[0][1], pts.at(-1)![1]),
          Math.max(pts[0][0], pts.at(-1)![0]),
          Math.max(pts[0][1], pts.at(-1)![1]),
        ] as Bounds;
        if (!G.validBounds(b) || G.area(b) < 1)
          throw Error("Make the area at least one square metre.");
        if (tool === "box")
          setSelected(
            project.features
              .filter((f) => {
                const c = centerOf([f]);
                return (
                  G.inside(c, b) && !f.properties.locked && !f.properties.hidden
                );
              })
              .map((f) => f.id),
          );
        else {
          confirmBoundary(b);
        }
      } else if (tool === "trakway") {
        const result = trakwayRun(pts, { ...PRODUCTS[product], lanes });
        addFeatures(result.features);
        notify(
          result.warnings.length
            ? result.warnings.join(" ")
            : `${result.features.length} panels created as one editable group.`,
        );
      } else if (["area", "stone", "exclusion"].includes(tool)) {
        if (pts.length < 3) throw Error("Choose at least three corners.");
        const g = { type: "Polygon", coordinates: [[...pts, pts[0]]] },
          f = feature(tool, g, {
            label: TOOL_LABELS[tool],
            fill:
              tool === "stone"
                ? "#d3c1a0"
                : tool === "exclusion"
                  ? "#e0aca0"
                  : "#9cc7b4",
            color:
              tool === "stone"
                ? "#a39071"
                : tool === "exclusion"
                  ? "#b87162"
                  : "#3f8d79",
          });
        addFeatures([f]);
      } else {
        if (pts.length < 2) throw Error("Choose at least two points.");
        const g =
          tool === "stone-road"
            ? G.lineBuffer(pts, roadWidth)
            : { type: "LineString", coordinates: pts };
        addFeatures([
          feature(tool, g, {
            label: TOOL_LABELS[tool],
            color:
              tool === "stone-road"
                ? "#a39071"
                : tool === "fence"
                  ? "#71858d"
                  : "#368d91",
            fill: tool === "stone-road" ? "#d3c1a0" : "#acd3cb",
            width: roadWidth,
            dash: tool === "fence" ? "6 4" : "",
          }),
        ]);
      }
      setPoints([]);
      setTool("select");
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const onPoint = (p: Coord) => {
    if (tool === "asset") {
      if (asset) addFeatures([createAsset(asset, p)]);
      else if (imagePending) {
        addFeatures([
          feature("image", G.rectangle(p, 50, 35), {
            label: "Reference image",
            image: imagePending,
            opacity: 0.75,
            layer: "imports",
          }),
        ]);
        setImagePending(null);
      }
      setTool("select");
      return;
    }
    if (tool === "text" || tool === "note" || tool === "access") {
      setPendingPoint(p);
      setTextInput(tool === "access" ? "Main access" : "");
      setModal("add-point");
      return;
    }
    const next =
      points.at(-1) && G.distance(points.at(-1), p) < 0.01
        ? points
        : [...points, p];
    setPoints(next);
    if (["boundary", "box", "measure"].includes(tool) && next.length === 2)
      finishDrawing(next);
  };
  const search = async () => {
    if (!project) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const d = await request(
        "search",
        { query, focus: project.origin },
        { timeout: 10000 },
      );
      setSearchResults(d.results);
      if (!d.results.length)
        notify(
          "No matching place found. Try a UK postcode or latitude, longitude.",
        );
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setSearching(false);
    }
  };
  const loadData = async (kind: string) => {
    const p = projectRef.current;
    if (!p?.area) {
      notify("Define a site boundary first.");
      startTool("boundary");
      return;
    }
    if (p.example) {
      notify(
        "Example geometry is illustrative. Create or locate a real project to load mapped data.",
      );
      return;
    }
    const id = p.id,
      e = epoch.current,
      ctl = new AbortController();
    requests.current[kind]?.abort();
    requests.current[kind] = ctl;
    const bounds = G.expandBoundsMeters(p.area, kind === "cad" ? 10 : 402.336);
    setDataStatuses((s) => ({
      ...s,
      [kind]: { state: "loading", message: "Checking source…" },
    }));
    try {
      const d = await request(
        kind,
        { bounds },
        { timeout: 10500, signal: ctl.signal },
      );
      if (
        projectRef.current?.id !== id ||
        epoch.current !== e ||
        ctl.signal.aborted
      )
        return;
      const status = {
        state: d.state,
        message: d.message,
        count: d.features.length,
        updatedAt: d.updatedAt,
        source: d.source,
        cached: d.cached,
      };
      if (kind === "cad")
        commit(
          (current) => ({
            ...current,
            planBase: d.features.length ? d.features : current.planBase,
            planBaseMeta: { ...status, bounds },
          }),
          { history: false },
        );
      else
        commit(
          (current) =>
            replaceSnapshot(current, kind, d.features, status, bounds),
          { history: false },
        );
      setDataStatuses((s) => ({ ...s, [kind]: status }));
    } catch (error) {
      if (
        projectRef.current?.id !== id ||
        epoch.current !== e ||
        ctl.signal.aborted
      )
        return;
      const status = {
        state: "error" as const,
        message: (error as Error).message,
      };
      setDataStatuses((s) => ({ ...s, [kind]: status }));
      if (kind !== "cad")
        commit(
          (current) => replaceSnapshot(current, kind, [], status, bounds),
          { history: false },
        );
    } finally {
      if (requests.current[kind] === ctl) delete requests.current[kind];
    }
  };
  const doImport = async (file: File) => {
    try {
      const { importFile } = await import("./core/imports.mjs"),
        result = await importFile(file, projectRef.current?.origin);
      if (result.project) {
        const p = result.project as Project;
        if ((await listProjects()).some((x) => x.id === p.id)) p.id = uid();
        await openProject(p);
        notify("Project imported. Your earlier local copy is retained.");
      } else if (result.features) {
        if (!projectRef.current) {
          const p = newProject(file.name);
          p.features = result.features;
          p.area = boundsOfFeatures(result.features);
          if (p.area) p.origin = centerOf(result.features);
          await openProject(p);
        } else {
          addFeatures(result.features);
          setTimeout(() => mapApi.current?.fit(), 100);
        }
        notify(result.notice || `${result.features.length} objects imported.`);
      } else if (result.image) {
        if (!projectRef.current) await openProject(newProject(file.name));
        setImagePending(result.image as string);
        setAsset(null);
        startTool("asset");
        notify(result.notice);
      }
    } catch (e) {
      notify((e as Error).message);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };
  const download = async (blob: Blob, name: string) => {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([
        import("@capacitor/filesystem"),
        import("@capacitor/share"),
      ]);
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1]);
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      const file = await Filesystem.writeFile({
        path: name,
        data: base64,
        directory: Directory.Cache,
      });
      await Share.share({ title: name, files: [file.uri] });
    } else {
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
  };
  const exportFile = async (type: string) => {
    const p = projectRef.current;
    if (!p) return;
    setExportBusy(type);
    try {
      const name = p.name.replace(/[^a-z0-9_-]+/gi, "-").slice(0, 70);
      let blob: Blob, filename: string;
      if (type === "sami") {
        blob = new Blob([JSON.stringify(p)], { type: "application/json" });
        filename = name + ".sami";
      } else {
        const D = await import("./core/documents.mjs");
        if (type === "pdf") {
          blob = await D.pdfDocument(p, {
            technical: exportStyle === "technical",
            includeRoute: exportRoute,
            labels,
            visibility,
          });
          filename = name + "-plan.pdf";
        } else if (type === "svg") {
          blob = new Blob(
            [
              D.projectSVG(p, {
                technical: exportStyle === "technical",
                labels,
                visibility,
              }),
            ],
            { type: "image/svg+xml" },
          );
          filename = name + ".svg";
        } else if (type === "dxf") {
          blob = new Blob([D.dxfDocument(p)], { type: "application/dxf" });
          filename = name + ".dxf";
        } else if (type === "kml") {
          blob = new Blob([D.kmlDocument(p)], {
            type: "application/vnd.google-earth.kml+xml",
          });
          filename = name + ".kml";
        } else if (type === "csv") {
          blob = new Blob([D.csvDocument(p)], { type: "text/csv" });
          filename = name + "-schedule.csv";
        } else {
          blob = new Blob(
            [
              JSON.stringify({
                type: "FeatureCollection",
                name: p.name,
                features: [
                  ...p.planBase,
                  ...p.features,
                  ...Object.values(p.snapshots).flatMap((s) => s.features),
                ],
                sami: { origin: p.origin, meta: p.meta },
              }),
            ],
            { type: "application/geo+json" },
          );
          filename = name + ".geojson";
        }
      }
      await download(blob, filename);
      notify(filename + " created.");
    } catch (e) {
      notify("Export failed: " + (e as Error).message);
    } finally {
      setExportBusy("");
    }
  };
  const checkHealth = async () => {
    setHealth(null);
    try {
      setHealth(await request("health", undefined, { timeout: 6000 }));
    } catch {
      setHealth({ unavailable: true });
    }
  };
  const cloudAction = async (operation: string) => {
    const p = projectRef.current;
    if (!p) return;
    setCloudBusy(true);
    try {
      if (operation === "create" || operation === "save") {
        await persist(p);
        const d = await request(
          "cloud",
          { operation, project: p, etag: cloudInfo?.etag },
          {
            timeout: 25000,
            headers: cloudInfo
              ? { Authorization: "Bearer " + cloudInfo.key }
              : {},
          },
        );
        const info = {
          ...cloudInfo,
          key: d.key || cloudInfo.key,
          etag: d.etag,
          version: d.version,
          savedAt: new Date().toISOString(),
        };
        await setSetting("cloud:" + p.id, info);
        setCloudInfo(info);
        setCloudConflict(false);
        notify("Private cloud copy saved.");
      } else if (operation === "read") {
        const d = await request(
          "cloud",
          { operation: "read" },
          {
            timeout: 12000,
            headers: { Authorization: "Bearer " + cloudInfo.key },
          },
        );
        commit(migrateProject(d.project));
        const info = { ...cloudInfo, etag: d.etag, version: d.version };
        setCloudInfo(info);
        await setSetting("cloud:" + p.id, info);
        setCloudConflict(false);
        notify(
          "Latest cloud copy loaded. Undo returns to your previous local copy.",
        );
      } else if (operation === "delete") {
        await request(
          "cloud",
          { operation: "delete", etag: cloudInfo.etag },
          { headers: { Authorization: "Bearer " + cloudInfo.key } },
        );
        await setSetting("cloud:" + p.id, null);
        setCloudInfo(null);
        notify("Cloud link revoked. This device still has its local project.");
      }
    } catch (e) {
      if ((e as any).status === 409) setCloudConflict(true);
      notify((e as Error).message);
    } finally {
      setCloudBusy(false);
    }
  };
  const importCloud = async (key: string) => {
    setCloudBusy(true);
    try {
      const d = await request(
        "cloud",
        { operation: "read" },
        { headers: { Authorization: "Bearer " + key }, timeout: 12000 },
      );
      const p = migrateProject(d.project),
        info = { key, etag: d.etag, version: d.version };
      const previous =
        projectRef.current?.id === p.id
          ? projectRef.current
          : await readProject(p.id);
      if (previous)
        await saveProject({
          ...previous,
          id: uid(),
          name: previous.name + " · before cloud load",
          updatedAt: new Date().toISOString(),
        });
      await setSetting("cloud:" + p.id, info);
      await openProject(p);
      setCloudInfo(info);
      window.history.replaceState(null, "", window.location.pathname);
      notify(
        previous
          ? "Cloud project opened. Your previous local work is kept as a separate project."
          : "Private cloud project opened.",
      );
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setCloudBusy(false);
    }
  };
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1)),
      key = hash.get("project");
    if (key && /^[a-f0-9]{64}$/.test(key)) importCloud(key);
  }, []);
  const shareCloud = async () => {
    if (!cloudInfo) return;
    const base =
        window.location.protocol === "capacitor:"
          ? "https://sami.site"
          : window.location.origin,
      url = base + "/#project=" + cloudInfo.key;
    try {
      if (navigator.share) await navigator.share({ title: project?.name, url });
      else {
        await navigator.clipboard.writeText(url);
        notify(
          "Private edit link copied. Anyone with it can open and edit this project.",
        );
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        notify(
          "Could not share this link. Use Export project to transfer the file.",
        );
    }
  };
  const calcRoute = async () => {
    if (!project) return;
    const access =
      project.features.find((f) => f.id === routeAccess) ||
      project.features.find((f) => f.properties.type === "access");
    if (!access) {
      notify("Place an access point on your plan first.");
      startTool("access");
      return;
    }
    setRouteBusy(true);
    const id = project.id;
    try {
      let from = fromPoint;
      if (!from) {
        const d = await request("search", {
          query: fromQuery,
          focus: project.origin,
        });
        if (!d.results.length) throw Error("Departure could not be found.");
        if (d.results.length > 1)
          throw Error(
            "Use a specific departure postcode, coordinates or three-word address.",
          );
        from = d.results[0].coordinates;
        setFromPoint(from);
        setFromName(d.results[0].name);
      }
      const d = await request(
        "route",
        { from, to: access.geometry.coordinates, vehicle },
        { timeout: 11000 },
      );
      if (projectRef.current?.id !== id) return;
      commit((p) => ({
        ...p,
        route: { ...d, accessId: access.id, fromName: fromName || fromQuery },
      }));
      notify(
        "Truck route saved. Review the route and access restrictions before travel.",
      );
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setRouteBusy(false);
    }
  };
  const ask = async (text = askText) => {
    if (!project || !text.trim()) return;
    setAskText("");
    setConversation((m) => [...m, { role: "user", text }]);
    setAskBusy(true);
    setProposal(null);
    const id = project.id;
    try {
      const local = localCommand(text);
      const result =
        local ||
        (await request(
          "assistant",
          {
            message: text,
            context: {
              projectName: project.name,
              siteArea: q.siteArea,
              selected: selectedFeatures.map((f) => ({
                id: f.id,
                type: f.properties.type,
                label: f.properties.label,
              })),
              quantities: q,
            },
          },
          { timeout: 22000 },
        ));
      if (projectRef.current?.id !== id) return;
      setConversation((m) => [
        ...m,
        { role: "assistant", text: result.reply, mode: result.mode },
      ]);
      if (result.actions?.some((a) => a.type !== "none"))
        setProposal({ ...result, selection: [...selected] });
    } catch (e) {
      setConversation((m) => [
        ...m,
        {
          role: "assistant",
          text:
            (e as Error).message +
            " Try one of the supported drawing commands below.",
          mode: "status",
        },
      ]);
    } finally {
      setAskBusy(false);
    }
  };
  const applyProposal = () => {
    if (!proposal || !project) return;
    try {
      const result = applyActions(
        project,
        proposal.actions,
        proposal.selection || selected,
        mapApi.current?.center() || project.origin,
      );
      commit(result.project);
      setSelected(result.selected);
      setConversation((m) => [
        ...m,
        {
          role: "assistant",
          text: "Applied to the plan. Undo is available.",
          mode: "status",
        },
      ]);
      setProposal(null);
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const locate = async () => {
    try {
      const { Capacitor } = await import("@capacitor/core");
      let c: Coord;
      if (Capacitor.isNativePlatform()) {
        const { Geolocation } = await import("@capacitor/geolocation");
        const d = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        c = [d.coords.longitude, d.coords.latitude];
        notify(`Location accuracy ±${Math.round(d.coords.accuracy)} m.`);
      } else {
        const d = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          }),
        );
        c = [d.coords.longitude, d.coords.latitude];
        notify(`Location accuracy ±${Math.round(d.coords.accuracy)} m.`);
      }
      mapApi.current?.fly(c, 18);
    } catch {
      notify(
        "Location is unavailable or permission was declined. Search for the site instead.",
      );
    }
  };
  const speech = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      notify("Use the microphone on your keyboard to dictate an instruction.");
      return;
    }
    if (speechListening) {
      speechRef.current?.stop();
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      setAskText(e.results[0][0].transcript);
      setSpeechListening(false);
    };
    recognition.onerror = () => {
      setSpeechListening(false);
      notify("Voice input unavailable. Try keyboard dictation.");
    };
    recognition.onend = () => setSpeechListening(false);
    speechRef.current = recognition;
    recognition.start();
    setSpeechListening(true);
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        !projectRef.current ||
        modal ||
        /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName) ||
        (e.target as HTMLElement)?.isContentEditable
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        e.shiftKey ? ungroup() : group();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        exportFile("sami");
      } else if (e.key === "Escape") {
        setPoints([]);
        setTool("select");
        setSelected([]);
        setSearchResults([]);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelection();
      } else if (e.key === "Enter" && points.length >= 2) {
        e.preventDefault();
        finishDrawing();
      } else if (
        selected.length &&
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
      ) {
        e.preventDefault();
        const m = e.shiftKey ? nudge * 10 : nudge;
        moveSelection(
          e.key === "ArrowRight" ? m : e.key === "ArrowLeft" ? -m : 0,
          e.key === "ArrowUp" ? m : e.key === "ArrowDown" ? -m : 0,
        );
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [selected, points, tool, modal, nudge]);
  const safe = async (fn: () => any) => {
    try {
      await fn();
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const setView = (basemap: string) => {
    commit((p) => ({ ...p, view: { ...p.view, basemap } }), { history: false });
    const p = projectRef.current;
    if (
      basemap === "cad" &&
      p?.area &&
      !p.planBase.length &&
      !p.example &&
      dataStatuses.cad?.state !== "loading"
    )
      loadData("cad");
  };
  const selectedBounds = selectedFeatures.length
    ? boundsOfFeatures(selectedFeatures)
    : null;
  const size = selectedBounds
    ? G.projection(centerOf(selectedFeatures))
        .xy([selectedBounds[2], selectedBounds[3]])
        .map((x: number) => Math.abs(x) * 2)
    : [0, 0];
  const duplicate = () => {
    const fs = duplicateFeatures(selectedFeatures);
    addFeatures(fs);
  };
  const selectObject = (id: string, add: boolean, individual = false) =>
    setSelected((current) => {
      const ids = expandSelection(
        projectRef.current?.features || [],
        [id],
        individual,
      );
      if (add) {
        const remove = ids.every((x: string) => current.includes(x));
        return remove
          ? current.filter((x) => !ids.includes(x))
          : [...new Set([...current, ...ids])];
      }
      return ids;
    });
  const setBoundaryView = () => {
    const b = mapApi.current?.bounds();
    if (!b) return;
    const pr = G.projection([(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]),
      w = G.distance([b[0], b[1]], [b[2], b[1]]) * 0.8,
      h = G.distance([b[0], b[1]], [b[0], b[3]]) * 0.8;
    const a = pr.ll([-w / 2, -h / 2]),
      c = pr.ll([w / 2, h / 2]);
    for (const r of Object.values(requests.current)) r.abort();
    epoch.current++;
    commit((p) => ({
      ...p,
      area: [...a, ...c] as Bounds,
      origin: pr.ll([0, 0]) as Coord,
      planBase: [],
      snapshots: {},
    }));
    setDataStatuses({});
    setTimeout(() => loadData("cad"), 0);
    notify("Drawing boundary set to the visible site.");
  };
  const saveLogo = async (file: File) => {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 3_000_000) {
      notify("Use a PNG, JPEG or WebP logo under 3 MB.");
      return;
    }
    const url = URL.createObjectURL(file),
      img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas"),
        scale = Math.min(1, 1000 / img.width, 600 / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas
        .getContext("2d")!
        .drawImage(img, 0, 0, canvas.width, canvas.height);
      setMetadata((m: any) => ({ ...m, logo: canvas.toDataURL("image/png") }));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => notify("The logo could not be read.");
    img.src = url;
  };
  const recordPhoto = async (file?: File) => {
    try {
      let data: string;
      if (file) {
        if (file.size > 8_000_000) throw Error("Choose a photo under 8 MB.");
        data = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = reject;
          r.readAsDataURL(file);
        });
      } else {
        const { Camera, CameraResultType, CameraSource } = await import(
          "@capacitor/camera"
        );
        const image = await Camera.getPhoto({
          quality: 65,
          width: 1400,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Prompt,
        });
        data = image.dataUrl!;
      }
      updateSelected({ photo: data });
      notify("Photo saved with the selected item.");
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const addPad = () => {
    if (!project) return;
    safe(() => {
      const result = trakwayPad(
        mapApi.current?.center() || project.origin,
        padW,
        padL,
        PRODUCTS[product],
      );
      setPadPreview(result);
    });
  };
  const inputFiles = (
    <input
      type="file"
      hidden
      ref={fileInput}
      accept=".sami,.json,.geojson,.kml,.kmz,.gpx,.dxf,.png,.jpg,.jpeg,.webp"
      onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])}
    />
  );
  const buildPanel = (
    <>
      <div className="panel-title">
        <div>
          <span className="eyebrow">YOUR TOOLKIT</span>
          <h2>Build your site</h2>
        </div>
        <IconButton
          icon={PanelLeftClose}
          label="Collapse toolkit"
          onClick={() => setSidebar(false)}
        />
      </div>
      <div className="segmented">
        <button
          className={buildTab === "assets" ? "active" : ""}
          onClick={() => setBuildTab("assets")}
        >
          Assets
        </button>
        <button
          className={buildTab === "draw" ? "active" : ""}
          onClick={() => setBuildTab("draw")}
        >
          Draw
        </button>
        <button
          className={buildTab === "trakway" ? "active" : ""}
          onClick={() => setBuildTab("trakway")}
        >
          Trakway
        </button>
      </div>
      {buildTab === "assets" ? (
        <>
          <label className="search-input">
            <Search size={15} />
            <input
              placeholder="Find an asset…"
              aria-label="Search asset library"
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
            />
          </label>
          <div className="category-strip">
            {["All", ...categoryNames].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={category === c ? "active" : ""}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="asset-grid">
            {ASSETS.filter(
              (a) =>
                (category === "All" || a.category === category) &&
                (a.name + " " + a.category)
                  .toLowerCase()
                  .includes(librarySearch.toLowerCase()),
            ).map((a) => (
              <button
                key={a.id}
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData("application/sami-asset", a.id)
                }
                className={`asset-card ${asset?.id === a.id && tool === "asset" ? "selected" : ""}`}
                onClick={() => {
                  setAsset(a);
                  startTool("asset");
                }}
              >
                <div
                  className="asset-art"
                  dangerouslySetInnerHTML={{
                    __html: assetSVG(a.kind, a.color),
                  }}
                />
                <strong>{a.name}</strong>
                <small>
                  {a.width} × {a.length} m
                </small>
              </button>
            ))}
          </div>
          <div className="panel-footnote">
            <MousePointer2 size={14} /> Choose an asset, then tap the plan. You
            can also drag it onto the site.
          </div>
        </>
      ) : buildTab === "draw" ? (
        <>
          <div className="tool-list">
            {DRAW_TOOLS.map(([id, label, Icon, desc]) => (
              <button
                key={id}
                className={tool === id ? "active" : ""}
                onClick={() => startTool(id)}
              >
                <span>
                  <Icon size={19} />
                </span>
                <div>
                  <strong>{label}</strong>
                  <small>{desc}</small>
                </div>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
          <Field label="Stone road width">
            <div className="unit-input">
              <input
                type="number"
                min=".5"
                max="100"
                step=".5"
                value={roadWidth}
                onChange={(e) => setRoadWidth(+e.target.value || 4)}
              />
              <span>m</span>
            </div>
          </Field>
          <button className="subtle-button full" onClick={setBoundaryView}>
            <Expand size={16} /> Use visible site as boundary
          </button>
        </>
      ) : (
        <div className="trakway-panel">
          <div className="tool-intro">
            <div className="panel-stack">
              <i />
              <i />
              <i />
            </div>
            <h3>Precision, panel by panel.</h3>
            <p>
              Create a run or a dimensioned pad. Every panel remains editable.
            </p>
          </div>
          <Field label="Panel system">
            <select
              value={product}
              onChange={(e) => {
                setProduct(e.target.value);
                if (e.target.value === "sabre" && lanes > 2) setLanes(2);
                setPadPreview(null);
              }}
            >
              {Object.entries(PRODUCTS).map(([k, v]: any) => (
                <option key={k} value={k}>
                  {v.name} · {v.width} × {v.length} m
                </option>
              ))}
            </select>
          </Field>
          <Field label="Run width">
            <select value={lanes} onChange={(e) => setLanes(+e.target.value)}>
              {(product === "sabre" ? [1, 2] : [1, 2, 3, 4]).map((n) => (
                <option key={n} value={n}>
                  {n} wide ·{" "}
                  {(
                    PRODUCTS[product].width * n -
                    (n - 1) * PRODUCTS[product].lateralOverlap
                  ).toFixed(1)}{" "}
                  m
                </option>
              ))}
            </select>
          </Field>
          <button className="primary full" onClick={() => startTool("trakway")}>
            <Route size={17} /> Draw a panel run
          </button>
          <div className="divider" />
          <h3>Make a pad</h3>
          <div className="two-fields">
            <Field label="Width (m)">
              <input
                type="number"
                min="1"
                max="500"
                value={padW}
                onChange={(e) => setPadW(+e.target.value)}
              />
            </Field>
            <Field label="Length (m)">
              <input
                type="number"
                min="1"
                max="500"
                value={padL}
                onChange={(e) => setPadL(+e.target.value)}
              />
            </Field>
          </div>
          <button className="secondary full" onClick={addPad}>
            <Grid2X2 size={16} /> Calculate whole-panel layout
          </button>
          {padPreview && (
            <div className="info-card">
              <strong>{padPreview.count} panels</strong>
              <p>
                {padPreview.actualWidth.toFixed(2)} ×{" "}
                {padPreview.actualLength.toFixed(2)} m actual coverage
              </p>
              <button
                className="primary full"
                onClick={() => {
                  addFeatures(padPreview.features);
                  setPadPreview(null);
                  startTool("select");
                }}
              >
                Place at view centre
              </button>
            </div>
          )}
          <p className="small-note">
            Dimensions follow the recovered SAMI profiles. Whole panels and
            established corner rules are preserved. Confirm the selected product
            and joint specification for the job.
          </p>
        </div>
      )}
    </>
  );
  const layerPanel = (
    <>
      <div className="panel-title">
        <div>
          <span className="eyebrow">SITE INTELLIGENCE</span>
          <h2>Layers & records</h2>
        </div>
        <IconButton
          icon={PanelLeftClose}
          label="Close layers"
          onClick={() => setSidebar(false)}
        />
      </div>
      <p className="panel-description">
        Load public records around your boundary, including a 402 m perimeter.
        Each source runs independently.
      </p>
      <div className="source-cards">
        {[
          ["cad", "CAD context", "Buildings, roads & landscape"],
          ["ohl", "Overhead lines", "Mapped lines, supports & voltage"],
          ["services", "Public utilities", "Mapped utility reference records"],
          [
            "constraints",
            "Planning constraints",
            "Heritage, ecology, flood & TPOs",
          ],
        ].map(([kind, name, desc]) => {
          const st = dataStatuses[kind];
          return (
            <article className="source-card" key={kind}>
              <header>
                <div className={"source-dot " + kind} />
                <strong>{name}</strong>
                <IconButton
                  icon={
                    visibility[kind === "cad" ? "context" : kind] === false
                      ? EyeOff
                      : Eye
                  }
                  label={`Toggle ${name}`}
                  active={
                    visibility[kind === "cad" ? "context" : kind] !== false
                  }
                  onClick={() =>
                    setVisibility((s) => ({
                      ...s,
                      [kind === "cad" ? "context" : kind]:
                        s[kind === "cad" ? "context" : kind] === false,
                    }))
                  }
                />
              </header>
              <p>{desc}</p>
              <div className="source-status" role="status">
                {st?.state === "loading" ? (
                  <Busy>Checking source · up to 11 s</Busy>
                ) : st ? (
                  <>
                    <Status state={st.state}>
                      {st.state === "ready"
                        ? `${st.count} records`
                        : st.state === "empty"
                          ? "No records returned"
                          : st.state === "error"
                            ? "Source unavailable"
                            : "Partial coverage"}
                    </Status>
                    <small>{st.message}</small>
                    {st.updatedAt && (
                      <small>
                        Snapshot{" "}
                        {new Date(st.updatedAt).toLocaleString("en-GB")}
                      </small>
                    )}
                  </>
                ) : (
                  <span className="muted">Not checked</span>
                )}
              </div>
              <button
                className="secondary full small"
                disabled={st?.state === "loading"}
                onClick={() => loadData(kind)}
              >
                <RotateCw size={14} />
                {st ? "Refresh source" : "Load records"}
              </button>
            </article>
          );
        })}
      </div>
      <div className="source-note">
        <ShieldCheck size={17} />
        <p>
          Public coverage is incomplete. No records returned does not mean no
          services are present. Import utility-owner records and surveys for
          your site.
        </p>
      </div>
      <h3 className="section-label">Your drawing</h3>
      {[
        ["design", "Areas & linework"],
        ["assets", "Assets"],
        ["access", "Access points"],
        ["imports", "Imported records"],
        ["route", "Route to site"],
      ].map(([key, label]) => (
        <button
          className="layer-row"
          key={key}
          onClick={() =>
            setVisibility((s) => ({ ...s, [key]: s[key] === false }))
          }
        >
          {visibility[key] === false ? <EyeOff size={16} /> : <Eye size={16} />}
          <span>{label}</span>
        </button>
      ))}
      <button
        className="subtle-button full"
        onClick={() => fileInput.current?.click()}
      >
        <Upload size={16} /> Import survey / service records
      </button>
      <details className="object-browser">
        <summary>Objects · {project?.features.length || 0}</summary>
        <p className="small-note">
          Select individual members here. Unlock or show hidden items without
          changing their group.
        </p>
        {project?.features
          .filter((f) => !f.properties.guideHidden)
          .map((f) => (
            <div className="object-row" key={f.id}>
              <button
                className={selected.includes(f.id) ? "active" : ""}
                onClick={() => {
                  setSelected([f.id]);
                  mapApi.current?.fly(centerOf([f]), 20);
                }}
              >
                {f.properties.label || f.properties.type}
              </button>
              <IconButton
                icon={f.properties.hidden ? EyeOff : Eye}
                label={
                  (f.properties.hidden ? "Show " : "Hide ") + f.properties.label
                }
                onClick={() =>
                  commit((p) => ({
                    ...p,
                    features: p.features.map((x) =>
                      x.id === f.id
                        ? {
                            ...x,
                            properties: {
                              ...x.properties,
                              hidden: !x.properties.hidden,
                            },
                          }
                        : x,
                    ),
                  }))
                }
              />
              <IconButton
                icon={f.properties.locked ? Lock : Unlock}
                label={
                  (f.properties.locked ? "Unlock " : "Lock ") +
                  f.properties.label
                }
                onClick={() =>
                  commit((p) => ({
                    ...p,
                    features: p.features.map((x) =>
                      x.id === f.id
                        ? {
                            ...x,
                            properties: {
                              ...x.properties,
                              locked: !x.properties.locked,
                            },
                          }
                        : x,
                    ),
                  }))
                }
              />
            </div>
          ))}
      </details>
    </>
  );
  const routePanel = (
    <>
      <div className="panel-title">
        <div>
          <span className="eyebrow">GET TO THE RIGHT ENTRANCE</span>
          <h2>Route to site</h2>
        </div>
        <Route size={22} />
      </div>
      <div className="route-flow">
        <span>A</span>
        <Field label="Departure">
          <input
            placeholder="Postcode, ///words or lat, lon"
            value={fromQuery}
            onChange={(e) => {
              setFromQuery(e.target.value);
              setFromPoint(null);
            }}
          />
        </Field>
      </div>
      <div className="route-flow">
        <span>B</span>
        <Field label="Site entrance">
          <select
            value={routeAccess}
            onChange={(e) => setRouteAccess(e.target.value)}
          >
            <option value="">Use first access point</option>
            {project?.features
              .filter((f) => f.properties.type === "access")
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.properties.label}
                </option>
              ))}
          </select>
        </Field>
      </div>
      <button
        className="subtle-button full"
        onClick={() => startTool("access")}
      >
        <MapPin size={16} /> Place an access point
      </button>
      <div className="divider" />
      <Field label="Vehicle profile">
        <select
          value={vehicle.name}
          onChange={(e) =>
            setVehicle(VEHICLES.find((v) => v.name === e.target.value)!)
          }
        >
          {VEHICLES.map((v) => (
            <option key={v.name}>{v.name}</option>
          ))}
        </select>
      </Field>
      <div className="two-fields">
        {[
          ["height", "Height (m)"],
          ["width", "Width (m)"],
          ["length", "Length (m)"],
          ["weight", "Weight (t)"],
        ].map(([key, label]) => (
          <Field label={label} key={key}>
            <input
              type="number"
              min=".1"
              step=".1"
              value={vehicle[key]}
              onChange={(e) =>
                setVehicle((v) => ({ ...v, [key]: +e.target.value }))
              }
            />
          </Field>
        ))}
      </div>
      <button className="primary full" onClick={calcRoute} disabled={routeBusy}>
        {routeBusy ? (
          <Busy>Calculating route…</Busy>
        ) : (
          <>
            <Route size={17} /> Calculate truck route
          </>
        )}
      </button>
      {project?.route && (
        <div className="route-result">
          <Status state="ready">Route saved</Status>
          <div className="route-numbers">
            <strong>
              {project.route.distanceKm.toFixed(1)}
              <small>km</small>
            </strong>
            <strong>
              {Math.round(project.route.durationSeconds / 60)}
              <small>min</small>
            </strong>
          </div>
          <p>{project.route.vehicle?.name}</p>
          <button
            className="secondary full"
            onClick={() => {
              const b = boundsOfFeatures([
                { geometry: project.route.geometry },
              ]);
              mapApi.current?.map?.fitBounds(
                [
                  [b[1], b[0]],
                  [b[3], b[2]],
                ],
                { padding: [45, 45] },
              );
            }}
          >
            Show whole route
          </button>
          <details>
            <summary>Turn instructions</summary>
            <ol className="route-steps">
              {project.route.maneuvers?.map((m: any, i: number) => (
                <li key={i}>{m.instruction}</li>
              ))}
            </ol>
          </details>
          <a
            className="subtle-button full"
            target="_blank"
            rel="noreferrer"
            href={`https://maps.apple.com/?daddr=${project.route.to[1]},${project.route.to[0]}&dirflg=d`}
          >
            <Navigation size={15} /> Open destination in Maps
          </a>
          <p className="small-note">
            Maps handoff does not retain the truck profile.
          </p>
        </div>
      )}
      <p className="small-note">
        This is a mapped truck route, not a guarantee of clearance. Check bridge
        heights, weight limits, current restrictions and final approach. Public
        routing has no commercial service guarantee.
      </p>
    </>
  );
  const askPanel = (
    <>
      <div className="panel-title">
        <div>
          <span className="eyebrow">YOUR PLANNING COPILOT</span>
          <h2>Ask SAMI</h2>
        </div>
        <Sparkles size={23} />
      </div>
      <div className="ask-intro">
        <div className="assistant-orb">
          <Sparkles size={25} />
        </div>
        <h3>Let's build it together.</h3>
        <p>
          Describe what you need. Review the proposed changes, then apply them
          to your plan.
        </p>
      </div>
      <div className="conversation" aria-live="polite">
        {conversation.map((m, i) => (
          <div key={i} className={"message " + m.role}>
            <small>
              {m.role === "user"
                ? "YOU"
                : m.mode === "local"
                  ? "SAMI · local command"
                  : "SAMI"}
            </small>
            <p>{m.text}</p>
          </div>
        ))}
      </div>
      {askBusy && <Busy>Working on your instruction…</Busy>}
      {proposal && (
        <div className="proposal">
          <strong>Proposed plan changes</strong>
          <ul>
            {proposal.actions
              .filter((a: any) => a.type !== "none")
              .map((a: any, i: number) => (
                <li key={i}>{describeAction(a)}</li>
              ))}
          </ul>
          <div className="button-row">
            <button className="primary" onClick={applyProposal}>
              <Check size={16} /> Apply changes
            </button>
            <button className="subtle-button" onClick={() => setProposal(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}
      <form
        className="ask-form"
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
      >
        <textarea
          aria-label="Ask SAMI instruction"
          placeholder="Add a 20 × 15 m stone compound…"
          value={askText}
          onChange={(e) => setAskText(e.target.value)}
          rows={3}
        />
        <div>
          <IconButton
            icon={Mic}
            label="Dictate instruction"
            active={speechListening}
            onClick={speech}
          />
          <button
            type="submit"
            className="primary"
            disabled={askBusy || !askText.trim()}
          >
            <ArrowUp size={17} /> Ask SAMI
          </button>
        </div>
      </form>
      <div className="prompt-chips">
        {commandExamples.slice(0, 4).map((s) => (
          <button key={s} onClick={() => ask(s)}>
            {s}
            <ArrowUpRight size={13} />
          </button>
        ))}
      </div>
      <p className="small-note">
        Common drawing commands run on this device. Open questions use the
        connected assistant when available. Plan changes always need your
        review.
      </p>
    </>
  );
  const inspector =
    selectedFeatures.length > 0 ? (
      <aside className="inspector">
        <div className="panel-title">
          <div>
            <span className="eyebrow">SELECTION</span>
            <h2>
              {selected.length === 1
                ? first.properties.label
                : `${selected.length} items`}
            </h2>
          </div>
          <IconButton
            icon={X}
            label="Clear selection"
            onClick={() => setSelected([])}
          />
        </div>
        <div className="selection-summary">
          <span className="selection-icon">
            {first.properties.type === "panel" ? (
              <Grid2X2 size={22} />
            ) : (
              <Box size={22} />
            )}
          </span>
          <div>
            <strong>
              {selected.length === 1
                ? TOOL_LABELS[first.properties.type] ||
                  first.properties.assetKind ||
                  first.properties.type
                : first.properties.groupId
                  ? "Grouped selection"
                  : "Multiple selection"}
            </strong>
            <small>
              {size[0].toFixed(2)} × {size[1].toFixed(2)} m extent
            </small>
          </div>
        </div>
        {selected.length === 1 && (
          <Field label="Name / label">
            <input
              value={first.properties.label || ""}
              onChange={(e) => updateSelected({ label: e.target.value })}
            />
          </Field>
        )}
        <div className="inspector-actions">
          <button onClick={duplicate}>
            <Copy size={16} /> Duplicate
          </button>
          <button
            onClick={() => startTool("edit-points")}
            disabled={
              selected.length !== 1 ||
              ["asset", "panel"].includes(first.properties.type)
            }
          >
            <Pencil size={16} /> Edit points
          </button>
          <button onClick={group} disabled={selected.length < 2}>
            <Group size={16} /> Group
          </button>
          <button
            onClick={ungroup}
            disabled={!selectedFeatures.some((f) => f.properties.groupId)}
          >
            <Ungroup size={16} /> Ungroup
          </button>
        </div>
        <div className="divider" />
        <h3 className="section-label">Appearance</h3>
        <div className="two-fields">
          <Field label="Fill">
            <input
              aria-label="Fill colour"
              type="color"
              value={
                /^#[0-9a-f]{6}$/i.test(first.properties.fill)
                  ? first.properties.fill
                  : "#a5c7bb"
              }
              onChange={(e) => updateSelected({ fill: e.target.value })}
            />
          </Field>
          <Field label="Outline">
            <input
              aria-label="Outline colour"
              type="color"
              value={
                /^#[0-9a-f]{6}$/i.test(first.properties.color)
                  ? first.properties.color
                  : "#508a79"
              }
              onChange={(e) => updateSelected({ color: e.target.value })}
            />
          </Field>
        </div>
        <Field
          label={`Opacity · ${Math.round((first.properties.opacity ?? 0.5) * 100)}%`}
        >
          <input
            type="range"
            min=".05"
            max="1"
            step=".05"
            value={first.properties.opacity ?? 0.5}
            onChange={(e) => updateSelected({ opacity: +e.target.value })}
          />
        </Field>
        {first.properties.type === "text" && (
          <Field label="Text size">
            <input
              type="number"
              min="10"
              max="36"
              value={first.properties.fontSize || 12}
              onChange={(e) => updateSelected({ fontSize: +e.target.value })}
            />
          </Field>
        )}
        <div className="two-fields">
          <Field label="Line style">
            <select
              value={first.properties.dash || ""}
              onChange={(e) => updateSelected({ dash: e.target.value })}
            >
              <option value="">Solid</option>
              <option value="6 4">Dashed</option>
              <option value="2 4">Dotted</option>
            </select>
          </Field>
          <Field label="Line weight">
            <input
              type="number"
              min=".3"
              max="8"
              step=".1"
              value={first.properties.weight || 1.5}
              onChange={(e) => updateSelected({ weight: +e.target.value })}
            />
          </Field>
        </div>
        <div className="divider" />
        <h3 className="section-label">Position & size</h3>
        <div className="button-row">
          <button className="secondary" onClick={() => rotateSelection(15)}>
            <RotateCcw size={16} /> 15°
          </button>
          <button className="secondary" onClick={() => rotateSelection(-15)}>
            <RotateCw size={16} /> 15°
          </button>
        </div>
        <div className="nudge-control">
          <IconButton
            icon={ArrowLeft}
            label="Move west"
            onClick={() => moveSelection(-nudge, 0)}
          />
          <div>
            <IconButton
              icon={ArrowUp}
              label="Move north"
              onClick={() => moveSelection(0, nudge)}
            />
            <IconButton
              icon={ArrowDown}
              label="Move south"
              onClick={() => moveSelection(0, -nudge)}
            />
          </div>
          <IconButton
            icon={ArrowRight}
            label="Move east"
            onClick={() => moveSelection(nudge, 0)}
          />
          <Field label="Step (m)">
            <input
              type="number"
              min=".01"
              max="100"
              step=".1"
              value={nudge}
              onChange={(e) => setNudge(+e.target.value || 0.1)}
            />
          </Field>
        </div>
        {selected.length === 1 &&
          ["asset", "image"].includes(first.properties.type) && (
            <div className="two-fields">
              {["width", "length"].map((k) => (
                <Field
                  label={k === "width" ? "Width (m)" : "Length (m)"}
                  key={k}
                >
                  <input
                    type="number"
                    min=".1"
                    max="200"
                    step=".1"
                    value={first.properties[k]}
                    onChange={(e) => {
                      const value = +e.target.value;
                      if (!(value > 0 && value <= 200)) return;
                      commit((p) => ({
                        ...p,
                        features: p.features.map((f) =>
                          f.id === first.id
                            ? {
                                ...f,
                                geometry: G.rectangle(
                                  centerOf([f]),
                                  k === "width" ? value : f.properties.width,
                                  k === "length" ? value : f.properties.length,
                                  f.properties.angle || 0,
                                ),
                                properties: { ...f.properties, [k]: value },
                              }
                            : f,
                        ),
                      }));
                    }}
                  />
                </Field>
              ))}
            </div>
          )}
        {selected.length === 1 && first.properties.type === "access" && (
          <>
            <div className="divider" />
            <div className="w3w-field">
              <span>///</span>
              <strong>{first.properties.words || "Add precise address"}</strong>
            </div>
            <button
              className="secondary full"
              onClick={() =>
                safe(async () => {
                  const id = first.id,
                    d = await request("words", {
                      coordinates: first.geometry.coordinates,
                    });
                  commit((p) => ({
                    ...p,
                    features: p.features.map((f) =>
                      f.id === id
                        ? {
                            ...f,
                            properties: {
                              ...f.properties,
                              words: d.words,
                              wordsVerified: true,
                            },
                          }
                        : f,
                    ),
                  }));
                })
              }
            >
              Find what3words address
            </button>
            <Field label="Three-word address (check before use)">
              <input
                placeholder="filled.count.soap"
                value={first.properties.words || ""}
                onChange={(e) =>
                  updateSelected({
                    words: e.target.value.replace(/^\/+/, ""),
                    wordsVerified: false,
                  })
                }
              />
            </Field>
          </>
        )}
        {selected.length === 1 && (
          <>
            <Field label="Item notes">
              <textarea
                rows={3}
                value={first.properties.notes || ""}
                onChange={(e) => updateSelected({ notes: e.target.value })}
              />
            </Field>
            {first.properties.photo && (
              <img
                className="note-photo"
                src={first.properties.photo}
                alt="Attached site observation"
              />
            )}
            <button
              className="subtle-button full"
              onClick={() =>
                safe(async () => {
                  const { Capacitor } = await import("@capacitor/core");
                  if (Capacitor.isNativePlatform()) recordPhoto();
                  else photoInput.current?.click();
                })
              }
            >
              <Camera size={16} /> Attach site photo
            </button>
          </>
        )}
        <div className="divider" />
        <div className="button-row">
          <button
            className="subtle-button"
            onClick={() => {
              updateSelected({ locked: true });
              setSelected([]);
            }}
          >
            <Lock size={15} /> Lock
          </button>
          <button className="danger" onClick={deleteSelection}>
            <Trash2 size={15} /> Delete
          </button>
        </div>
        <p className="small-note">
          Drag the centre handle to move the selection. Arrow keys nudge; Shift
          moves ten steps. Every edit can be undone.
        </p>
      </aside>
    ) : (
      <aside className="inspector site-overview">
        <span className="eyebrow">PROJECT OVERVIEW</span>
        <h2>Your site, at a glance.</h2>
        <div className="overview-metrics">
          <div>
            <strong>{((q?.siteArea || 0) / 10000).toFixed(2)}</strong>
            <span>hectares</span>
          </div>
          <div>
            <strong>{q?.objects || 0}</strong>
            <span>plan objects</span>
          </div>
          <div>
            <strong>{q?.panels || 0}</strong>
            <span>Trakway panels</span>
          </div>
          <div>
            <strong>{(q?.stoneArea || 0).toFixed(0)}</strong>
            <span>m² of stone</span>
          </div>
        </div>
        <div className="divider" />
        <h3 className="section-label">Plan checklist</h3>
        {[
          [!!project?.area, "Site boundary"],
          [
            !!project?.features.some((f) => f.properties.type === "access"),
            "Delivery access point",
          ],
          [!!project?.features.length, "Site layout"],
          [
            !!project?.snapshots.services &&
              ["ready", "empty"].includes(
                project.snapshots.services.status.state,
              ),
            "Mapped services checked",
          ],
          [!!project?.meta.company, "Company details"],
        ].map(([done, text]: any) => (
          <div className="check-row" key={text}>
            {done ? (
              <CheckCircle2 size={16} />
            ) : (
              <span className="check-empty" />
            )}
            {text}
          </div>
        ))}
        <button
          className="secondary full"
          onClick={() => {
            setMetadata({ ...project!.meta, name: project!.name });
            setModal("details");
          }}
        >
          <Pencil size={15} /> Project details
        </button>
        {project?.areaConfirmed && (
          <button
            className="secondary full danger-action"
            onClick={() => {
              if (
                confirm(
                  "This will clear all existing work and reset the site boundary. Continue?",
                )
              ) {
                setProject({
                  ...project,
                  area: null,
                  areaConfirmed: false,
                });
                setTool("boundary");
                notify("Redefining site boundary. Click to redraw.");
              }
            }}
          >
            <Unlock size={15} /> Clear site boundary
          </button>
        )}
        <div className="overview-tip">
          <Sparkles size={19} />
          <h3>A simpler way to plan.</h3>
          <p>
            Choose a shape, place it and make it yours. Select multiple items to
            move, rotate or style them together.
          </p>
          <button
            onClick={() => {
              setTab("ask");
              setSidebar(true);
            }}
          >
            Ask SAMI to help <ArrowUpRight size={15} />
          </button>
        </div>
      </aside>
    );
  return (
    <>
      {inputFiles}
      <input
        ref={photoInput}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        capture="environment"
        onChange={(e) => e.target.files?.[0] && recordPhoto(e.target.files[0])}
      />
      <input
        ref={logoInput}
        hidden
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => e.target.files?.[0] && saveLogo(e.target.files[0])}
      />
      {!project ? (
        <div className="home">
          <header className="home-header">
            <div className="brand">
              <img src="/brand/wordmark.png" alt="SAMI" />
              <span>ELITE</span>
            </div>
            <div className="header-actions">
              <span className="home-edition">
                SPATIAL ANALYSIS & MAPPING INTELLIGENCE
              </span>
              <IconButton
                icon={Settings2}
                label="Appearance and connections"
                onClick={() => setModal("settings")}
              />
            </div>
          </header>
          <main className="home-main">
            <section className="home-hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="tiny-orb" /> THE SITE PLANNING WORKSPACE
                </div>
                <h1>
                  From first visit.
                  <br />
                  To final plan.
                </h1>
                <p>
                  One place for your site, your access routes and every detail
                  in between.
                </p>
                <div className="hero-actions">
                  <button
                    className="primary large"
                    onClick={() => {
                      setNewName("");
                      setModal("new");
                    }}
                  >
                    <Plus size={18} /> Create a project
                  </button>
                  <button
                    className="secondary large"
                    onClick={() => fileInput.current?.click()}
                  >
                    <FolderOpen size={18} /> Open a file
                  </button>
                </div>
                <div className="hero-capabilities">
                  <span>
                    <Check size={14} /> Work across devices
                  </span>
                  <span>
                    <Check size={14} /> Draw offline
                  </span>
                  <span>
                    <Check size={14} /> Export to CAD
                  </span>
                </div>
              </div>
              <button
                className="hero-preview"
                onClick={() => openProject(demoProject())}
              >
                <div className="mini-map">
                  <div className="mini-grid" />
                  <div className="mini-building one" />
                  <div className="mini-building two" />
                  <div className="mini-compound" />
                  <div className="mini-track" />
                  <div className="mini-cabins">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="mini-dimension">110.00 m</div>
                  <div className="mini-access">A</div>
                  <div className="mini-north">N ↑</div>
                </div>
                <div className="preview-caption">
                  <span>
                    <strong>Explore an example</strong>
                    <small>Every object is editable</small>
                  </span>
                  <ArrowUpRight size={24} />
                </div>
              </button>
            </section>
            <section className="projects-section">
              <div className="section-heading">
                <div>
                  <h2>Your projects</h2>
                  <p>
                    Saved on this device. Open a private cloud link to continue
                    on another.
                  </p>
                </div>
                <button
                  className="subtle-button"
                  onClick={() => setModal("open-cloud")}
                >
                  <CloudDownload size={16} /> Open cloud link
                </button>
              </div>
              {loading ? (
                <Busy>Opening your workspace…</Busy>
              ) : projects.length ? (
                <div className="project-grid">
                  {projects.map((p) => (
                    <article className="project-card" key={p.id}>
                      <button onClick={() => openProject(p)}>
                        <div className="project-thumb">
                          <SquareDashed size={40} />
                          <span>{p.example ? "EXAMPLE" : "SITE PROJECT"}</span>
                        </div>
                        <h3>{p.name}</h3>
                        <p>
                          {p.meta?.client ||
                            p.meta?.address ||
                            "Site planning project"}
                        </p>
                        <footer>
                          <span>
                            {new Date(p.updatedAt).toLocaleDateString("en-GB")}
                          </span>
                          <span>{p.features.length} objects</span>
                          <ArrowUpRight size={16} />
                        </footer>
                      </button>
                      <button
                        className="delete-project"
                        aria-label={"Delete local project " + p.name}
                        onClick={() => {
                          setMetadata(p);
                          setModal("delete-local");
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-projects">
                  <FolderOpen size={26} />
                  <div>
                    <strong>Your next site starts here.</strong>
                    <p>
                      Create a project, import an earlier SAMI build's project,
                      or explore the example.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </main>
          <footer className="home-footer">
            <span>JW EDS · SAMI Elite 3.0</span>
            <span>Built for the people who make sites work.</span>
            <button onClick={() => setModal("privacy")}>Privacy & data</button>
          </footer>
        </div>
      ) : (
        <div
          className={`workspace ${focus ? "focus-mode" : ""} ${sidebar ? "sidebar-open" : ""} ${selected.length ? "has-selection" : ""}`}
        >
          <header className="app-header">
            <button
              className="brand"
              onClick={goHome}
              aria-label="Back to projects"
            >
              <img src="/brand/wordmark.png" alt="SAMI" />
              <span>ELITE</span>
            </button>
            <div className="header-divider" />
            <button
              className="project-title"
              onClick={() => {
                setMetadata({ ...project.meta, name: project.name });
                setModal("details");
              }}
            >
              <span>{project.name}</span>
              <ChevronDown size={14} />
              <small>
                {project.meta.reference || "SITE PROJECT"} ·{" "}
                {project.meta.revision || "P01"}
              </small>
            </button>
            <div className="save-indicator">
              <Status
                state={
                  saveState === "error"
                    ? "error"
                    : saveState === "saving"
                      ? "loading"
                      : "ready"
                }
              >
                {saveState === "error"
                  ? "Save failed"
                  : saveState === "saving"
                    ? "Saving…"
                    : "Saved on device"}
              </Status>
            </div>
            <div className="header-actions">
              <IconButton
                icon={Cloud}
                label="Cloud workspace"
                active={!!cloudInfo}
                onClick={() => setModal("cloud")}
              />
              <IconButton
                icon={Settings2}
                label="Workspace settings"
                onClick={() => setModal("settings")}
              />
              <button
                className="primary export-button"
                aria-label="Export plan"
                onClick={() => setModal("export")}
              >
                <FileDown size={16} />
                <span>Export plan</span>
              </button>
            </div>
          </header>
          <nav className="workspace-nav" aria-label="Workspace sections">
            <div>
              {[
                ["build", "Design", Pencil],
                ["layers", "Services & layers", Layers],
                ["route", "Route to site", Route],
                ["ask", "Ask SAMI", Sparkles],
              ].map(([id, label, Icon]: any) => (
                <button
                  key={id}
                  className={tab === id && sidebar ? "active" : ""}
                  onClick={() => {
                    setTab(id);
                    setSidebar(tab === id ? !sidebar : true);
                  }}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div className="nav-right">
              <button onClick={() => fileInput.current?.click()}>
                <Upload size={15} />
                <span>Import</span>
              </button>
              <button
                className={focus ? "active" : ""}
                onClick={() => setFocus(!focus)}
              >
                <Focus size={16} />
                <span>Focus view</span>
              </button>
            </div>
          </nav>
          <main className="workspace-body">
            {sidebar && !focus && (
              <aside className="toolkit">
                {tab === "build"
                  ? buildPanel
                  : tab === "layers"
                    ? layerPanel
                    : tab === "route"
                      ? routePanel
                      : askPanel}
              </aside>
            )}
            <section className="canvas-wrap" aria-label="Plan workspace">
              <MapCanvas
                project={project}
                selected={selected}
                tool={tool}
                points={points}
                visibility={visibility}
                basemap={project.view.basemap}
                labels={labels}
                snap={snap}
                multi={multi}
                apiRef={mapApi}
                onPoint={onPoint}
                onSelect={selectObject}
                onClear={() => {
                  setSelected([]);
                  setSourceInfo(null);
                }}
                onFinish={() => finishDrawing()}
                onMove={moveSelection}
                onVertex={(id, ring, vi, c) =>
                  commit((p) => ({
                    ...p,
                    features: p.features.map((f) => {
                      if (f.id !== id) return f;
                      const g = structuredClone(f.geometry);
                      if (g.type === "Point") g.coordinates = c;
                      else if (g.type === "LineString") g.coordinates[vi] = c;
                      else {
                        g.coordinates[ring][vi] = c;
                        if (vi === 0 && g.type === "Polygon")
                          g.coordinates[ring][g.coordinates[ring].length - 1] =
                            c;
                      }
                      return { ...f, geometry: g };
                    }),
                  }))
                }
                onViewport={(b, c, z) =>
                  setViewport({ bounds: b, center: c, zoom: z })
                }
                onSourceSelect={setSourceInfo}
                onDropAsset={(id, c) => {
                  const a = ASSETS.find((a) => a.id === id);
                  if (a) addFeatures([createAsset(a, c)]);
                }}
                onMapError={notify}
              />
              <div className="canvas-top">
                <form
                  className="site-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    search();
                  }}
                >
                  <Search size={17} />
                  <input
                    aria-label="Find a site"
                    placeholder="Find a site, postcode or ///what3words"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {searching ? (
                    <span className="search-spinner" />
                  ) : (
                    <button type="submit" aria-label="Search">
                      <ArrowRight size={16} />
                    </button>
                  )}
                </form>
                <div className="view-switch" aria-label="Map background">
                  {[
                    ["cad", "CAD"],
                    ["street", "Map"],
                    ["satellite", "Satellite"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      className={project.view.basemap === id ? "active" : ""}
                      onClick={() => setView(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        mapApi.current?.fly(r.coordinates);
                        setSearchResults([]);
                        setQuery(r.name);
                        if (!project.area) {
                          commit(
                            (p) => ({
                              ...p,
                              origin: r.coordinates,
                              view: {
                                ...p.view,
                                center: r.coordinates,
                                zoom: 18,
                              },
                            }),
                            { history: false },
                          );
                        }
                      }}
                    >
                      <MapPin size={16} />
                      <span>
                        {r.name}
                        <small>{r.source}</small>
                      </span>
                      <ArrowUpRight size={14} />
                    </button>
                  ))}
                  <button
                    className="close-search"
                    onClick={() => setSearchResults([])}
                  >
                    Close results
                  </button>
                </div>
              )}
              <div className="drawing-rail">
                {!sidebar && !focus && (
                  <IconButton
                    icon={PanelLeftOpen}
                    label="Open toolkit"
                    onClick={() => setSidebar(true)}
                  />
                )}
                <IconButton
                  icon={MousePointer2}
                  label="Select objects (Esc)"
                  active={tool === "select"}
                  onClick={() => startTool("select")}
                />
                <IconButton
                  icon={Hand}
                  label="Pan the map"
                  active={tool === "pan"}
                  onClick={() => startTool("pan")}
                />
                <span className="rail-separator" />
                <IconButton
                  icon={SquareDashed}
                  label="Define site boundary"
                  active={tool === "boundary"}
                  onClick={() => startTool("boundary")}
                />
                <IconButton
                  icon={Grid2X2}
                  label="Draw stone area"
                  active={tool === "stone"}
                  onClick={() => startTool("stone")}
                />
                <IconButton
                  icon={Ruler}
                  label="Measure dimension"
                  active={tool === "measure"}
                  onClick={() => startTool("measure")}
                />
                <IconButton
                  icon={MapPin}
                  label="Place access point"
                  active={tool === "access"}
                  onClick={() => startTool("access")}
                />
                <span className="rail-separator" />
                <IconButton
                  icon={Undo2}
                  label="Undo (⌘Z)"
                  disabled={!history.current.past.length}
                  onClick={undo}
                />
                <IconButton
                  icon={Redo2}
                  label="Redo (⌘⇧Z)"
                  disabled={!history.current.future.length}
                  onClick={redo}
                />
              </div>
              <div className="canvas-controls">
                <IconButton
                  icon={Plus}
                  label="Zoom in"
                  onClick={() => mapApi.current?.zoom(1)}
                />
                <IconButton
                  icon={Minus}
                  label="Zoom out"
                  onClick={() => mapApi.current?.zoom(-1)}
                />
                <span />
                <IconButton
                  icon={Maximize2}
                  label="Fit site to view"
                  onClick={() => mapApi.current?.fit()}
                />
                <IconButton
                  icon={Navigation}
                  label="Use my location"
                  onClick={locate}
                />
                {project?.areaConfirmed && (
                  <div className="lock-badge" title="Site boundary confirmed">
                    <Lock size={14} />
                    <span>Locked</span>
                  </div>
                )}
              </div>
              <div className="north-indicator">
                N<Navigation size={17} />
              </div>
              {!project.area && (
                <div className="boundary-prompt">
                  <SquareDashed size={27} />
                  <div>
                    <strong>Define your working area.</strong>
                    <p>
                      Locate the site, then draw a rectangle around the area you want to plan. You can adjust it anytime.
                    </p>
                  </div>
                  <button
                    className="primary"
                    onClick={() => startTool("boundary")}
                  >
                    Set working area
                  </button>
                </div>
              )}
              {project.example && (
                <div className="example-tag">
                  EDITABLE EXAMPLE · ILLUSTRATIVE GEOMETRY
                </div>
              )}
              {sourceInfo && (
                <div className="source-popover">
                  <button
                    className="close-corner"
                    onClick={() => setSourceInfo(null)}
                    aria-label="Close source detail"
                  >
                    <X size={16} />
                  </button>
                  <span className="eyebrow">SOURCE RECORD</span>
                  <h3>{sourceInfo.properties.label}</h3>
                  {sourceInfo.properties.voltage && (
                    <p>Voltage: {sourceInfo.properties.voltage} V</p>
                  )}
                  {sourceInfo.properties.operator && (
                    <p>Operator: {sourceInfo.properties.operator}</p>
                  )}
                  <small>{sourceInfo.properties.source}</small>
                  <p className="small-note">
                    {sourceInfo.properties.verification}
                  </p>
                  {sourceInfo.properties.sourceRecord?.startsWith(
                    "https://",
                  ) && (
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={sourceInfo.properties.sourceRecord}
                    >
                      Open source record ↗
                    </a>
                  )}
                  <button
                    className="primary full small"
                    onClick={() => {
                      const f = structuredClone(sourceInfo);
                      f.id = uid();
                      f.properties = {
                        ...f.properties,
                        planCommitted: true,
                        layer: "design",
                        label: f.properties.label + " · plan copy",
                      };
                      addFeatures([f]);
                      setSourceInfo(null);
                      notify(
                        "Source copied into your editable plan. Verify the record before use.",
                      );
                    }}
                  >
                    Copy into editable plan
                  </button>
                </div>
              )}
              {tool !== "select" &&
                tool !== "pan" &&
                tool !== "edit-points" && (
                  <>
                    <div className="precision-crosshair" />
                    <div className="drawing-prompt">
                      <div>
                        <strong>
                          {tool === "asset"
                            ? asset?.name || "Reference image"
                            : TOOL_LABELS[tool]}
                        </strong>
                        <span>
                          {tool === "asset"
                            ? "Tap the plan to place"
                            : tool === "boundary"
                              ? "Tap two opposite corners"
                              : tool === "measure"
                                ? "Tap the start and end point"
                                : tool === "text" ||
                                    tool === "access" ||
                                    tool === "note"
                                  ? "Tap the position on your plan"
                                  : `${points.length} points · tap to add${points.length >= 2 ? " · Finish when ready" : ""}`}
                        </span>
                      </div>
                      {tool !== "boundary" && (
                        <button
                          className="secondary small"
                          onClick={() => mapApi.current?.addCenter()}
                        >
                          Add here
                        </button>
                      )}
                      {points.length >= 2 &&
                        !["boundary", "measure", "box"].includes(tool) && (
                          <button
                            className="primary small"
                            onClick={() => finishDrawing()}
                          >
                            <Check size={15} /> Finish
                          </button>
                        )}
                      <IconButton
                        icon={X}
                        label="Cancel drawing"
                        onClick={() => startTool("select")}
                      />
                    </div>
                  </>
                )}
              {tool === "edit-points" && (
                <div className="drawing-prompt">
                  <strong>Drag points to reshape</strong>
                  <button
                    className="primary"
                    onClick={() => startTool("select")}
                  >
                    Done
                  </button>
                </div>
              )}
              {selected.length > 0 && tool === "select" && (
                <div className="selection-bar">
                  <span>
                    <CheckCircle2 size={15} />
                    {selected.length} selected
                  </span>
                  <IconButton
                    icon={Group}
                    label="Group selected objects"
                    onClick={group}
                    disabled={selected.length < 2}
                  />
                  <IconButton
                    icon={Ungroup}
                    label="Ungroup selected objects"
                    onClick={ungroup}
                    disabled={
                      !selectedFeatures.some((f) => f.properties.groupId)
                    }
                  />
                  <IconButton
                    icon={Copy}
                    label="Duplicate selected objects"
                    onClick={duplicate}
                  />
                  <IconButton
                    icon={Trash2}
                    label="Delete selected objects"
                    onClick={deleteSelection}
                  />
                  <IconButton
                    icon={X}
                    label="Clear selection"
                    onClick={() => setSelected([])}
                  />
                </div>
              )}
              <footer className="canvas-status">
                <div>
                  <button
                    className={snap ? "on" : ""}
                    onClick={() => setSnap(!snap)}
                  >
                    <Grid2X2 size={12} /> Snap {snap ? "on" : "off"}
                  </button>
                  <button
                    className={multi ? "on" : ""}
                    onClick={() => setMulti(!multi)}
                  >
                    <Group size={13} /> Multi-select
                  </button>
                  <button
                    onClick={() => startTool("box")}
                    title="Select objects inside a box"
                  >
                    <SquareDashed size={13} />
                    <span>Box</span>
                  </button>
                  <button onClick={() => setLabels(!labels)}>
                    {labels ? <Eye size={13} /> : <EyeOff size={13} />} Labels
                  </button>
                </div>
                <span className="coordinate-readout">
                  {viewport
                    ? `${viewport.center[1].toFixed(5)}, ${viewport.center[0].toFixed(5)}`
                    : "WGS84"}{" "}
                  <i /> {online ? "Online" : "Offline drawing"}
                </span>
              </footer>
            </section>
            {!focus && inspector}
          </main>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>{toast}</span>
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {modal === "new" && (
        <Modal title="Create your site project" onClose={() => setModal("")}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              openProject(newProject(newName.trim() || "Untitled site"));
            }}
          >
            <p className="modal-lead">
              Start with a name. Find your site and define its boundary in the
              workspace.
            </p>
            <Field label="Project name">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Riverside logistics compound"
                maxLength={100}
              />
            </Field>
            <button className="primary full" type="submit">
              <Plus size={16} /> Create project
            </button>
          </form>
        </Modal>
      )}
      {modal === "details" && metadata && (
        <Modal title="Project details" onClose={() => setModal("")} wide>
          <div className="details-grid">
            <div>
              <Field label="Project name">
                <input
                  value={metadata.name}
                  onChange={(e) =>
                    setMetadata({ ...metadata, name: e.target.value })
                  }
                />
              </Field>
              <div className="two-fields">
                {[
                  ["client", "Client"],
                  ["reference", "Project reference"],
                  ["company", "Company"],
                  ["revision", "Drawing revision"],
                  ["author", "Prepared by"],
                  ["jobTitle", "Role"],
                  ["contact", "Contact"],
                  ["address", "Site address"],
                ].map(([key, label]) => (
                  <Field key={key} label={label}>
                    <input
                      value={metadata[key] || ""}
                      onChange={(e) =>
                        setMetadata({ ...metadata, [key]: e.target.value })
                      }
                    />
                  </Field>
                ))}
              </div>
              <Field label="Plan & delivery notes">
                <textarea
                  rows={4}
                  value={metadata.notes || ""}
                  onChange={(e) =>
                    setMetadata({ ...metadata, notes: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="brand-upload">
              <Building2 size={30} />
              <h3>Your company, on every plan.</h3>
              {metadata.logo ? (
                <img src={metadata.logo} alt="Company logo preview" />
              ) : (
                <div className="logo-empty">Company logo</div>
              )}
              <button
                className="secondary full"
                onClick={() => logoInput.current?.click()}
              >
                <Upload size={16} /> Choose logo
              </button>
              {metadata.logo && (
                <button
                  className="subtle-button"
                  onClick={() => setMetadata({ ...metadata, logo: "" })}
                >
                  Remove logo
                </button>
              )}
              <p>
                Included in your PDF and portable project. PNG, JPEG or WebP.
              </p>
            </div>
          </div>
          <button
            className="primary"
            onClick={() => {
              const { name, ...meta } = metadata;
              commit((p) => ({ ...p, name: name || p.name, meta }));
              setModal("");
            }}
          >
            <Check size={16} /> Save details
          </button>
        </Modal>
      )}
      {modal === "add-point" && (
        <Modal
          title={"Add " + TOOL_LABELS[tool]?.toLowerCase()}
          onClose={() => setModal("")}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pendingPoint) {
                const f = feature(
                  tool,
                  { type: "Point", coordinates: pendingPoint },
                  {
                    label: textInput.trim() || TOOL_LABELS[tool],
                    layer: tool === "access" ? "access" : "design",
                    color: "#308d7c",
                    fontSize: 12,
                  },
                );
                addFeatures([f]);
                setTool("select");
                setPendingPoint(null);
                setModal("");
              }
            }}
          >
            <Field label="Label">
              <input
                autoFocus
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                maxLength={160}
              />
            </Field>
            <button className="primary full" type="submit">
              <Plus size={16} /> Add to plan
            </button>
          </form>
        </Modal>
      )}
      {modal === "export" && project && (
        <Modal
          title="A plan worth presenting."
          onClose={() => setModal("")}
          wide
        >
          <div className="export-layout">
            <div className="export-preview">
              <div className="paper-preview">
                <header>
                  <strong>
                    SAMI <em>ELITE</em>
                  </strong>
                  <span>SITE LOGISTICS PLAN</span>
                </header>
                <PlanPreview
                  project={project}
                  technical={exportStyle === "technical"}
                  labels={labels}
                  visibility={visibility}
                />
                <footer>
                  <span>
                    {project.meta.company || "Your company"}
                    <br />
                    {project.meta.client || "Client"}
                  </span>
                  <span>
                    {project.meta.reference || "PROJECT"}
                    <br />
                    REV {project.meta.revision}
                  </span>
                </footer>
              </div>
              <p>
                A3 landscape · vector artwork · title block · north arrow ·
                scale bar
              </p>
            </div>
            <div>
              <span className="eyebrow">PROFESSIONAL OUTPUT</span>
              <h3>Ready to share.</h3>
              <Field label="Drawing appearance">
                <select
                  value={exportStyle}
                  onChange={(e) => setExportStyle(e.target.value)}
                >
                  <option value="presentation">
                    Presentation · coloured plan
                  </option>
                  <option value="technical">Technical · monochrome</option>
                </select>
              </Field>
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={exportRoute}
                  onChange={(e) => setExportRoute(e.target.checked)}
                />
                Include route & access brief (page 2)
              </label>
              <button
                className="primary full large"
                disabled={!!exportBusy}
                onClick={() => exportFile("pdf")}
              >
                {exportBusy === "pdf" ? (
                  <Busy>Creating vector PDF…</Busy>
                ) : (
                  <>
                    <FileDown size={18} /> Export PDF plan
                  </>
                )}
              </button>
              <p className="small-note">
                Uses the drawing and saved context immediately. Export never
                waits for external mapping.
              </p>
              <div className="divider" />
              <h3 className="section-label">Continue on any platform</h3>
              <button
                className="secondary full"
                disabled={!!exportBusy}
                onClick={() => exportFile("sami")}
              >
                <Save size={16} /> Portable SAMI project
              </button>
              <div className="format-grid">
                {["dxf", "geojson", "kml", "svg", "csv"].map((t) => (
                  <button
                    key={t}
                    disabled={!!exportBusy}
                    onClick={() => exportFile(t)}
                  >
                    {t.toUpperCase()}
                    <Download size={14} />
                  </button>
                ))}
              </div>
              <p className="small-note">
                SAMI preserves the complete editable project. DXF uses metres
                with a documented WGS84 local origin. GeoJSON and KML use
                geographic coordinates.
              </p>
            </div>
          </div>
        </Modal>
      )}
      {modal === "cloud" && (
        <Modal title="One project. Every device." onClose={() => setModal("")}>
          <div className="cloud-hero">
            <Cloud size={38} />
            <p>
              Save a private cloud copy, then open its edit link on your phone,
              tablet or computer.
            </p>
          </div>
          {cloudInfo ? (
            <>
              <Status state={cloudConflict ? "error" : "ready"}>
                {cloudConflict
                  ? "Newer cloud version detected"
                  : `Cloud version ${cloudInfo.version}`}
              </Status>
              <p className="small-note">
                The edit link is the key to this project. Anyone with the link
                can open and edit it. Saving checks for changes from other
                devices.
              </p>
              <div className="cloud-actions">
                <button
                  className="primary"
                  disabled={cloudBusy || cloudConflict}
                  onClick={() => cloudAction("save")}
                >
                  <CloudUpload size={17} /> Save to cloud
                </button>
                <button
                  className="secondary"
                  disabled={cloudBusy}
                  onClick={() => cloudAction("read")}
                >
                  <CloudDownload size={17} /> Load latest copy
                </button>
                <button className="secondary" onClick={shareCloud}>
                  <Link size={17} /> Share private edit link
                </button>
                <button
                  className="subtle-button"
                  onClick={() => exportFile("sami")}
                >
                  <Download size={16} /> Keep a file backup
                </button>
              </div>
              {cloudConflict && (
                <p className="error-note">
                  Your local work is safe. Export it before loading the newer
                  cloud copy. Undo can also recover your local changes after
                  loading.
                </p>
              )}
              <button
                className="danger subtle"
                disabled={cloudBusy}
                onClick={() => setModal("revoke-cloud")}
              >
                Revoke cloud link
              </button>
            </>
          ) : (
            <>
              <button
                className="primary full"
                disabled={cloudBusy}
                onClick={() => cloudAction("create")}
              >
                {cloudBusy ? (
                  <Busy>Saving private project…</Busy>
                ) : (
                  <>
                    <CloudUpload size={17} /> Create private cloud copy
                  </>
                )}
              </button>
              <p className="small-note">
                Cloud copies are private. Your project stays available locally
                when offline. This release uses explicit Save / Load to keep
                changes predictable.
              </p>
            </>
          )}
          {cloudBusy && cloudInfo && <Busy>Contacting cloud storage…</Busy>}
        </Modal>
      )}
      {modal === "revoke-cloud" && (
        <Modal
          title="Revoke the private edit link?"
          onClose={() => setModal("cloud")}
        >
          <p>
            This deletes the cloud copy and makes its link stop working. Your
            local project stays on this device.
          </p>
          <div className="button-row">
            <button
              className="danger"
              onClick={async () => {
                await cloudAction("delete");
                setModal("cloud");
              }}
            >
              Revoke link
            </button>
            <button className="secondary" onClick={() => setModal("cloud")}>
              Keep it
            </button>
          </div>
        </Modal>
      )}
      {modal === "open-cloud" && (
        <Modal title="Open a private project" onClose={() => setModal("")}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = textInput.trim();
              try {
                const key = value.includes("#")
                  ? new URLSearchParams(value.split("#")[1]).get("project")
                  : value;
                if (!key || !/^[a-f0-9]{64}$/.test(key))
                  throw Error("Paste a complete SAMI private edit link.");
                importCloud(key);
              } catch (e) {
                notify((e as Error).message);
              }
            }}
          >
            <Field label="Private edit link">
              <input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="https://sami.site/#project=…"
              />
            </Field>
            <button className="primary full" disabled={cloudBusy}>
              {cloudBusy ? <Busy>Opening…</Busy> : "Open project"}
            </button>
          </form>
        </Modal>
      )}
      {modal === "settings" && (
        <Modal title="Make SAMI yours" onClose={() => setModal("")} wide>
          <div className="settings-grid">
            <div>
              <span className="eyebrow">APPEARANCE</span>
              <h3>A workspace that suits you.</h3>
              <div className="theme-options">
                {[
                  ["studio", "Studio", "Calm, light workspace"],
                  ["graphite", "Graphite", "Dark tools, clear drawing"],
                  ["blueprint", "Blueprint", "Deep blue engineering desk"],
                ].map(([id, name, desc]) => (
                  <button
                    key={id}
                    className={`theme-choice ${id} ${theme === id ? "selected" : ""}`}
                    onClick={() => setTheme(id)}
                  >
                    <div>
                      <i />
                      <span />
                      <b />
                    </div>
                    <strong>{name}</strong>
                    <small>{desc}</small>
                    {theme === id && <Check size={17} />}
                  </button>
                ))}
              </div>
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={labels}
                  onChange={(e) => setLabels(e.target.checked)}
                />{" "}
                Show object labels
              </label>
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={snap}
                  onChange={(e) => setSnap(e.target.checked)}
                />{" "}
                Snap to vertices and 0.5 m grid
              </label>
              <button
                className="subtle-button"
                onClick={() => setModal("privacy")}
              >
                Privacy, data sources & compatibility
              </button>
            </div>
            <div className="connection-panel">
              <span className="eyebrow">CONNECTION STATUS</span>
              <h3>Know what is connected.</h3>
              {!health ? (
                <Busy>Checking connections…</Busy>
              ) : health.unavailable ? (
                <div className="error-note">
                  The application server is unreachable. Local drawing remains
                  available.
                </div>
              ) : (
                <>
                  {[
                    ["Application server", true],
                    ["Private project storage", health.cloud],
                    ["what3words", health.what3words],
                    ["Connected Ask SAMI", health.ai],
                  ].map(([name, ready]: any) => (
                    <div className="connection-row" key={name}>
                      <span>{name}</span>
                      <Status state={ready ? "ready" : "error"}>
                        {ready ? "Configured" : "Needs setup"}
                      </Status>
                    </div>
                  ))}
                  <p className="small-note">
                    Configured indicates server settings exist. Use each feature
                    to verify its provider, credits and current availability.
                  </p>
                </>
              )}
              <button className="secondary full" onClick={checkHealth}>
                <RotateCw size={16} /> Check connection status
              </button>
              <div className="info-card">
                <strong>CAD is always local.</strong>
                <p>
                  Your drawing opens instantly. Map context and services load
                  separately, with a time limit and dated results.
                </p>
              </div>
              <span className="small-note">SAMI Elite 3.0.0 · JW EDS</span>
            </div>
          </div>
        </Modal>
      )}
      {modal === "delete-local" && (
        <Modal title="Delete this local project?" onClose={() => setModal("")}>
          <p>
            Delete “{metadata?.name}” from this device? Cloud copies and
            exported backups are unaffected.
          </p>
          <div className="button-row">
            <button
              className="danger"
              onClick={() =>
                safe(async () => {
                  await deleteProject(metadata.id);
                  setProjects(await listProjects());
                  setModal("");
                })
              }
            >
              Delete local copy
            </button>
            <button className="secondary" onClick={() => setModal("")}>
              Keep project
            </button>
          </div>
        </Modal>
      )}
      {modal === "privacy" && (
        <Modal title="Your project & its sources" onClose={() => setModal("")}>
          <div className="prose">
            <h3>Your drawings</h3>
            <p>
              Projects are saved in this device's browser storage. Portable
              .sami files include your drawing, photos, company logo and saved
              source records. Cloud saving is optional; a private edit link
              gives its holder access. Revoke that link from the cloud panel.
            </p>
            <h3>Connected sources</h3>
            <p>
              Searching and loading data sends the entered location or site
              bounds to the configured provider. Address search uses Photon /
              OpenStreetMap and UK postcode lookup uses Postcodes.io. Mapping
              uses OpenStreetMap / Overpass; planning constraints use Planning
              Data, Historic England and Natural England, with varying coverage,
              mainly England. Satellite imagery is credited on the map.
              Background tiles are not downloaded for offline use.
            </p>
            <h3>what3words & Ask SAMI</h3>
            <p>
              what3words requires a valid project API key and the required
              subscription permissions. SAMI is an independent product; this
              build does not imply a what3words partnership. Connected Ask SAMI
              sends your instruction, project name, selection labels and
              quantities to Vercel AI Gateway. Common local drawing commands
              stay on the device.
            </p>
            <h3>Accuracy & formats</h3>
            <p>
              Mapped records are planning references, not surveyed utility
              records or proof of absence. Routes use truck dimensions against
              available mapping, not live clearance verification. DXF exports
              use local metres; GeoJSON/KML use WGS84. DWG requires conversion
              to DXF; this release does not read BIM/IFC or legacy binary Visio
              files.
            </p>
            <h3>On Apple devices</h3>
            <p>
              The native build uses the same project format, with file sharing,
              camera and location access only when requested. Denied permissions
              do not block manual planning.
            </p>
          </div>
        </Modal>
      )}
      <ConfirmBoundaryModal
        showModal={showConfirmBoundaryModal}
        metrics={boundaryMetricsForConfirm}
        onConfirm={() => {
          setShowConfirmBoundaryModal(false);
          if (pendingBoundary) {
            finalizeBoundary(pendingBoundary);
            setPendingBoundary(null);
            setBoundaryMetricsForConfirm(null);
          }
        }}
        onRedefine={() => {
          setShowConfirmBoundaryModal(false);
          setBoundaryMetricsForConfirm(null);
          setPendingBoundary(null);
          // Reset to boundary drawing mode
          setTool("boundary");
          setPoints([]);
          notify("Redefining site boundary. Click to redraw.");
        }}
        onCancel={() => {
          setShowConfirmBoundaryModal(false);
          setBoundaryMetricsForConfirm(null);
          setPendingBoundary(null);
        }}
      />
    </>
  );
}
