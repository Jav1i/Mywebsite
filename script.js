// ===========================
// City Data
// ===========================
const BUILDINGS = [
  { id: 'about',     label: 'About Me',       style: 'cottage',   pos: [-10, 0, -5], wall: 0xf5e4c8, roof: 0xd27654, modal: 'modal-about' },
  { id: 'hsg',       label: 'University',     style: 'hsg',       pos: [  0, 0, -6], wall: 0xf8f7f2, roof: 0xaac4d4, modal: 'modal-hsg' },
  { id: 'microsoft', label: 'Microsoft',      style: 'microsoft', pos: [ 10, 0, -5], wall: 0xffffff, roof: 0xe8e8e8, modal: 'modal-microsoft' },
  { id: 'coding',    label: 'Coding Project', style: 'stacked',   pos: [-10, 0,  5], wall: 0xfaf7f0, roof: 0xf3c969, modal: 'modal-coding' },
  { id: 'badminton', label: 'Badminton',      style: 'badminton', pos: [  0, 0,  6], wall: 0xf3d5b8, roof: 0xc85a47, modal: 'modal-badminton' },
  { id: 'contact',   label: 'Contact',        style: 'cottage',   pos: [ 10, 0,  5], wall: 0xd8e5ca, roof: 0xdb9088, variant: 'L', modal: 'modal-contact' },
];

const COLORS = {
  ground: 0xe8e5dd,
  road: 0x35363a,       // dark asphalt
  roadEdge: 0xbfbcb5,   // sidewalk / curb
  roadLine: 0xf4f0d8,   // road markings
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

const asphaltMat = new THREE.MeshStandardMaterial({ color: COLORS.road, roughness: 1 });
const sidewalkMat = new THREE.MeshStandardMaterial({ color: COLORS.roadEdge, roughness: 1 });
const lineMat = new THREE.MeshStandardMaterial({ color: COLORS.roadLine, roughness: 0.85 });

function addRoad(w, d, x, z, withSidewalk = true) {
  // sidewalks slightly wider than the road, underneath
  if (withSidewalk) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.8, d + 0.8), sidewalkMat);
    sw.rotation.x = -Math.PI / 2;
    sw.position.set(x, 0.008, z);
    sw.receiveShadow = true;
    scene.add(sw);
  }

  const road = new THREE.Mesh(new THREE.PlaneGeometry(w, d), asphaltMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(x, 0.012, z);
  road.receiveShadow = true;
  scene.add(road);
}

function addDashedLine(length, x, z, axis /* 'x' or 'z' */) {
  const dashLen = 1.0, gap = 0.7;
  const step = dashLen + gap;
  const n = Math.max(1, Math.floor((length - gap) / step));
  const totalLen = n * dashLen + (n - 1) * gap;
  const startOff = -totalLen / 2 + dashLen / 2;
  const thickness = 0.12;

  for (let i = 0; i < n; i++) {
    const off = startOff + i * step;
    const dash = new THREE.Mesh(
      new THREE.PlaneGeometry(
        axis === 'x' ? dashLen : thickness,
        axis === 'x' ? thickness : dashLen
      ),
      lineMat
    );
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(
      x + (axis === 'x' ? off : 0),
      0.018,
      z + (axis === 'x' ? 0 : off)
    );
    scene.add(dash);
  }
}

function addCrosswalk(cx, cz, axis /* perpendicular to road */, span) {
  // stripes run perpendicular to road axis; "axis" arg is the road direction
  const stripeCount = 5;
  const stripeW = 0.28, gap = 0.2;
  const step = stripeW + gap;
  const totalLen = stripeCount * stripeW + (stripeCount - 1) * gap;
  const startOff = -totalLen / 2 + stripeW / 2;

  for (let i = 0; i < stripeCount; i++) {
    const off = startOff + i * step;
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(
        axis === 'x' ? stripeW : span,
        axis === 'x' ? span : stripeW
      ),
      lineMat
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(
      cx + (axis === 'x' ? off : 0),
      0.02,
      cz + (axis === 'x' ? 0 : off)
    );
    scene.add(stripe);
  }
}

