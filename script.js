// ===========================
// City Data
// ===========================
const BUILDINGS = [
  { id: 'about',     label: 'About Me',         pos: [-6, 0, -4], size: [3, 3, 3],     roof: 0xf0c9c9, modal: 'modal-about' },
  { id: 'hsg',       label: 'University',       pos: [ 0, 0, -5], size: [4, 4.5, 3],   roof: 0xc3dbf2, modal: 'modal-hsg' },
  { id: 'microsoft', label: 'Microsoft',        pos: [ 6, 0, -4], size: [3.2, 5.5, 3.2], roof: 0xcce2cf, modal: 'modal-microsoft' },
  { id: 'coding',    label: 'Coding Project',   pos: [-5, 0,  5], size: [3, 2.5, 3],   roof: 0xf0e4c2, modal: 'modal-coding' },
  { id: 'badminton', label: 'Badminton',        pos: [ 0, 0,  5], size: [4, 2.8, 4],   roof: 0xd8cdef, modal: 'modal-badminton' },
  { id: 'contact',   label: 'Contact',          pos: [ 6, 0,  5], size: [3, 3.2, 3],   roof: 0xd2e1c0, modal: 'modal-contact' },
];

const COLORS = {
  ground: 0xf0efeb,
  road: 0xd9d7d2,
  wall: 0xffffff,
  trunk: 0xb8a58b,
  leaves: 0xcee0c2,
  sky: 0xf7f7f5,
};

// ===========================
// Scene Setup
// ===========================
const container = document.getElementById('scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.sky);
scene.fog = new THREE.Fog(COLORS.sky, 35, 70);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(16, 18, 16);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

// ===========================
// Lighting
// ===========================
scene.add(new THREE.AmbientLight(0xffffff, 0.55));

const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(12, 20, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -20;
sun.shadow.camera.right = 20;
sun.shadow.camera.top = 20;
sun.shadow.camera.bottom = -20;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 60;
sun.shadow.bias = -0.0005;
sun.shadow.radius = 4;
scene.add(sun);

const fill = new THREE.HemisphereLight(0xffffff, 0xdcdcd6, 0.35);
scene.add(fill);

// ===========================
// Ground + Roads
// ===========================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({ color: COLORS.ground, roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function addRoad(w, d, x, z) {
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color: COLORS.road, roughness: 1 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(x, 0.01, z);
  road.receiveShadow = true;
  scene.add(road);
}
addRoad(30, 2, 0, 0);       // east-west road
addRoad(2, 24, 0, 0);       // north-south road
addRoad(24, 1.2, 0, -8.5);  // side road north
addRoad(24, 1.2, 0,  8.5);  // side road south

// ===========================
// Buildings
// ===========================
const wallMat = new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.8, metalness: 0 });
const pickables = [];

function createHouse({ size, roofColor }) {
  const [w, h, d] = size;
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roofRadius = Math.max(w, d) * 0.72;
  const roofHeight = Math.min(w, d) * 0.55;
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.85 });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(roofRadius, roofHeight, 4), roofMat);
  roof.position.y = h + roofHeight / 2;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  // tiny window accent (small darker box pressed into the front)
  const winMat = new THREE.MeshStandardMaterial({ color: 0xd8e4ea, roughness: 0.3, metalness: 0.1 });
  const win = new THREE.Mesh(new THREE.BoxGeometry(w * 0.25, h * 0.2, 0.05), winMat);
  win.position.set(0, h * 0.55, d / 2 + 0.01);
  group.add(win);

  // door
  const doorMat = new THREE.MeshStandardMaterial({ color: 0xbfb6a8, roughness: 0.8 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(w * 0.22, h * 0.35, 0.05), doorMat);
  door.position.set(0, h * 0.175, d / 2 + 0.01);
  group.add(door);

  return group;
}

