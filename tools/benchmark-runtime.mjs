import { chromium } from "@playwright/test";

const url = process.argv[2] ?? "http://127.0.0.1:4173";
const sceneIndex = Number(process.argv[3] ?? 2);
const sampleMs = Number(process.argv[4] ?? 5_000);
const mobile = process.argv[5] === "mobile";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: mobile ? 2 : 1,
  hasTouch: mobile,
  isMobile: mobile,
});
const runtimeErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") runtimeErrors.push(message.text());
});
page.on("pageerror", (error) => runtimeErrors.push(error.message));

await page.addInitScript(() => {
  const audit = {
    drawCalls: 0,
    triangles: 0,
    frames: [],
    texturesCreated: 0,
    texturesDeleted: 0,
    buffersCreated: 0,
    buffersDeleted: 0,
  };
  Object.defineProperty(window, "__pilgrimsWebGlAudit", {
    value: audit,
    configurable: false,
  });

  const triangleCount = (mode, count) => {
    if (mode === 4) return Math.floor(count / 3);
    if (mode === 5 || mode === 6) return Math.max(0, count - 2);
    return 0;
  };
  const patchPrototype = (prototype) => {
    if (!prototype) return;
    const wrapDraw = (name, countIndex, instanceIndex) => {
      const original = prototype[name];
      if (!original) return;
      prototype[name] = function (...args) {
        audit.drawCalls += 1;
        const instances = instanceIndex === undefined ? 1 : Number(args[instanceIndex] ?? 1);
        audit.triangles += triangleCount(args[0], Number(args[countIndex] ?? 0)) * instances;
        return original.apply(this, args);
      };
    };
    wrapDraw("drawArrays", 2);
    wrapDraw("drawElements", 1);
    wrapDraw("drawArraysInstanced", 2, 3);
    wrapDraw("drawElementsInstanced", 1, 4);
    for (const [createName, deleteName, createdKey, deletedKey] of [
      ["createTexture", "deleteTexture", "texturesCreated", "texturesDeleted"],
      ["createBuffer", "deleteBuffer", "buffersCreated", "buffersDeleted"],
    ]) {
      const create = prototype[createName];
      if (create)
        prototype[createName] = function (...args) {
          audit[createdKey] += 1;
          return create.apply(this, args);
        };
      const remove = prototype[deleteName];
      if (remove)
        prototype[deleteName] = function (...args) {
          audit[deletedKey] += 1;
          return remove.apply(this, args);
        };
    }
  };
  patchPrototype(globalThis.WebGLRenderingContext?.prototype);
  patchPrototype(globalThis.WebGL2RenderingContext?.prototype);

  let frameDrawCalls = 0;
  let frameTriangles = 0;
  let priorDrawCalls = 0;
  let priorTriangles = 0;
  const originalRaf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) =>
    originalRaf((time) => {
      frameDrawCalls = audit.drawCalls - priorDrawCalls;
      frameTriangles = audit.triangles - priorTriangles;
      priorDrawCalls = audit.drawCalls;
      priorTriangles = audit.triangles;
      audit.frames.push({ time, drawCalls: frameDrawCalls, triangles: frameTriangles });
      if (audit.frames.length > 1_200) audit.frames.shift();
      callback(time);
    });
});

await page.goto(url, { waitUntil: "domcontentloaded" });
await page.evaluate((index) => {
  localStorage.clear();
  localStorage.setItem(
    "narrow-way-save-v2",
    JSON.stringify({
      state: {
        started: true,
        sceneIndex: index,
        stepIndex: 0,
        reducedMotion: false,
        cinematicCamera: true,
      },
      version: 9,
    }),
  );
}, sceneIndex);
const navigationStarted = performance.now();
await page.reload({ waitUntil: "domcontentloaded" });
try {
  await page.locator(".scene-loader").waitFor({ state: "hidden", timeout: 30_000 });
} catch (error) {
  const loaderCount = await page.locator(".scene-loader").count();
  console.error(
    JSON.stringify(
      {
        benchmarkStartupFailure: true,
        url: page.url(),
        runtimeErrors,
        canvasCount: await page.locator("canvas").count(),
        loaderCount,
        loaderText: loaderCount
          ? await page.locator(".scene-loader").textContent({ timeout: 1_000 })
          : null,
      },
      null,
      2,
    ),
  );
  throw error;
}
const sceneReadyMs = Math.round(performance.now() - navigationStarted);
await page.waitForTimeout(3_000);