// Main E-W road (between north and south building rows) with sidewalks
addRoad(32, 2, 0, 0);
// Side service roads past the building rows (no sidewalks so they read as lanes)
addRoad(30, 1.2, 0, -10, false);
addRoad(30, 1.2, 0,  10, false);

// Dashed center line on the main road (continuous)
addDashedLine(30, 0, 0, 'x');

// ===========================
// Buildings
// ===========================
const wallMat = new THREE.MeshStandardMaterial({ color: COLORS.wall, roughness: 0.8, metalness: 0 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0xb8cfdc, roughness: 0.25, metalness: 0.2 });
const darkMat  = new THREE.MeshStandardMaterial({ color: 0x3a4651, roughness: 0.4 });
const doorMat  = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 });
const stoneMat = new THREE.MeshStandardMaterial({ color: 0xeae6dd, roughness: 0.9 });
const pickables = [];

function castAll(group) {
  group.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
}

// ---- Cottage (About Me) ----
function makeCottage({ roofColor, wallColor, variant }) {
  const g = new THREE.Group();
  const wm = new THREE.MeshStandardMaterial({ color: wallColor ?? 0xffffff, roughness: 0.85 });
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.85 });

  // helper: add a chimney that sits correctly on a pyramid roof of the given geometry
  function addChimney(baseY, pyramidH, pyramidR, chimX, chimZ, size = 0.32) {
    const slope = pyramidH / (pyramidR / Math.SQRT2);
    const roofY = baseY + pyramidH - Math.max(Math.abs(chimX), Math.abs(chimZ)) * slope;
    const topY = baseY + pyramidH + 0.5;
    const bottomY = roofY - 0.3; // bury 0.3 into roof
    const chim = new THREE.Mesh(new THREE.BoxGeometry(size, topY - bottomY, size), stoneMat);
    chim.position.set(chimX, (bottomY + topY) / 2, chimZ);
    g.add(chim);
  }

  if (variant === 'L') {
    // ----- L-shaped cottage (extension points left, toward city center) -----
    const mw = 3.2, mh = 2.3, md = 2.6;
    const ew = 1.8, eh = 1.9, ed = 2.2;
    const extX = -(mw / 2 + ew / 2 - 0.05);  // left side
    const extZ = md / 2 - ed / 2;

    const main = new THREE.Mesh(new THREE.BoxGeometry(mw, mh, md), wm);
    main.position.set(0, mh / 2, 0);
    g.add(main);

    const ext = new THREE.Mesh(new THREE.BoxGeometry(ew, eh, ed), wm);
    ext.position.set(extX, eh / 2, extZ);
    g.add(ext);

    // main roof with big overhang
    const mainRoofH = 1.25;
    const mainRoofR = Math.max(mw, md) * 0.95;
    const mainRoof = new THREE.Mesh(new THREE.ConeGeometry(mainRoofR, mainRoofH, 4), roofMat);
    mainRoof.position.set(0, mh + mainRoofH / 2, 0);
    mainRoof.rotation.y = Math.PI / 4;
    g.add(mainRoof);

    // extension roof (smaller pyramid)
    const extRoofH = 0.85;
    const extRoofR = Math.max(ew, ed) * 0.95;
    const extRoof = new THREE.Mesh(new THREE.ConeGeometry(extRoofR, extRoofH, 4), roofMat);
    extRoof.position.set(extX, eh + extRoofH / 2, extZ);
    extRoof.rotation.y = Math.PI / 4;
    g.add(extRoof);

    addChimney(mh, mainRoofH, mainRoofR, 0.5, -0.4, 0.3);

    // door on main, offset to the side away from the extension
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.6, mh * 0.5, 0.06), doorMat);
    door.position.set(0.6, mh * 0.25, md / 2 + 0.02);
    g.add(door);

    // front step
    const step = new THREE.Mesh(new THREE.BoxGeometry(1, 0.12, 0.5), stoneMat);
    step.position.set(0.6, 0.06, md / 2 + 0.25);
    g.add(step);

    // windows on main + extension
    [{ x: -0.7, y: mh * 0.65, w: 0.55, h: 0.55, z: md / 2 + 0.02 },
     { x:  1.1, y: mh * 0.65, w: 0.45, h: 0.45, z: md / 2 + 0.02 },
     { x: extX, y: eh * 0.6,  w: 0.4,  h: 0.4,  z: extZ + ed / 2 + 0.02 },
     { x:  0,   y: mh * 0.65, w: 0.55, h: 0.55, z: -md / 2 - 0.02 }].forEach(w => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(w.w, w.h, 0.06), glassMat);
      win.position.set(w.x, w.y, w.z);
      g.add(win);
    });

    castAll(g);
    return g;
  }

  // ----- Default cottage: square footprint + dormer + awning -----
  const w = 3, h = 2.3, d = 3;

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wm);
  body.position.y = h / 2;
  g.add(body);

  // pitched roof with big overhang
  const roofH = 1.4;
  const roofR = Math.max(w, d) * 0.95;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(roofR, roofH, 4), roofMat);
  roof.position.y = h + roofH / 2;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);

  // dormer — small boxy protrusion from the front slope
  const dormerW = 0.9, dormerH = 0.65, dormerD = 0.5;
  const dormerZ = d / 2 - 0.15;
  const dormer = new THREE.Mesh(new THREE.BoxGeometry(dormerW, dormerH, dormerD), wm);
  dormer.position.set(0, h + 0.22, dormerZ);
  g.add(dormer);

  // dormer window
  const dormerWin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.38, 0.05), glassMat);
  dormerWin.position.set(0, h + 0.3, dormerZ + dormerD / 2 + 0.01);
  g.add(dormerWin);

  // small roof on the dormer
  const dormerRoofH = 0.38;
  const dormerRoof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(dormerW, dormerD) * 1.0, dormerRoofH, 4),
    roofMat
  );
  dormerRoof.position.set(0, h + dormerH + dormerRoofH / 2 - 0.05, dormerZ);
  dormerRoof.rotation.y = Math.PI / 4;
  g.add(dormerRoof);

  addChimney(h, roofH, roofR, 0.55, -0.4);

  // door + awning
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.55, h * 0.5, 0.06), doorMat);
  door.position.set(0, h * 0.25, d / 2 + 0.02);
  g.add(door);

  const awning = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.55), roofMat);
  awning.position.set(0, h * 0.58, d / 2 + 0.3);
  awning.rotation.x = 0.12;
  g.add(awning);
  [-0.52, 0.52].forEach(x => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, h * 0.5, 0.05), doorMat);
    post.position.set(x, h * 0.3, d / 2 + 0.52);
    g.add(post);
  });

  // front step
  const step = new THREE.Mesh(new THREE.BoxGeometry(1, 0.12, 0.45), stoneMat);
  step.position.set(0, 0.06, d / 2 + 0.23);
  g.add(step);

  // windows
  [-0.9, 0.9].forEach(x => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), glassMat);
    win.position.set(x, h * 0.65, d / 2 + 0.02);
    g.add(win);
  });

  castAll(g);
  return g;
}

