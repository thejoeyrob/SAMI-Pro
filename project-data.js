/* Project recovery and non-destructive source refresh rules. */
(function(root){
  "use strict";
  function recover(candidates, activeId) {
    const valid = candidates.filter(p => p && typeof p.id === "string" &&
      Array.isArray(p.features) && /^SAMI-PROJECT-[123]$/.test(p.format));
    const active = valid.filter(p => p.id === activeId);
    return (active.length ? active : valid).sort((a,b) =>
      (Date.parse(b.savedAt || b.createdAt || "") || 0) -
      (Date.parse(a.savedAt || a.createdAt || "") || 0) ||
      (b.storageRevision || 0) - (a.storageRevision || 0))[0] || null;
  }
  function recordKey(f) {
    const p = f.properties || {};
    return String(p.sourceRecord || p.osmId || p.osm_id || JSON.stringify([p.serviceType,f.geometry]));
  }
  function mergeSource(current,incoming,sourceId,limit=12000) {
    const previous = current.filter(f => f.properties.sourceId === sourceId);
    if (!incoming.length && previous.length) return {features:current,retained:true};
    const keys = new Set(previous.filter(f => f.properties.planCommitted).map(recordKey));
    const features = current.filter(f => f.properties.sourceId !== sourceId || f.properties.planCommitted)
      .concat(incoming.filter(f => !keys.has(recordKey(f))));
    if (features.length > limit) throw Error("This source would exceed the project record limit. Reduce the site area; your existing data has been kept.");
    return {features,retained:false};
  }
  function recommendedDetail(areaM2,count=0) {
    return areaM2 > 1000000 || count > 4000 ? "low" : areaM2 > 100000 || count > 1500 ? "medium" : "high";
  }
  const api = {recover,mergeSource,recommendedDetail};
  if (typeof module === "object" && module.exports) module.exports=api;
  else root.SAMIProjectData=api;
})(typeof window === "object" ? window : globalThis);
