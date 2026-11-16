import { openDB } from "idb";
import type { Project } from "../types";
const db = openDB("sami-elite", 1, {
  upgrade(db) {
    db.createObjectStore("projects", { keyPath: "id" });
    db.createObjectStore("settings");
  },
});
export async function saveProject(p: Project) {
  await (await db).put("projects", p);
  localStorage.setItem("sami.elite.active", p.id);
}
export async function listProjects(): Promise<Project[]> {
  return (await (await db).getAll("projects")).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}
export async function readProject(id: string): Promise<Project | undefined> {
  return (await db).get("projects", id);
}
export async function deleteProject(id: string) {
  await (await db).delete("projects", id);
}
export async function getSetting(key: string) {
  return (await db).get("settings", key);
}
export async function setSetting(key: string, value: any) {
  await (await db).put("settings", value, key);
}
