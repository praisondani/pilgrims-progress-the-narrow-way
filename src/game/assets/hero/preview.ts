import {
  ACESFilmicToneMapping,
  AmbientLight,
  CanvasTexture,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import { createPilgrimHero } from "./createHero";

const search = new URLSearchParams(location.search);
const burden = Math.max(0, Math.min(1, Number(search.get("burden") ?? 1)));
const equipped = search.get("equipped") === "1";
const angle = Number(search.get("angle") ?? -18);
const view = search.get("view") ?? "turntable";

document.documentElement.style.background = "#b8afa3";
document.body.style.margin = "0";
document.body.style.overflow = "hidden";

const renderer = new WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.setClearColor(new Color("#b8afa3"), 1);
document.body.append(renderer.domElement);

const scene = new Scene();
scene.background = new Color("#b8afa3");

const camera = new PerspectiveCamera(31, innerWidth / innerHeight, 0.1, 30);
if (view === "front") camera.position.set(0, 1.3, 4.25);
else if (view === "profile") camera.position.set(4.25, 1.3, 0);
else if (view === "back") camera.position.set(0, 1.3, -4.25);
else camera.position.set(3.05, 1.42, 4.45);
camera.lookAt(0, 1.02, 0);

const key = new DirectionalLight("#fff1db", 4.6);
key.position.set(3.5, 5.2, 4.4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -3;
key.shadow.camera.right = 3;
key.shadow.camera.top = 3;
key.shadow.camera.bottom = -3;
scene.add(key);

const rim = new DirectionalLight("#c8dcff", 2.2);
rim.position.set(-4, 3.2, -4);
scene.add(rim);
scene.add(new AmbientLight("#d6c7b8", 1.35));

const floorTexture = new CanvasTexture(
  Object.assign(document.createElement("canvas"), {
    width: 4,
    height: 4,
  }),
);
const floorContext = floorTexture.image.getContext("2d");
if (floorContext) {
  floorContext.fillStyle = "#918a80";
  floorContext.fillRect(0, 0, 4, 4);
}
floorTexture.colorSpace = SRGBColorSpace;
const floor = new Mesh(
  new PlaneGeometry(16, 16),
  new MeshStandardMaterial({
    color: "#918a80",
    map: floorTexture,
    roughness: 1,
  }),
);
floor.rotation.x = -Math.PI * 0.5;
floor.receiveShadow = true;
scene.add(floor);

const hero = createPilgrimHero({
  burden,
  equipped,
  hasRoll: !equipped,
  expression: burden > 0 ? "concerned" : "hopeful",
});
hero.root.rotation.y =
  view === "turntable" ? (angle * Math.PI) / 180 : 0;
scene.add(hero.root);
// Let the load settle before capturing the QA turntable so posture and burden
// contact are judged in the same state players see after the opening seconds.
for (let frame = 0; frame < 60; frame += 1)
  hero.update(0.016, {
    burden,
    equipped,
    hasRoll: !equipped,
    walking: false,
  });

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

renderer.render(scene, camera);
(window as typeof window & { __heroReady?: boolean }).__heroReady = true;
