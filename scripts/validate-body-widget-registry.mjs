import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const docs = resolve(root, "docs");
const registry = JSON.parse(
  await readFile(resolve(docs, "body-widget-umbrella-registry.json"), "utf8"),
);

const errors = [];
const allowedSubmodules = new Set([
  "hub",
  "activity",
  "nutrition",
  "rest_recovery",
  "hygiene_looks",
]);
const forbiddenUmbrellaNames = new Set([
  "Daily Movement",
  "Performance Specialist",
  "Today Intake",
  "Food Pattern",
  "Metabolic Observations",
  "Sleep Pattern",
  "Recovery Signals",
  "Body Signals",
  "Vitals",
  "Cross-domain Measurements",
  "Custom Tracker",
  "Next Workout",
]);

const ids = new Set();
const legacyIds = new Set();
for (const umbrella of registry.umbrellas) {
  if (!umbrella.id || !umbrella.name || !umbrella.submodule) {
    errors.push(`Incomplete registry row: ${JSON.stringify(umbrella)}`);
  }
  if (ids.has(umbrella.id)) errors.push(`Duplicate umbrella ID: ${umbrella.id}`);
  ids.add(umbrella.id);
  if (!allowedSubmodules.has(umbrella.submodule)) {
    errors.push(`Unknown submodule ${umbrella.submodule}: ${umbrella.id}`);
  }
  if (forbiddenUmbrellaNames.has(umbrella.name)) {
    errors.push(`Rejected grouping label returned as umbrella: ${umbrella.name}`);
  }
  for (const legacyId of umbrella.legacy_ids || []) {
    if (legacyIds.has(legacyId)) {
      errors.push(`Legacy umbrella ID has multiple owners: ${legacyId}`);
    }
    if (ids.has(legacyId) || registry.umbrellas.some((row) => row.id === legacyId)) {
      errors.push(`Legacy umbrella ID is also current: ${legacyId}`);
    }
    legacyIds.add(legacyId);
  }
}

const specFiles = (await readdir(docs))
  .filter((name) => name.startsWith("body-widget-spec-") && name.endsWith(".md"));
const specIds = new Map();

for (const file of specFiles) {
  const contents = await readFile(resolve(docs, file), "utf8");
  const match = contents.match(/Umbrella ID:\s*`([^`]+)`/);
  if (!match) {
    errors.push(`Specification has no Umbrella ID: ${file}`);
    continue;
  }
  const id = match[1];
  if (specIds.has(id)) {
    errors.push(`Multiple specifications for ${id}: ${specIds.get(id)}, ${file}`);
  }
  specIds.set(id, file);
}

for (const id of ids) {
  if (!specIds.has(id)) errors.push(`Registry umbrella lacks specification: ${id}`);
}
for (const [id, file] of specIds) {
  if (!ids.has(id)) errors.push(`Specification is absent from registry: ${id} (${file})`);
}

if (registry.ontology !== "Body submodule -> widget umbrella -> widget variant -> supported size") {
  errors.push("Registry ontology changed or disappeared.");
}
if (registry.freedom_rule !== "ALLES KAN") {
  errors.push("Freedom rule changed or disappeared.");
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

const counts = Object.fromEntries(
  [...allowedSubmodules].map((submodule) => [
    submodule,
    registry.umbrellas.filter((umbrella) => umbrella.submodule === submodule).length,
  ]),
);

console.log(
  `Validated ${registry.umbrellas.length} umbrellas and ${specFiles.length} specifications.`,
);
console.log(counts);
