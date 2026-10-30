import * as THREE from "three";
import { PRODUCT_PARTS, ProductPart } from "./data";

export interface ProductSceneInstance {
  group: THREE.Group;
  update: (delta: number, time: number) => void;
  setExplosionFactor: (factor: number) => void;
  getExplosionFactor: () => number;
  getClickableObjects: () => THREE.Object3D[];
  getPartByObject: (obj: THREE.Object3D) => ProductPart | null;
  highlightPart: (partId: string | null) => void;
  dispose: () => void;
}

interface ComponentNode {
  part: ProductPart;
  group: THREE.Group;
  restPosition: THREE.Vector3;
  explodedPosition: THREE.Vector3;
  colliders: THREE.Object3D[];
  materials: THREE.Material[];
}

export function createProductScene(isDark: boolean = true): ProductSceneInstance {
  const rootGroup = new THREE.Group();
  let currentExplosion = 0.35; // Default partial explosion so it looks dynamic right away
  const clickables: THREE.Object3D[] = [];
  const partMap = new Map<THREE.Object3D, ProductPart>();
  const components: ComponentNode[] = [];

  // Reusable materials
  const aluminumMat = new THREE.MeshStandardMaterial({
    color: isDark ? 0x94a3b8 : 0xcbd5e1,
    metalness: 0.85,
    roughness: 0.25,
    envMapIntensity: 1.2,
  });

  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xcd7f32,
    metalness: 0.95,
    roughness: 0.2,
  });

  const pcbMat = new THREE.MeshStandardMaterial({
    color: isDark ? 0x064e3b : 0x047857,
    roughness: 0.5,
    metalness: 0.2,
  });

  const chipMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.4,
    metalness: 0.6,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.9,
    roughness: 0.3,
  });

  const cellMat = new THREE.MeshStandardMaterial({
    color: isDark ? 0x1e3a8a : 0x2563eb,
    metalness: 0.7,
    roughness: 0.3,
  });

  const coolingMat = new THREE.MeshStandardMaterial({
    color: isDark ? 0x334155 : 0x64748b,
    metalness: 0.6,
    roughness: 0.4,
  });

  // --- PART 1: Top Housing (Alluminio Riciclato) ---
  const housingGroup = new THREE.Group();
  const housingGeo = new THREE.BoxGeometry(3.6, 0.4, 2.4);
  const housingMesh = new THREE.Mesh(housingGeo, aluminumMat.clone());
  housingGroup.add(housingMesh);

  // DPP QR Plate on top of housing
  const plateGeo = new THREE.PlaneGeometry(0.7, 0.7);
  const plateMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  const plateMesh = new THREE.Mesh(plateGeo, plateMat);
  plateMesh.rotation.x = -Math.PI / 2;
  plateMesh.position.set(0, 0.205, 0);
  housingGroup.add(plateMesh);

  // QR decorative inner squares
  const qrInnerGeo = new THREE.PlaneGeometry(0.55, 0.55);
  const qrInnerMat = new THREE.MeshBasicMaterial({
    color: 0x0f172a,
    side: THREE.DoubleSide,
  });
  const qrInner = new THREE.Mesh(qrInnerGeo, qrInnerMat);
  qrInner.rotation.x = -Math.PI / 2;
  qrInner.position.set(0, 0.208, 0);
  housingGroup.add(qrInner);

  // Cooling fins on sides
  for (let i = -1.4; i <= 1.4; i += 0.35) {
    const finGeo = new THREE.BoxGeometry(0.08, 0.25, 2.42);
    const fin = new THREE.Mesh(finGeo, aluminumMat);
    fin.position.set(i, 0, 0);
    housingGroup.add(fin);
  }

  // --- PART 2: Smart BMS Circuit Board ---
  const bmsGroup = new THREE.Group();
  const bmsGeo = new THREE.BoxGeometry(3.2, 0.08, 2.0);
  const bmsMesh = new THREE.Mesh(bmsGeo, pcbMat.clone());
  bmsGroup.add(bmsMesh);

  // Microchips & Secure Element
  const cpuGeo = new THREE.BoxGeometry(0.65, 0.09, 0.65);
  const cpuMesh = new THREE.Mesh(cpuGeo, chipMat.clone());
  cpuMesh.position.set(-0.6, 0.06, 0);
  bmsGroup.add(cpuMesh);

  const seGeo = new THREE.BoxGeometry(0.35, 0.08, 0.35);
  const seMesh = new THREE.Mesh(seGeo, goldMat.clone());
  seMesh.position.set(0.4, 0.06, -0.4);
  bmsGroup.add(seMesh);

  // Status LEDs
  for (let i = 0; i < 3; i++) {
    const ledGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8);
    const ledMat = new THREE.MeshBasicMaterial({
      color: i === 0 ? 0x22c55e : i === 1 ? 0x38bdf8 : 0xec4899,
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0.8 + i * 0.2, 0.06, 0.6);
    bmsGroup.add(led);
  }

  // Gold connector pins
  const pinBarGeo = new THREE.BoxGeometry(1.6, 0.06, 0.12);
  const pinBar = new THREE.Mesh(pinBarGeo, goldMat);
  pinBar.position.set(0, 0.05, 0.9);
  bmsGroup.add(pinBar);

  // --- PART 3: LFP Battery Cell Array (8 Cells in 4x2 matrix) ---
  const cellsGroup = new THREE.Group();
  const cellWidth = 0.65;
  const cellHeight = 0.9;
  const cellDepth = 0.85;

  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const cellGeo = new THREE.BoxGeometry(cellWidth, cellHeight, cellDepth);
      const cellMesh = new THREE.Mesh(cellGeo, cellMat.clone());
      const x = (c - 1.5) * (cellWidth + 0.12);
      const z = (r - 0.5) * (cellDepth + 0.12);
      cellMesh.position.set(x, 0, z);
      cellsGroup.add(cellMesh);

      // Positive terminal (copper)
      const termPGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12);
      const termP = new THREE.Mesh(termPGeo, copperMat);
      termP.position.set(x - 0.18, cellHeight / 2 + 0.05, z);
      cellsGroup.add(termP);

      // Negative terminal (silver)
      const termNGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.1, 12);
      const termN = new THREE.Mesh(termNGeo, aluminumMat);
      termN.position.set(x + 0.18, cellHeight / 2 + 0.05, z);
      cellsGroup.add(termN);
    }
  }

  // --- PART 4: Thermal Cold Plate & Bio-Aerogel ---
  const coolingGroup = new THREE.Group();
  const coldPlateGeo = new THREE.BoxGeometry(3.5, 0.15, 2.3);
  const coldPlateMesh = new THREE.Mesh(coldPlateGeo, coolingMat.clone());
  coolingGroup.add(coldPlateMesh);

  // Fluid nozzles
  const nozzleGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.35, 12);
  const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
  const nozzle1 = new THREE.Mesh(nozzleGeo, nozzleMat);
  nozzle1.rotation.z = Math.PI / 2;
  nozzle1.position.set(1.9, 0, -0.6);
  coolingGroup.add(nozzle1);

  const nozzle2 = new THREE.Mesh(nozzleGeo, nozzleMat);
  nozzle2.rotation.z = Math.PI / 2;
  nozzle2.position.set(1.9, 0, 0.6);
  coolingGroup.add(nozzle2);

  // --- PART 5: Copper Busbars & Terminals ---
  const busbarsGroup = new THREE.Group();
  for (let c = 0; c < 3; c++) {
    const x = (c - 1) * 0.77;
    const busGeo = new THREE.BoxGeometry(0.5, 0.04, 0.12);
    const bus = new THREE.Mesh(busGeo, copperMat.clone());
    bus.position.set(x, 0, 0.45);
    busbarsGroup.add(bus);

    const bus2 = new THREE.Mesh(busGeo, copperMat.clone());
    bus2.position.set(x, 0, -0.45);
    busbarsGroup.add(bus2);
  }

  // Main battery terminals
  const mainTermGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.3, 16);
  const mainTermPos = new THREE.Mesh(mainTermGeo, copperMat);
  mainTermPos.position.set(-1.6, 0.1, 0.5);
  busbarsGroup.add(mainTermPos);

  const mainTermNeg = new THREE.Mesh(mainTermGeo, aluminumMat);
  mainTermNeg.position.set(-1.6, 0.1, -0.5);
  busbarsGroup.add(mainTermNeg);

  // Group mappings
  const rawGroups = [
    { part: PRODUCT_PARTS[0], group: housingGroup, restY: 0.7 },
    { part: PRODUCT_PARTS[1], group: bmsGroup, restY: 0.4 },
    { part: PRODUCT_PARTS[2], group: cellsGroup, restY: 0.0 },
    { part: PRODUCT_PARTS[3], group: coolingGroup, restY: -0.55 },
    { part: PRODUCT_PARTS[4], group: busbarsGroup, restY: -0.75 },
  ];

  rawGroups.forEach(({ part, group, restY }) => {
    const rest = new THREE.Vector3(0, restY, 0);
    const exploded = new THREE.Vector3(
      part.targetVector[0],
      restY + part.targetVector[1],
      part.targetVector[2]
    );

    // Bounding collider for raycasting
    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    box.getSize(size);
    const colliderGeo = new THREE.BoxGeometry(Math.max(1, size.x * 1.1), Math.max(0.4, size.y * 1.3), Math.max(1, size.z * 1.1));
    const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
    const collider = new THREE.Mesh(colliderGeo, colliderMat);
    group.add(collider);
    clickables.push(collider);
    partMap.set(collider, part);

    // Collect materials for hover emissive highlight
    const materials: THREE.Material[] = [];
    group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && (obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) materials.push(...mat);
        else materials.push(mat);
      }
    });

    rootGroup.add(group);
    components.push({
      part,
      group,
      restPosition: rest,
      explodedPosition: exploded,
      colliders: [collider],
      materials,
    });
  });

  const applyExplosion = (f: number) => {
    currentExplosion = Math.max(0, Math.min(1, f));
    components.forEach((c) => {
      c.group.position.lerpVectors(c.restPosition, c.explodedPosition, currentExplosion);
    });
  };

  applyExplosion(currentExplosion);

  const update = (delta: number) => {
    // Gentle rotation of the overall product assembly
    rootGroup.rotation.y += delta * 0.12;
  };

  const highlightPart = (partId: string | null) => {
    components.forEach(({ part, materials }) => {
      const isSelected = part.id === partId;
      materials.forEach((m) => {
        if ("emissive" in m && m.emissive instanceof THREE.Color) {
          if (isSelected) {
            m.emissive.setHex(0x22c55e);
            (m as THREE.MeshStandardMaterial).emissiveIntensity = 0.6;
          } else {
            m.emissive.setHex(0x000000);
            (m as THREE.MeshStandardMaterial).emissiveIntensity = 0;
          }
        }
      });
    });
  };

  const dispose = () => {
    aluminumMat.dispose();
    copperMat.dispose();
    pcbMat.dispose();
    chipMat.dispose();
    goldMat.dispose();
    cellMat.dispose();
    coolingMat.dispose();
  };

  return {
    group: rootGroup,
    update,
    setExplosionFactor: applyExplosion,
    getExplosionFactor: () => currentExplosion,
    getClickableObjects: () => clickables,
    getPartByObject: (obj: THREE.Object3D) => partMap.get(obj) ?? null,
    highlightPart,
    dispose,
  };
}
