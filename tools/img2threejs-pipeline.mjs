import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const toolRoot = join(projectRoot, "tools", "img2threejs");
const forgeRoot = join(toolRoot, "forge");
const workRoot = resolve(
  projectRoot,
  process.env.IMG2THREEJS_WORK_ROOT ?? ".asset-work/img2threejs",
);
const python = process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");
const upstream = {
  repository: "https://github.com/hoainho/img2threejs",
  commit: "e8ff28a6ae0cb534c7b2ebc15cb3f06709262d5b",
  version: "1.2.0",
  license: "MIT",
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

function ensureTool() {
  if (existsSync(join(toolRoot, "SKILL.md"))) return;
  fail(
    "img2threejs submodule missing. Run: git submodule update --init --recursive",
  );
}

function run(script, args, capture = false) {
  const result = spawnSync(python, [join(forgeRoot, script), ...args], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
  });
  if (result.error) fail(`${python} failed: ${result.error.message}`);
  if (result.status !== 0) {
    if (capture) process.stderr.write(result.stderr ?? "");
    process.exit(result.status ?? 1);
  }
  return result.stdout ?? "";
}

function runPython(args) {
  const result = spawnSync(python, args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.error) fail(`${python} failed: ${result.error.message}`);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function assetPaths(assetId) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(assetId ?? ""))
    fail("Asset id must use lowercase kebab-case, for example: wicket-gate");
  const root = join(workRoot, assetId);
  return {
    root,
    assessment: join(root, "pre-spec-assessment.json"),
    detailInventory: join(root, "detail-inventory.json"),
    zones: join(root, "detail-zones"),
    anatomy: join(root, "anatomy.json"),
    anatomyOverlay: join(root, "anatomy-overlay.png"),
    spec: join(root, "object-sculpt-spec.json"),
    generated: join(root, "generated", `create${toPascal(assetId)}Model.ts`),
    manifest: join(root, "pipeline-manifest.json"),
  };
}

function toPascal(value) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function targetName(assetId) {
  return assetId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function initAsset([assetId, imageArg, complexity = "moderate", domain = "object", ...rest]) {
  if (!assetId || !imageArg) return usage(1);
  if (!["simple", "moderate", "complex", "ultra-complex"].includes(complexity))
    fail("Complexity must be simple, moderate, complex, or ultra-complex.");
  if (!["object", "character", "hybrid"].includes(domain))
    fail("Domain must be object, character, or hybrid.");
  const force = rest.includes("--force");
  const image = resolve(process.cwd(), imageArg);
  if (!existsSync(image)) fail(`Reference image not found: ${image}`);
  const paths = assetPaths(assetId);
  if (existsSync(paths.manifest) && !force)
    fail(`Asset intake already exists: ${paths.root}\nPass --force to rebuild scaffolds.`);
  mkdirSync(paths.zones, { recursive: true });
  mkdirSync(dirname(paths.generated), { recursive: true });
  const overwrite = force ? ["--force"] : [];

  const probe = run("stage1_intake/probe_image.py", [image], true);
  writeFileSync(join(paths.root, "probe.json"), probe, "utf8");
  run("stage2_spec/new_pre_spec_assessment.py", [
    targetName(assetId),
    "--image",
    image,
    "--complexity",
    complexity,
    "--out",
    paths.assessment,
    ...overwrite,
  ]);
  run("stage1_intake/build_detail_inventory.py", [
    image,
    "--mode",
    "grid-3x3",
    "--complexity",
    complexity,
    "--out-dir",
    paths.zones,
    "--out",
    paths.detailInventory,
    ...overwrite,
  ]);
  if (domain !== "object")
    run("stage1_intake/extract_landmarks.py", [
      image,
      "--out",
      paths.anatomy,
      "--overlay",
      paths.anatomyOverlay,
      ...overwrite,
    ]);
  run("stage2_spec/new_sculpt_spec.py", [
    targetName(assetId),
    "--image",
    image,
    "--assessment",
    paths.assessment,
    "--out",
    paths.spec,
    ...(domain !== "object" ? ["--character"] : []),
    ...overwrite,
  ]);
  writeFileSync(
    paths.manifest,
    `${JSON.stringify(
      {
        assetId,
        targetName: targetName(assetId),
        referenceImage: image,
        complexity,
        domain,
        upstream,
        status: "intake-needs-agent-review",
        sourceLicense: "UNVERIFIED — record rights before promotion",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  console.log(`\nIntake ready: ${paths.root}`);
  console.log("Next: inspect reference + zone crops, fill assessment/detail inventory, then run validate.");
}

function validateAsset([assetId]) {
  if (!assetId) return usage(1);
  const { spec } = assetPaths(assetId);
  if (!existsSync(spec)) fail(`Spec not found: ${spec}`);
  run("stage2_spec/validate_sculpt_spec.py", [spec]);
  run("stage2_spec/validate_sculpt_spec.py", [spec, "--strict-quality"]);
}

function generateAsset([assetId, ...rest]) {
  if (!assetId) return usage(1);
  const paths = assetPaths(assetId);
  if (!existsSync(paths.spec)) fail(`Spec not found: ${paths.spec}`);
  validateAsset([assetId]);
  mkdirSync(dirname(paths.generated), { recursive: true });
  run("stage3_build/generate_threejs_factory.py", [
    paths.spec,
    "--out",
    paths.generated,
    ...(rest.includes("--force") ? ["--force"] : []),
  ]);
  const manifest = JSON.parse(readFileSync(paths.manifest, "utf8"));
  manifest.status = "generated-needs-render-review";
  writeFileSync(paths.manifest, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Generated review candidate: ${paths.generated}`);
  console.log("Do not promote yet. Render, compare, pass review gates, then register license and budgets.");
}

function testTool() {
  runPython(["-m", "unittest", "discover", "-s", join(forgeRoot, "tests"), "-v"]);
}

function usage(exitCode = 0) {
  console.log(`Usage:
  npm run asset:3d -- init <asset-id> <image> [complexity] [object|character|hybrid] [--force]
  npm run asset:3d -- validate <asset-id>
  npm run asset:3d -- generate <asset-id> [--force]
  npm run asset:3d:test

Examples:
  npm run asset:3d -- init christian-turnaround ./references/christian.png complex character
  npm run asset:3d -- init wicket-gate ./references/wicket-gate.png moderate object`);
  process.exit(exitCode);
}

ensureTool();
const [command, ...args] = process.argv.slice(2);
if (command === "init") initAsset(args);
else if (command === "validate") validateAsset(args);
else if (command === "generate") generateAsset(args);
else if (command === "test") testTool();
else usage(command ? 1 : 0);