// ---- HSG "The Square" — cascading stacked glass cubes ----
function makeHSG({ roofColor, wallColor }) {
  const g = new THREE.Group();

  const glassMatHSG = new THREE.MeshStandardMaterial({
    color: roofColor ?? 0xaac4d4, roughness: 0.15, metalness: 0.4
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: wallColor ?? 0xf8f7f2, roughness: 0.7
  });

  // Cascading volumes — each stacked on the previous with offsets
  const volumes = [
    { w: 5.5, h: 1.7, d: 4.4, x:  0.0, z:  0.3 },  // ground floor — widest
    { w: 4.3, h: 1.4, d: 3.6, x: -0.5, z: -0.4 },  // 2nd, offset back-left
    { w: 3.2, h: 1.2, d: 2.8, x:  0.6, z:  0.4 },  // 3rd, offset front-right
    { w: 2.2, h: 1.0, d: 2.0, x: -0.2, z: -0.1 },  // top
  ];

  let yBottom = 0;
  volumes.forEach((v, i) => {
    const glassH = v.h * 0.82;

    // glass body
    const body = new THREE.Mesh(new THREE.BoxGeometry(v.w, glassH, v.d), glassMatHSG);
    body.position.set(v.x, yBottom + glassH / 2, v.z);
    g.add(body);

    // white top slab (cap / floor slab for next level)
    const capH = v.h - glassH;
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(v.w + 0.2, capH, v.d + 0.2),
      frameMat
    );
    cap.position.set(v.x, yBottom + glassH + capH / 2, v.z);
    g.add(cap);

    // thin bottom edge slab (visible when this volume cantilevers over the one below)
    if (i > 0) {
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(v.w + 0.18, 0.08, v.d + 0.18),
        frameMat
      );
      base.position.set(v.x, yBottom + 0.04, v.z);
      g.add(base);
    }

    // horizontal mullion line mid-height of glass
    const mullion = new THREE.Mesh(
      new THREE.BoxGeometry(v.w + 0.02, 0.04, v.d + 0.02),
      frameMat
    );
    mullion.position.set(v.x, yBottom + glassH / 2, v.z);
    g.add(mullion);

    yBottom += v.h;
  });

  // ground-floor entrance (dark glass double doors + thin canopy)
  const v0 = volumes[0];
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.9), frameMat);
  canopy.position.set(v0.x, 1.15, v0.z + v0.d / 2 + 0.45);
  g.add(canopy);
  const doors = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.05), darkMat);
  doors.position.set(v0.x, 0.5, v0.z + v0.d / 2 + 0.02);
  g.add(doors);

  castAll(g);
  return g;
}