BUILDINGS.forEach(cfg => {
  const house = createHouse({ size: cfg.size, roofColor: cfg.roof });
  house.position.set(cfg.pos[0], 0, cfg.pos[2]);
  house.userData = { id: cfg.id, label: cfg.label, modal: cfg.modal, baseY: 0 };
  scene.add(house);
  pickables.push(house);
});

// ===========================
// Trees
// ===========================
function createTree() {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.15, 0.8, 8),
    new THREE.MeshStandardMaterial({ color: COLORS.trunk, roughness: 1 })
  );
  trunk.position.y = 0.4;
  trunk.castShadow = true;
  group.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.7, 0),
    new THREE.MeshStandardMaterial({ color: COLORS.leaves, roughness: 0.9, flatShading: true })
  );
  leaves.position.y = 1.15;
  leaves.castShadow = true;
  group.add(leaves);
  return group;
}

const treeSpots = [
  [-9, -1], [-9, 2], [9, -1], [9, 2],
  [-3, -8.5], [3, 8.5], [-8, 8], [8, -8],
  [-3, 0.5], [3, -0.5],
];
treeSpots.forEach(([x, z]) => {
  const t = createTree();
  t.position.set(x, 0, z);
  t.rotation.y = Math.random() * Math.PI;
  scene.add(t);
});

// ===========================
// Controls
// ===========================
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.enablePan = false;
controls.minDistance = 14;
controls.maxDistance = 35;
controls.minPolarAngle = Math.PI * 0.15;
controls.maxPolarAngle = Math.PI * 0.42;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;
controls.update();

// pause autorotate on interaction
['pointerdown', 'wheel', 'touchstart'].forEach(evt =>
  renderer.domElement.addEventListener(evt, () => { controls.autoRotate = false; }, { passive: true })
);

// ===========================
// Interaction: hover + click
// ===========================
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tooltip = document.getElementById('tooltip');
let hovered = null;

function setPointer(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function pick() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(pickables, true);
  if (!hits.length) return null;
  let obj = hits[0].object;
  while (obj.parent && !obj.userData.id) obj = obj.parent;
  return obj.userData.id ? obj : null;
}

window.addEventListener('pointermove', (e) => {
  setPointer(e);
  const found = pick();
  if (found !== hovered) {
    if (hovered) hovered.userData.targetY = 0;
    hovered = found;
    if (hovered) hovered.userData.targetY = 0.35;
  }
  if (hovered) {
    tooltip.hidden = false;
    tooltip.textContent = hovered.userData.label;
    tooltip.style.left = `${e.clientX}px`;
    tooltip.style.top = `${e.clientY}px`;
    document.body.style.cursor = 'pointer';
  } else {
    tooltip.hidden = true;
    document.body.style.cursor = 'default';
  }
});

window.addEventListener('pointerdown', (e) => {
  // ignore clicks on UI overlays
  if (e.target.closest('.topbar') || e.target.closest('.modal')) return;
  setPointer(e);
  const found = pick();
  if (found && found.userData.modal) {
    const dlg = document.getElementById(found.userData.modal);
    if (dlg && typeof dlg.showModal === 'function') dlg.showModal();
  }
});

// ===========================
// Modals
// ===========================
document.querySelectorAll('[data-open]').forEach(btn => {
  btn.addEventListener('click', () => {
    const dlg = document.getElementById(btn.dataset.open);
    if (dlg) dlg.showModal();
  });
});

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('dialog').close());
});

// click outside modal-content area closes it
document.querySelectorAll('dialog.modal').forEach(dlg => {
  dlg.addEventListener('click', (e) => {
    const r = dlg.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dlg.close();
  });
});

// ===========================
// Resize
// ===========================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===========================
// Animate
// ===========================
const clock = new THREE.Clock();

function animate() {
  const dt = clock.getDelta();

  // smooth hover lift
  pickables.forEach(b => {
    const target = b.userData.targetY ?? 0;
    b.position.y += (target - b.position.y) * Math.min(1, dt * 10);
  });

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

// hide loading overlay
requestAnimationFrame(() => {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
    setTimeout(() => loading.remove(), 500);
  }
});
