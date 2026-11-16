import { useMemo } from "react";
import { planSVG } from "../core/documents.mjs";
import type { Project } from "../types";
export function PlanPreview({
  project,
  technical,
  labels,
  visibility,
}: {
  project: Project;
  technical: boolean;
  labels: boolean;
  visibility: Record<string, boolean>;
}) {
  const svg = useMemo(
    () => planSVG(project, { technical, labels, visibility }).svg,
    [project, technical, labels, visibility],
  );
  return (
    <div
      className="live-plan-preview"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