// ---- Microsoft HQ (varied massing: main block + setback top + side wing) ----
function makeMicrosoft({ roofColor }) {
  const g = new THREE.Group();
  const finMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
  const tintMat = new THREE.MeshStandardMaterial({ color: 0x9ec1d3, roughness: 0.2, metalness: 0.3 });

  // ---- side wing (ground-floor only, attached to the left) ----
  const wingW = 1.8, wingH = 1.3, wingD = 2.8;
  const wingX = -(4.8 / 2) - wingW / 2 + 0.05; // snug against main tower
  const wingBase = new THREE.Mesh(
    new THREE.BoxGeometry(wingW + 0.2, 0.25, wingD + 0.2), finMat
  );
  wingBase.position.set(wingX, 0.125, 0);
  g.add(wingBase);

  const wingGlass = new THREE.Mesh(
    new THREE.BoxGeometry(wingW, wingH * 0.85, wingD), tintMat
  );
  wingGlass.position.set(wingX, 0.25 + (wingH * 0.85) / 2, 0);
  g.add(wingGlass);

  const wingCap = new THREE.Mesh(
    new THREE.BoxGeometry(wingW + 0.2, wingH * 0.15, wingD + 0.2), finMat
  );
  wingCap.position.set(wingX, 0.25 + wingH * 0.85 + (wingH * 0.15) / 2, 0);
  g.add(wingCap);

  // ---- main block (2 glass floors + 1 setback top floor) ----
  const w = 4.8, d = 3.4;
  const floorH = 1.3;

  // ground slab
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.3, 0.3, d + 0.3), finMat
  );
  base.position.y = 0.15;
  g.add(base);

  // widths per floor: floor 0 = full, floor 1 = full, floor 2 = setback (narrower)
  const floorWidths = [
    { w: w, d: d },
    { w: w, d: d },
    { w: w * 0.7, d: d * 0.82 },
  ];

  let yBottom = 0.3;
  floorWidths.forEach(fw => {
    const glassH = floorH * 0.78;
    const finH = floorH * 0.22;
    const glass = new THREE.Mesh(new THREE.BoxGeometry(fw.w, glassH, fw.d), tintMat);
    glass.position.y = yBottom + glassH / 2;
    g.add(glass);

    const fin = new THREE.Mesh(new THREE.BoxGeometry(fw.w + 0.2, finH, fw.d + 0.2), finMat);
    fin.position.y = yBottom + glassH + finH / 2;
    g.add(fin);

    yBottom += floorH;
  });

  // rooftop parapet on the setback top
  const top = floorWidths[2];
  const parapet = new THREE.Mesh(
    new THREE.BoxGeometry(top.w + 0.25, 0.15, top.d + 0.25),
    new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.85 })
  );
  parapet.position.y = yBottom + 0.075;
  g.add(parapet);

  // rooftop terrace on the step created by the setback
  const terraceW = w - top.w;
  if (terraceW > 0.3) {
    const railingMat = new THREE.MeshStandardMaterial({ color: 0xd5d5d5, roughness: 0.4 });
    // tiny railing bar along the front of the step
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.1, 0.03, 0.03), railingMat
    );
    rail.position.set(0, 0.3 + 2 * floorH + 0.25, d / 2 - 0.05);
    g.add(rail);
  }

  // Microsoft logo on the front of the middle floor
  const logoColors = [0xf25022, 0x7fba00, 0x00a4ef, 0xffb900];
  const tileSize = 0.34;
  const gap = 0.04;
  const logoX0 = -(tileSize + gap) / 2;
  const logoY0 = 0.3 + 1 * floorH + 0.3;
  const tiles = [[0, 1], [1, 1], [0, 0], [1, 0]];
  tiles.forEach(([ix, iy], i) => {
    const sq = new THREE.Mesh(
      new THREE.BoxGeometry(tileSize, tileSize, 0.05),
      new THREE.MeshStandardMaterial({ color: logoColors[i], roughness: 0.55 })
    );
    sq.position.set(
      logoX0 + ix * (tileSize + gap),
      logoY0 + iy * (tileSize + gap),
      d / 2 + 0.03
    );
    g.add(sq);
  });

  // entrance overhang + glass doors
  const overhang = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.9), finMat);
  overhang.position.set(0, 1.2, d / 2 + 0.45);
  g.add(overhang);

  const doors = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.95, 0.06), tintMat);
  doors.position.set(0, 0.77, d / 2 + 0.02);
  g.add(doors);

  castAll(g);
  return g;
}

