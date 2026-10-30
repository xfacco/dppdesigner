import * as THREE from "three";
import { SUPPLY_CHAIN_NODES, SUPPLY_CHAIN_ARCS, SupplyChainNode } from "./data";

export interface GlobeSceneInstance {
  group: THREE.Group;
  update: (delta: number, time: number) => void;
  getClickableObjects: () => THREE.Object3D[];
  getNodeByObject: (obj: THREE.Object3D) => SupplyChainNode | null;
  highlightNode: (nodeId: string | null) => void;
  dispose: () => void;
}

// Convert latitude and longitude to 3D Cartesian coordinates on sphere of radius R
export function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Realistic continent detection for procedural dot grid
function isLand(lat: number, lon: number): boolean {
  // Approximate continent boundaries
  // North America
  if (lat > 15 && lat < 72 && lon > -168 && lon < -50) {
    if (lat < 30 && lon < -100) return true; // Mexico/Central America
    if (lat >= 30) return true;
  }
  // South America
  if (lat > -56 && lat < 13 && lon > -82 && lon < -34) return true;
  // Europe
  if (lat > 35 && lat < 71 && lon > -10 && lon < 45) return true;
  // Africa
  if (lat > -35 && lat < 37 && lon > -18 && lon < 52) return true;
  // Asia
  if (lat > 5 && lat < 75 && lon > 45 && lon < 150) return true;
  // India
  if (lat > 8 && lat < 32 && lon > 68 && lon < 90) return true;
  // Australia / Oceania
  if (lat > -44 && lat < -10 && lon > 112 && lon < 155) return true;
  // Japan / Indonesia
  if (lat > 30 && lat < 46 && lon > 129 && lon < 146) return true;
  if (lat > -11 && lat < 6 && lon > 95 && lon < 141) return true;
  return false;
}

