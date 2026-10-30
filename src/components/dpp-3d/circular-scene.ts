import * as THREE from "three";
import { CIRCULAR_PHASES, CircularPhase } from "./data";

export interface CircularSceneInstance {
  group: THREE.Group;
  update: (delta: number, time: number) => void;
  getClickableObjects: () => THREE.Object3D[];
  getPhaseByObject: (obj: THREE.Object3D) => CircularPhase | null;
  highlightPhase: (phaseId: string | null) => void;
  dispose: () => void;
}

export function createCircularScene(isDark: boolean = true): CircularSceneInstance {
  const rootGroup = new THREE.Group();
  const clickables: THREE.Object3D[] = [];
  const phaseMap = new Map<THREE.Object3D, CircularPhase>();
  const phaseBeacons = new Map<string, { core: THREE.Mesh; halo: THREE.Mesh }>();

  const R = 2.4; // Major radius
  const width = 0.55; // Ribbon width
  const uSegments = 160;
  const vSegments = 16;

  // 1. Build 3D Möbius Ribbon Parametric Geometry
  const mobiusGeo = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  // Helper to compute Möbius point
  const getMobiusPoint = (u: number, v: number): THREE.Vector3 => {
    const halfU = u / 2;
    const x = (R + v * Math.cos(halfU)) * Math.cos(u);
    const y = (R + v * Math.cos(halfU)) * Math.sin(u);
    const z = v * Math.sin(halfU);
    return new THREE.Vector3(x, y, z);
  };

  // Generate vertices
  for (let i = 0; i <= uSegments; i++) {
    const u = (i / uSegments) * Math.PI * 2;
    for (let j = 0; j <= vSegments; j++) {
      const v = (j / vSegments - 0.5) * width;
      const pt = getMobiusPoint(u, v);
      positions.push(pt.x, pt.y, pt.z);

      // Tangents for normal computation
      const eps = 0.001;
      const ptU = getMobiusPoint(u + eps, v);
      const ptV = getMobiusPoint(u, v + eps);
      const tu = ptU.sub(pt).normalize();
      const tv = ptV.sub(pt).normalize();
      const n = new THREE.Vector3().crossVectors(tu, tv).normalize();
      normals.push(n.x, n.y, n.z);

      uvs.push(i / uSegments, j / vSegments);

      // Shimmering color palette cycling through green -> cyan -> blue -> purple -> pink -> green
      const t = i / uSegments;
      const r = Math.sin(t * Math.PI * 2) * 0.3 + 0.3;
      const g = Math.sin(t * Math.PI * 2 + 2) * 0.4 + 0.5;
      const b = Math.sin(t * Math.PI * 2 + 4) * 0.3 + 0.6;
      colors.push(r, g, b);
    }
  }

  // Generate faces
  for (let i = 0; i < uSegments; i++) {
    for (let j = 0; j < vSegments; j++) {
      const a = i * (vSegments + 1) + j;
      const b = (i + 1) * (vSegments + 1) + j;
      const c = (i + 1) * (vSegments + 1) + (j + 1);
      const d = i * (vSegments + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  mobiusGeo.setIndex(indices);
  mobiusGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  mobiusGeo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  mobiusGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  mobiusGeo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const mobiusMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    metalness: 0.6,
    roughness: 0.3,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: isDark ? 0.88 : 0.95,
  });

  const mobiusMesh = new THREE.Mesh(mobiusGeo, mobiusMat);
  rootGroup.add(mobiusMesh);

  // Wireframe accent edges
  const wireMat = new THREE.MeshBasicMaterial({
    color: isDark ? 0x22c55e : 0x16a34a,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  });
  const wireMesh = new THREE.Mesh(mobiusGeo, wireMat);
  rootGroup.add(wireMesh);

  // 2. Dynamic 5 Phase Nodes along the loop
  CIRCULAR_PHASES.forEach((phase) => {
    const pt = getMobiusPoint(phase.uParam, 0);

    // Hit collider
    const colliderGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
    const collider = new THREE.Mesh(colliderGeo, colliderMat);
    collider.position.copy(pt);
    rootGroup.add(collider);
    clickables.push(collider);
    phaseMap.set(collider, phase);

    // Inner glowing core
    const coreGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(phase.color),
      emissive: new THREE.Color(phase.color),
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.4,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.copy(pt);
    rootGroup.add(coreMesh);

    // Translucent glass outer ring
    const haloGeo = new THREE.TorusGeometry(0.22, 0.025, 12, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(phase.color),
      transparent: true,
      opacity: 0.75,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.copy(pt);
    haloMesh.lookAt(0, 0, 0);
    rootGroup.add(haloMesh);

    phaseBeacons.set(phase.id, { core: coreMesh, halo: haloMesh });
  });

  // 3. Tracciamento Live: Traveling Light Photon along the continuous Möbius curve
  let currentU = 0;
  const photonLight = new THREE.PointLight(0x38bdf8, 3.5, 4.5);
  rootGroup.add(photonLight);

  const photonGeo = new THREE.SphereGeometry(0.1, 16, 16);
  const photonMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });
  const photonMesh = new THREE.Mesh(photonGeo, photonMat);
  rootGroup.add(photonMesh);

  // Trailing sparks/particles behind the photon
  const trailCount = 14;
  const trailPositions = new Float32Array(trailCount * 3);
  const trailColors = new Float32Array(trailCount * 3);
  for (let i = 0; i < trailCount; i++) {
    const fade = 1 - i / trailCount;
    trailColors[i * 3] = 0.2 * fade;
    trailColors[i * 3 + 1] = 0.9 * fade;
    trailColors[i * 3 + 2] = 1.0 * fade;
  }
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
  trailGeo.setAttribute("color", new THREE.BufferAttribute(trailColors, 3));
  const trailMat = new THREE.PointsMaterial({
    size: 0.09,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  const trailParticles = new THREE.Points(trailGeo, trailMat);
  rootGroup.add(trailParticles);

  // Surrounding ambient floating star dust
  const dustCount = 80;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rad = R + (Math.random() - 0.5) * 1.4;
    dustPos[i * 3] = Math.cos(angle) * rad;
    dustPos[i * 3 + 1] = Math.sin(angle) * rad;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
  }
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: isDark ? 0x34d399 : 0x10b981,
    size: 0.04,
    transparent: true,
    opacity: 0.5,
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  rootGroup.add(dustPoints);

  // Update loop
  let pulseTime = 0;
  const update = (delta: number) => {
    pulseTime += delta;

    // Slow 3D precession tilt of the whole circular system
    rootGroup.rotation.x = Math.sin(pulseTime * 0.35) * 0.25;
    rootGroup.rotation.y += delta * 0.15;
    rootGroup.rotation.z = Math.cos(pulseTime * 0.25) * 0.15;

    // Advance traveling photon along Möbius strip (needs 4*PI to complete two-sided loop)
    currentU = (currentU + delta * 0.9) % (Math.PI * 4);
    const photonPos = getMobiusPoint(currentU, 0);
    photonMesh.position.copy(photonPos);
    photonLight.position.copy(photonPos);

    // Update trail
    const posAttr = trailParticles.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < trailCount; i++) {
      const lagU = currentU - (i + 1) * 0.04;
      const pt = getMobiusPoint(lagU, 0);
      posAttr.setXYZ(i, pt.x, pt.y, pt.z);
    }
    posAttr.needsUpdate = true;

    // Pulse phase halos
    phaseBeacons.forEach(({ halo }, id) => {
      const p = CIRCULAR_PHASES.find((cp) => cp.id === id);
      if (p) {
        const distToPhoton = Math.abs((currentU % (Math.PI * 2)) - p.uParam);
        const isNear = distToPhoton < 0.4 || distToPhoton > Math.PI * 2 - 0.4;
        const scale = isNear ? 1.4 + Math.sin(pulseTime * 8) * 0.2 : 1.0;
        halo.scale.set(scale, scale, scale);
      }
    });
  };

  const highlightPhase = (phaseId: string | null) => {
    phaseBeacons.forEach(({ core, halo }, id) => {
      const isSelected = id === phaseId;
      core.scale.setScalar(isSelected ? 2.0 : 1.0);
      (halo.material as THREE.MeshBasicMaterial).opacity = isSelected ? 1.0 : 0.75;
    });
  };

  const dispose = () => {
    mobiusGeo.dispose();
    mobiusMat.dispose();
    wireMat.dispose();
    trailGeo.dispose();
    trailMat.dispose();
    dustGeo.dispose();
    dustMat.dispose();
  };

  return {
    group: rootGroup,
    update,
    getClickableObjects: () => clickables,
    getPhaseByObject: (obj: THREE.Object3D) => phaseMap.get(obj) ?? null,
    highlightPhase,
    dispose,
  };
}