// ---- Stacked Cubes (Coding Project) — vivid accents ----
function makeStacked({ roofColor, wallColor }) {
  const g = new THREE.Group();
  const wm = new THREE.MeshStandardMaterial({ color: wallColor ?? 0xffffff, roughness: 0.85 });

  // base block (warm off-white)
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 3.2), wm);
  b1.position.y = 1.1;
  g.add(b1);

  // second block offset — teal accent wall
  const tealMat = new THREE.MeshStandardMaterial({ color: 0x4fa8a0, roughness: 0.8 });
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 2.4), tealMat);
  b2.position.set(-0.4, 2.2 + 0.9, 0.4);
  g.add(b2);

  // third accent cube (warm yellow from roofColor)
  const accent = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 1.3, 1.3),
    new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.75 })
  );
  accent.position.set(0.95, 2.2 + 0.65, -0.6);
  g.add(accent);

  // large glass panel on front of base
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.05), glassMat);
  glass.position.set(0, 1.1, 3.2 / 2 + 0.02);
  g.add(glass);

  // small skylight on second block
  const sky = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 1.2), glassMat);
  sky.position.set(-0.4, 2.2 + 1.8 + 0.025, 0.4);
  g.add(sky);

  // orange door for pop
  const orangeDoor = new THREE.MeshStandardMaterial({ color: 0xe08c3c, roughness: 0.7 });
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.2, 0.05), orangeDoor);
  door.position.set(1.1, 0.6, 3.2 / 2 + 0.03);
  g.add(door);

  castAll(g);
  return g;
}