const started = performance.now();
const fpsFrames = await page.evaluate(
  (duration) =>
    new Promise((resolve) => {
      const begin = performance.now();
      const frames = [];
      const tick = (time) => {
        frames.push(time);
        if (time - begin >= duration) resolve(frames);
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }),
  sampleMs,
);
const elapsedMs = performance.now() - started;

const metrics = await page.evaluate(({ elapsedMs, sceneReadyMs, sceneIndex, fpsFrameCount, mobile }) => {
  const audit = window.__pilgrimsWebGlAudit;
  const recent = audit.frames.filter((frame) => frame.time >= performance.now() - elapsedMs - 100);
  const nonZero = recent.filter((frame) => frame.drawCalls > 0);
  const mean = (values) =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const sortedCalls = nonZero.map((frame) => frame.drawCalls).sort((a, b) => a - b);
  const sortedTriangles = nonZero.map((frame) => frame.triangles).sort((a, b) => a - b);
  const percentile = (values, p) => values[Math.min(values.length - 1, Math.floor(values.length * p))] ?? 0;
  const canvas = document.querySelector("canvas");
  const gl = canvas?.getContext("webgl2") ?? canvas?.getContext("webgl");
  const resources = performance.getEntriesByType("resource");
  const memory = performance.memory;
  return {
    url: location.href,
    profile: mobile ? "mobile" : "desktop",
    sceneIndex,
    sceneTitle: document.querySelector(".chapter-title")?.textContent?.trim() ?? null,
    sceneReadyMs,
    sampleMs: Math.round(elapsedMs),
    fps: Number(((fpsFrameCount * 1000) / elapsedMs).toFixed(1)),
    frameSamples: fpsFrameCount,
    renderSamples: nonZero.length,
    drawCalls: {
      mean: Number(mean(nonZero.map((frame) => frame.drawCalls)).toFixed(1)),
      p95: percentile(sortedCalls, 0.95),
      max: sortedCalls.at(-1) ?? 0,
    },
    triangles: {
      mean: Math.round(mean(nonZero.map((frame) => frame.triangles))),
      p95: percentile(sortedTriangles, 0.95),
      max: sortedTriangles.at(-1) ?? 0,
    },
    gpu: gl
      ? {
          renderer: gl.getParameter(gl.RENDERER),
          version: gl.getParameter(gl.VERSION),
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          maxSamples: gl.getParameter(gl.MAX_SAMPLES),
        }
      : null,
    resources: {
      requests: resources.length,
      transferBytes: resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
      decodedBytes: resources.reduce((sum, entry) => sum + (entry.decodedBodySize || 0), 0),
    },
    heap: memory
      ? {
          usedBytes: memory.usedJSHeapSize,
          totalBytes: memory.totalJSHeapSize,
          limitBytes: memory.jsHeapSizeLimit,
        }
      : null,
    webglResources: {
      liveTextures: audit.texturesCreated - audit.texturesDeleted,
      liveBuffers: audit.buffersCreated - audit.buffersDeleted,
    },
  };
}, { elapsedMs, sceneReadyMs, sceneIndex, fpsFrameCount: fpsFrames.length, mobile });

if (process.env.PILGRIMS_SCREENSHOT)
  await page.screenshot({ path: process.env.PILGRIMS_SCREENSHOT, fullPage: true });
console.log(JSON.stringify(metrics, null, 2));
await browser.close();
