import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const registry = JSON.parse(
  fs.readFileSync(path.join(root, "docs/body-widget-umbrella-registry.json"), "utf8"),
);
const canonicalIds = new Set(registry.umbrellas.map((item) => item.id));
const explicitProductExtensions = new Set(["rest.rest_plan"]);
const files = [
  "client/src/components/body/hub-production-widgets.tsx",
  "client/src/components/body/canonical-metric-widget.tsx",
  "client/src/components/body/activity/steps-production-widget.tsx",
  "client/src/components/body/activity/activities-production-widget.tsx",
  "client/src/components/body/activity/workout-production-widget.tsx",
  "client/src/components/body/activity/strength-progress-widget.tsx",
  "client/src/components/body/nutrition/nutrition-production-widgets.tsx",
  "client/src/components/body/rest/rest-production-widgets.tsx",
  "client/src/components/body/hygiene/hygiene-production-widget.tsx",
  "client/src/components/body/manual-observation-widget.tsx",
];

const implemented = new Set();
for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of source.matchAll(/\bid:\s*"((?:hub|activity|nutrition|rest|hygiene)\.[a-z0-9_]+)"/g)) {
    implemented.add(match[1]);
  }
}

const unknown = [...implemented].filter(
  (id) => !canonicalIds.has(id) && !explicitProductExtensions.has(id),
);
if (unknown.length) {
  throw new Error(`Production widgets outside the approved vocabulary: ${unknown.join(", ")}`);
}

const bySubmodule = {};
const implementedSelected = new Set(
  [...implemented].filter((id) => canonicalIds.has(id)),
);
const implementedExtensions = [...implemented].filter((id) =>
  explicitProductExtensions.has(id),
);
for (const item of registry.umbrellas) {
  bySubmodule[item.submodule] ??= { implemented: 0, selected: 0 };
  bySubmodule[item.submodule].selected += 1;
  if (implementedSelected.has(item.id)) bySubmodule[item.submodule].implemented += 1;
}

console.log(
  `Validated ${implementedSelected.size} of ${canonicalIds.size} research-selected production widget umbrellas.`,
);
console.log(
  `Validated ${implementedExtensions.length} explicit product extension(s): ${
    implementedExtensions.join(", ") || "none"
  }.`,
);
console.log(bySubmodule);