// ---- Badminton (normal house + 3D racket on roof) ----
function makeBadminton({ roofColor, wallColor }) {
  const g = new THREE.Group();
  const w = 3.2, h = 2.4, d = 3.2;
  const wm = new THREE.MeshStandardMaterial({ color: wallColor ?? 0xffffff, roughness: 0.85 });

  // body
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wm);
  body.position.y = h / 2;
  g.add(body);

  // pitched roof with big overhang
  const roofH = 1.5;
  const roofR = Math.max(w, d) * 0.95;
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.85 });
  const roof = new THREE.Mesh(new THREE.ConeGeometry(roofR, roofH, 4), roofMat);
  roof.position.y = h + roofH / 2;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);

  // side garage/storage shed (lower, flat roof)
  const gw = 1.6, gh = 1.7, gd = 2.4;
  const gx = -w / 2 - gw / 2 + 0.05;
  const garage = new THREE.Mesh(new THREE.BoxGeometry(gw, gh, gd), wm);
  garage.position.set(gx, gh / 2, 0);
  g.add(garage);

  // flat roof slab over garage (slightly overhanging)
  const gRoof = new THREE.Mesh(
    new THREE.BoxGeometry(gw + 0.25, 0.12, gd + 0.25), roofMat
  );
  gRoof.position.set(gx, gh + 0.06, 0);
  g.add(gRoof);

  // garage door (wide, different color)
  const garageDoor = new THREE.Mesh(
    new THREE.BoxGeometry(gw * 0.75, gh * 0.7, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xe8e2d3, roughness: 0.75 })
  );
  garageDoor.position.set(gx, gh * 0.35, gd / 2 + 0.02);
  g.add(garageDoor);

  // door on main house
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.55, h * 0.5, 0.06), doorMat);
  door.position.set(0.4, h * 0.25, d / 2 + 0.02);
  g.add(door);

  // front step
  const step = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.45), stoneMat);
  step.position.set(0.4, 0.06, d / 2 + 0.23);
  g.add(step);

  // flanking windows
  [-0.8, 1.1].forEach(x => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.06), glassMat);
    win.position.set(x, h * 0.65, d / 2 + 0.02);
    g.add(win);
  });

  // ===== Badminton racket on roof =====
  // Built in local space with handle along +Y and head at top.
  // Head (torus) sits in the XY plane by default.
  const racket = new THREE.Group();

  const gripMat  = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.9 });
  const shaftMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.35, metalness: 0.4 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xd23440, roughness: 0.45, metalness: 0.2 });
  const stringMat = new THREE.MeshStandardMaterial({ color: 0xf7f7f2, roughness: 0.9 });

  // grip (handle)
  const gripH = 0.55;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, gripH, 14), gripMat);
  grip.position.y = gripH / 2;
  racket.add(grip);

  // end cap
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.05, 14), gripMat);
  cap.position.y = 0.025;
  racket.add(cap);

  // shaft
  const shaftH = 0.55;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, shaftH, 12), shaftMat);
  shaft.position.y = gripH + shaftH / 2;
  racket.add(shaft);

  // throat (small V connecting shaft to head) — tiny widening cylinder
  const throat = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.04, 0.18, 12), frameMat);
  throat.position.y = gripH + shaftH + 0.09;
  racket.add(throat);

  // head frame (torus, lying in XY plane so its face is toward +Z)
  const headR = 0.42;
  const headY = gripH + shaftH + 0.18 + headR;
  const head = new THREE.Mesh(new THREE.TorusGeometry(headR, 0.045, 10, 32), frameMat);
  head.position.y = headY;
  racket.add(head);

  // strings — vertical and horizontal across the head, chorded to the circle
  const stringThickness = 0.012;
  const stringDepth = 0.015;
  // vertical strings (span Y direction)
  const vCount = 6;
  for (let i = 1; i <= vCount; i++) {
    const x = -headR + (i * 2 * headR) / (vCount + 1);
    const half = Math.sqrt(Math.max(0, headR * headR - x * x));
    const s = new THREE.Mesh(
      new THREE.BoxGeometry(stringThickness, half * 2, stringDepth),
      stringMat
    );
    s.position.set(x, headY, 0);
    racket.add(s);
  }
  // horizontal strings (span X direction)
  const hCount = 7;
  for (let i = 1; i <= hCount; i++) {
    const yOff = -headR + (i * 2 * headR) / (hCount + 1);
    const half = Math.sqrt(Math.max(0, headR * headR - yOff * yOff));
    const s = new THREE.Mesh(
      new THREE.BoxGeometry(half * 2, stringThickness, stringDepth),
      stringMat
    );
    s.position.set(0, headY + yOff, 0);
    racket.add(s);
  }

  // perch racket on the roof peak, tilted back so the head face is visible from above
  racket.position.set(-0.1, h + roofH - 0.15, 0.1);
  racket.rotation.x = -Math.PI / 3.5;  // lean head toward camera
  racket.rotation.z = Math.PI / 10;    // slight side tilt for dynamism
  g.add(racket);

  castAll(g);
  return g;
}