export function createGlobeScene(isDark: boolean = true): GlobeSceneInstance {
  const group = new THREE.Group();
  const GLOBE_RADIUS = 2.2;
  const clickables: THREE.Mesh[] = [];
  const nodeMeshMap = new Map<THREE.Object3D, SupplyChainNode>();
  const nodeBeacons = new Map<string, { ring: THREE.Mesh; point: THREE.Mesh }>();

  // 1. Base Sphere (Ocean surface)
  const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.99, 64, 64);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: isDark ? 0x0a1420 : 0xe2e8f0,
    roughness: 0.8,
    metalness: 0.1,
    transparent: true,
    opacity: 0.92,
  });
  const baseSphere = new THREE.Mesh(sphereGeo, sphereMat);
  group.add(baseSphere);

  // 2. Continents Dot Cloud (Thousands of luminous discrete points on landmasses)
  const dotPoints: THREE.Vector3[] = [];
  const dotColors: number[] = [];
  const totalRays = 18000;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < totalRays; i++) {
    const theta = (2 * Math.PI * i) / goldenRatio;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / totalRays);
    const lat = 90 - (phi * 180) / Math.PI;
    const lon = ((theta * 180) / Math.PI) % 360 - 180;

    if (isLand(lat, lon)) {
      const pos = latLonToVector3(lat, lon, GLOBE_RADIUS);
      dotPoints.push(pos);
      // Subtle variations in green/cyan emerald hue
      if (Math.random() > 0.85) {
        dotColors.push(0.3, 0.9, 0.6); // highlight emerald
      } else {
        dotColors.push(isDark ? 0.12 : 0.25, isDark ? 0.65 : 0.45, isDark ? 0.38 : 0.3);
      }
    }
  }

  const dotGeo = new THREE.BufferGeometry().setFromPoints(dotPoints);
  dotGeo.setAttribute("color", new THREE.Float32BufferAttribute(dotColors, 3));
  const dotMat = new THREE.PointsMaterial({
    size: 0.042,
    vertexColors: true,
    transparent: true,
    opacity: isDark ? 0.95 : 0.85,
  });
  const continentDots = new THREE.Points(dotGeo, dotMat);
  group.add(continentDots);

  // 3. Grid Rings (Equator and Latitude/Longitude meridian circles)
  const gridGroup = new THREE.Group();
  const equatorGeo = new THREE.RingGeometry(GLOBE_RADIUS * 1.01, GLOBE_RADIUS * 1.015, 64);
  const gridMat = new THREE.MeshBasicMaterial({
    color: isDark ? 0x22c55e : 0x16a34a,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
  });
  const equator = new THREE.Mesh(equatorGeo, gridMat);
  equator.rotation.x = Math.PI / 2;
  gridGroup.add(equator);
  group.add(gridGroup);

  // 4. Atmospheric Glow (Custom outer Fresnel halo)
  const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.18, 48, 48);
  const haloMat = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform vec3 glowColor;
      void main() {
        float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
        gl_FragColor = vec4(glowColor, intensity * 0.45);
      }
    `,
    uniforms: {
      glowColor: { value: new THREE.Color(isDark ? 0x10b981 : 0x059669) },
    },
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
  });
  const atmosphere = new THREE.Mesh(haloGeo, haloMat);
  group.add(atmosphere);

  // 5. Supply Chain Nodes (Beacons on the Globe)
  const nodePositions = new Map<string, THREE.Vector3>();

  SUPPLY_CHAIN_NODES.forEach((node) => {
    const pos = latLonToVector3(node.lat, node.lon, GLOBE_RADIUS * 1.01);
    nodePositions.set(node.id, pos);

    // Clickable hit collider
    const colliderGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
    const collider = new THREE.Mesh(colliderGeo, colliderMat);
    collider.position.copy(pos);
    group.add(collider);
    clickables.push(collider);
    nodeMeshMap.set(collider, node);

    // Inner glowing sphere
    const pointGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const pointMat = new THREE.MeshBasicMaterial({
      color: node.role === "extraction" ? 0x38bdf8 : node.role === "processing" ? 0x34d399 : 0xf59e0b,
    });
    const pointMesh = new THREE.Mesh(pointGeo, pointMat);
    pointMesh.position.copy(pos);
    group.add(pointMesh);

    // Concentric Pulsing Ring
    const ringGeo = new THREE.RingGeometry(0.06, 0.08, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: node.role === "extraction" ? 0x38bdf8 : node.role === "processing" ? 0x34d399 : 0xf59e0b,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(pos.clone().multiplyScalar(1.002));
    ringMesh.lookAt(pos.clone().multiplyScalar(2)); // orient tangent to sphere surface
    group.add(ringMesh);

    nodeBeacons.set(node.id, { ring: ringMesh, point: pointMesh });
  });

  // 6. Glowing Bézier 3D Flow Arcs
  interface FlowArc {
    curve: THREE.CubicBezierCurve3;
    lineMesh: THREE.Line;
    sparks: THREE.Points;
    sparkOffsets: number[];
  }
  const flowArcs: FlowArc[] = [];

  SUPPLY_CHAIN_ARCS.forEach((arc) => {
    const pStart = nodePositions.get(arc.from);
    const pEnd = nodePositions.get(arc.to);
    if (!pStart || !pEnd) return;

    // Midpoint elevated above sphere
    const distance = pStart.distanceTo(pEnd);
    const midPoint = pStart.clone().add(pEnd).multiplyScalar(0.5);
    const elevation = Math.min(1.4, 0.35 + distance * 0.28);
    midPoint.normalize().multiplyScalar(GLOBE_RADIUS + elevation);

    // Smooth control points
    const cp1 = pStart.clone().lerp(midPoint, 0.55).normalize().multiplyScalar(GLOBE_RADIUS + elevation * 0.85);
    const cp2 = pEnd.clone().lerp(midPoint, 0.55).normalize().multiplyScalar(GLOBE_RADIUS + elevation * 0.85);

    const curve = new THREE.CubicBezierCurve3(pStart, cp1, cp2, pEnd);
    const points = curve.getPoints(64);

    // Arc Line
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(arc.color),
      transparent: true,
      opacity: 0.65,
      linewidth: 2,
    });
    const lineMesh = new THREE.Line(lineGeo, lineMat);
    group.add(lineMesh);

    // Animated Flow Sparks along Arc
    const sparkCount = 6;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    group.add(sparks);

    const sparkOffsets = Array.from({ length: sparkCount }, (_, i) => i / sparkCount);
    flowArcs.push({ curve, lineMesh, sparks, sparkOffsets });
  });

  // Update loop
  let activePulseTime = 0;
  const update = (delta: number, time: number) => {
    activePulseTime += delta;

    // Slow atmospheric/globe rotation
    group.rotation.y += delta * 0.08;

    // Pulse node rings
    nodeBeacons.forEach(({ ring }) => {
      const scale = 1.0 + Math.sin(activePulseTime * 3) * 0.45;
      ring.scale.set(scale, scale, 1);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.85 - (scale - 1.0) * 0.9;
    });

    // Animate flow sparks along 3D arcs
    flowArcs.forEach(({ curve, sparks, sparkOffsets }) => {
      const posAttr = sparks.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < sparkOffsets.length; i++) {
        sparkOffsets[i] = (sparkOffsets[i] + delta * 0.22) % 1.0;
        const pt = curve.getPointAt(sparkOffsets[i]);
        posAttr.setXYZ(i, pt.x, pt.y, pt.z);
      }
      posAttr.needsUpdate = true;
    });
  };

  const highlightNode = (nodeId: string | null) => {
    nodeBeacons.forEach(({ point, ring }, id) => {
      const isSelected = id === nodeId;
      point.scale.setScalar(isSelected ? 2.2 : 1.0);
      (point.material as THREE.MeshBasicMaterial).color.setHex(isSelected ? 0xffffff : 0x38bdf8);
    });
  };

  const dispose = () => {
    sphereGeo.dispose();
    sphereMat.dispose();
    dotGeo.dispose();
    dotMat.dispose();
    haloGeo.dispose();
    haloMat.dispose();
  };

  return {
    group,
    update,
    getClickableObjects: () => clickables,
    getNodeByObject: (obj: THREE.Object3D) => nodeMeshMap.get(obj) ?? null,
    highlightNode,
    dispose,
  };
}