const factories = {
  cottage:   makeCottage,
  hsg:       makeHSG,
  microsoft: makeMicrosoft,
  stacked:   makeStacked,
  badminton: makeBadminton,
};

BUILDINGS.forEach(cfg => {
  const factory = factories[cfg.style];
  const house = factory({ roofColor: cfg.roof, wallColor: cfg.wall, variant: cfg.variant });
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

// Trees placed clear of every road and every building footprint.
// Forbidden zones:
//   E-W main road + sidewalk: z ∈ [-1.4, 1.4]
//   Side roads: z ∈ [-10.6, -9.4] and [9.4, 10.6]
const treeSpots = [
  // west edge strip (x = -14, past About/Coding)
  [-14, -12], [-14, -7], [-14, -3], [-14, 3], [-14, 7], [-14, 12],
  // east edge strip (x = 14, past Microsoft/Contact)
  [14, -12], [14, -7], [14, -3], [14, 3], [14, 7], [14, 12],
  // along the north field (past side road)
  [-8, -13], [-4, -13], [0, -13], [4, -13], [8, -13],
  // along the south field (past side road)
  [-8, 13], [-4, 13], [0, 13], [4, 13], [8, 13],
];
treeSpots.forEach(([x, z]) => {
  const t = createTree();
  t.position.set(x, 0, z);
  t.rotation.y = Math.random() * Math.PI;
  scene.add(t);
});

// ===========================
// Car (parked on the E-W road)
// ===========================
function createCar(bodyColor = 0xd93838) {
  const g = new THREE.Group();

  const bodyMat   = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.45, metalness: 0.3 });
  const cabinMat  = new THREE.MeshStandardMaterial({ color: 0x2a3540, roughness: 0.3, metalness: 0.2 });
  const wheelMat  = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const lightMat  = new THREE.MeshStandardMaterial({ color: 0xffe9a8, roughness: 0.3, emissive: 0x332a10 });
  const bumperMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6, metalness: 0.4 });

  // chassis (long axis along X — car faces +X)
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 0.8), bodyMat);
  body.position.y = 0.32;
  g.add(body);

  // cabin (slightly back, narrower)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 0.72), cabinMat);
  cabin.position.set(-0.1, 0.65, 0);
  g.add(cabin);

  // windshield (tinted front slab)
  const wind = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.62), glassMat);
  wind.position.set(0.4, 0.65, 0);
  g.add(wind);
  // rear window
  const rear = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.62), glassMat);
  rear.position.set(-0.59, 0.65, 0);
  g.add(rear);

  // wheels
  const wheelR = 0.18, wheelW = 0.11;
  [[0.55, 0.42], [0.55, -0.42], [-0.55, 0.42], [-0.55, -0.42]].forEach(([x, z]) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(wheelR, wheelR, wheelW, 14), wheelMat
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, wheelR, z);
    g.add(wheel);
  });

  // headlights (front pair)
  [0.28, -0.28].forEach(z => {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.1), lightMat);
    light.position.set(0.86, 0.35, z);
    g.add(light);
  });

  // front bumper
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.75), bumperMat);
  bumper.position.set(0.83, 0.2, 0);
  g.add(bumper);

  castAll(g);
  return g;
}

// Place the car on the E-W road, right-hand lane (south), heading east
const car = createCar(0xd93838);
car.position.set(-4, 0, -0.5);
scene.add(car);

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
