"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  SUPPLY_CHAIN_NODES,
  PRODUCT_PARTS,
  CIRCULAR_PHASES,
  SupplyChainNode,
  ProductPart,
  CircularPhase,
} from "./data";
import { createGlobeScene, GlobeSceneInstance } from "./globe-scene";
import { createProductScene, ProductSceneInstance } from "./product-scene";
import { createCircularScene, CircularSceneInstance } from "./circular-scene";
import { DppDrawer } from "./dpp-drawer";

// Register ScrollTrigger safely on client
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type SceneMode = "globe" | "product" | "circular";

interface DppInteractiveStageProps {
  initialMode?: SceneMode;
  className?: string;
}

export function DppInteractiveStage({
  initialMode = "globe",
  className = "",
}: DppInteractiveStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mode, setMode] = useState<SceneMode>(initialMode);
  const [explosion, setExplosion] = useState<number>(0.35);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);

  // Selected item states
  const [selectedNode, setSelectedNode] = useState<SupplyChainNode | null>(null);
  const [selectedPart, setSelectedPart] = useState<ProductPart | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<CircularPhase | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const globeInstanceRef = useRef<GlobeSceneInstance | null>(null);
  const productInstanceRef = useRef<ProductSceneInstance | null>(null);
  const circularInstanceRef = useRef<CircularSceneInstance | null>(null);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const previousPointerPositionRef = useRef({ x: 0, y: 0 });
  const pointerSpeedRef = useRef({ x: 0, y: 0 });
  const activeSceneGroupRef = useRef<THREE.Group | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const autoRotateRef = useRef(isAutoRotating);
  autoRotateRef.current = isAutoRotating;

  // Open drawer helper
  const handleSelectNode = useCallback((node: SupplyChainNode | null) => {
    setSelectedNode(node);
    setSelectedPart(null);
    setSelectedPhase(null);
    setIsDrawerOpen(!!node);
    globeInstanceRef.current?.highlightNode(node ? node.id : null);
  }, []);

  const handleSelectPart = useCallback((part: ProductPart | null) => {
    setSelectedPart(part);
    setSelectedNode(null);
    setSelectedPhase(null);
    setIsDrawerOpen(!!part);
    productInstanceRef.current?.highlightPart(part ? part.id : null);
  }, []);

  const handleSelectPhase = useCallback((phase: CircularPhase | null) => {
    setSelectedPhase(phase);
    setSelectedNode(null);
    setSelectedPart(null);
    setIsDrawerOpen(!!phase);
    circularInstanceRef.current?.highlightPhase(phase ? phase.id : null);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedNode(null);
    setSelectedPart(null);
    setSelectedPhase(null);
    globeInstanceRef.current?.highlightNode(null);
    productInstanceRef.current?.highlightPart(null);
    circularInstanceRef.current?.highlightPhase(null);
  }, []);

  // Update explosion factor
  const handleExplosionChange = useCallback((value: number) => {
    setExplosion(value);
    productInstanceRef.current?.setExplosionFactor(value);
  }, []);

  // Mode switcher helper
  const switchMode = useCallback(
    (newMode: SceneMode) => {
      setMode(newMode);
      handleCloseDrawer();

      if (!sceneRef.current || !cameraRef.current) return;

      const scene = sceneRef.current;
      const camera = cameraRef.current;

      // Animate camera position and switch visible scene
      if (newMode === "globe") {
        if (globeInstanceRef.current) {
          globeInstanceRef.current.group.visible = true;
          activeSceneGroupRef.current = globeInstanceRef.current.group;
        }
        if (productInstanceRef.current) productInstanceRef.current.group.visible = false;
        if (circularInstanceRef.current) circularInstanceRef.current.group.visible = false;

        gsap.to(camera.position, {
          x: 0,
          y: 0.5,
          z: 5.6,
          duration: 1.0,
          ease: "power2.inOut",
        });
      } else if (newMode === "product") {
        if (globeInstanceRef.current) globeInstanceRef.current.group.visible = false;
        if (productInstanceRef.current) {
          productInstanceRef.current.group.visible = true;
          activeSceneGroupRef.current = productInstanceRef.current.group;
        }
        if (circularInstanceRef.current) circularInstanceRef.current.group.visible = false;

        gsap.to(camera.position, {
          x: 0.8,
          y: 1.8,
          z: 5.8,
          duration: 1.0,
          ease: "power2.inOut",
        });
      } else if (newMode === "circular") {
        if (globeInstanceRef.current) globeInstanceRef.current.group.visible = false;
        if (productInstanceRef.current) productInstanceRef.current.group.visible = false;
        if (circularInstanceRef.current) {
          circularInstanceRef.current.group.visible = true;
          activeSceneGroupRef.current = circularInstanceRef.current.group;
        }

        gsap.to(camera.position, {
          x: 0,
          y: 1.2,
          z: 5.9,
          duration: 1.0,
          ease: "power2.inOut",
        });
      }
    },
    [handleCloseDrawer]
  );

  // Initialize Three.js WebGL scene
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const isDark =
      document.documentElement.dataset.theme === "dark" ||
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.5, 5.6);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.9 : 1.3);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, isDark ? 1.8 : 2.0);
    dirLight1.position.set(5, 8, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight2.position.set(-6, -4, -4);
    scene.add(dirLight2);

    // 5. Instantiate all 3 3D sub-scenes
    const globeScene = createGlobeScene(isDark);
    globeInstanceRef.current = globeScene;
    scene.add(globeScene.group);

    const productScene = createProductScene(isDark);
    productInstanceRef.current = productScene;
    productScene.group.visible = false;
    scene.add(productScene.group);

    const circularScene = createCircularScene(isDark);
    circularInstanceRef.current = circularScene;
    circularScene.group.visible = false;
    scene.add(circularScene.group);

    activeSceneGroupRef.current = globeScene.group;

    // 6. Resize handling
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 7. Raycasting for hover & click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getRaycastTargets = (): THREE.Object3D[] => {
      if (modeRef.current === "globe" && globeInstanceRef.current) {
        return globeInstanceRef.current.getClickableObjects();
      }
      if (modeRef.current === "product" && productInstanceRef.current) {
        return productInstanceRef.current.getClickableObjects();
      }
      if (modeRef.current === "circular" && circularInstanceRef.current) {
        return circularInstanceRef.current.getClickableObjects();
      }
      return [];
    };

    let pointerDownTime = 0;
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      pointerDownTime = performance.now();
      pointerDownPos = { x: e.clientX, y: e.clientY };
      previousPointerPositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Handle drag rotation
      if (isDraggingRef.current && activeSceneGroupRef.current) {
        const deltaX = e.clientX - previousPointerPositionRef.current.x;
        const deltaY = e.clientY - previousPointerPositionRef.current.y;

        pointerSpeedRef.current = { x: deltaX * 0.005, y: deltaY * 0.005 };
        activeSceneGroupRef.current.rotation.y += pointerSpeedRef.current.x;
        activeSceneGroupRef.current.rotation.x += pointerSpeedRef.current.y;

        previousPointerPositionRef.current = { x: e.clientX, y: e.clientY };
      } else {
        // Hover cursor check
        raycaster.setFromCamera(mouse, camera);
        const targets = getRaycastTargets();
        const intersects = raycaster.intersectObjects(targets, true);
        canvas.style.cursor = intersects.length > 0 ? "pointer" : "grab";
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      isDraggingRef.current = false;
      const duration = performance.now() - pointerDownTime;
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);

      // Simple Click check (short duration & small movement)
      if (duration < 280 && dist < 6) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const targets = getRaycastTargets();
        const intersects = raycaster.intersectObjects(targets, true);

        if (intersects.length > 0) {
          const hitObj = intersects[0].object;
          if (modeRef.current === "globe" && globeInstanceRef.current) {
            const node = globeInstanceRef.current.getNodeByObject(hitObj);
            if (node) handleSelectNode(node);
          } else if (modeRef.current === "product" && productInstanceRef.current) {
            const part = productInstanceRef.current.getPartByObject(hitObj);
            if (part) handleSelectPart(part);
          } else if (modeRef.current === "circular" && circularInstanceRef.current) {
            const phase = circularInstanceRef.current.getPhaseByObject(hitObj);
            if (phase) handleSelectPhase(phase);
          }
        }
      }
    };

    // Wheel event: in product mode, wheel smoothly expands/collapses the product
    const onWheel = (e: WheelEvent) => {
      if (modeRef.current === "product" && productInstanceRef.current) {
        e.preventDefault();
        const delta = e.deltaY * 0.0015;
        const current = productInstanceRef.current.getExplosionFactor();
        const next = Math.max(0, Math.min(1, current + delta));
        handleExplosionChange(next);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // 8. GSAP ScrollTrigger synchronization
    const scrollTrigger = ScrollTrigger.create({
      trigger: container,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        if (!isDraggingRef.current && activeSceneGroupRef.current) {
          // Subtle parallax rotation responding to scroll
          activeSceneGroupRef.current.rotation.y = self.progress * Math.PI * 0.8;
        }
      },
    });

    // 9. Animation render loop
    let clock = new THREE.Clock();
    let animationFrameId = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(0.1, clock.getDelta());
      const elapsed = clock.getElapsedTime();

      // Damping drag inertia
      if (!isDraggingRef.current && activeSceneGroupRef.current) {
        pointerSpeedRef.current.x *= 0.94;
        pointerSpeedRef.current.y *= 0.94;
        activeSceneGroupRef.current.rotation.y += pointerSpeedRef.current.x;
        activeSceneGroupRef.current.rotation.x += pointerSpeedRef.current.y;
      }

      // Update active sub-scenes
      if (globeInstanceRef.current && globeInstanceRef.current.group.visible) {
        globeInstanceRef.current.update(autoRotateRef.current ? delta : 0, elapsed);
      }
      if (productInstanceRef.current && productInstanceRef.current.group.visible) {
        productInstanceRef.current.update(autoRotateRef.current ? delta : 0, elapsed);
      }
      if (circularInstanceRef.current && circularInstanceRef.current.group.visible) {
        circularInstanceRef.current.update(delta, elapsed); // circular path photon always flows
      }

      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    animate();

    // 10. Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      scrollTrigger.kill();

      globeScene.dispose();
      productScene.dispose();
      circularScene.dispose();
      renderer.dispose();
    };
  }, [handleSelectNode, handleSelectPart, handleSelectPhase, handleExplosionChange]);

  // Reset camera view button
  const handleResetCamera = () => {
    if (activeSceneGroupRef.current) {
      gsap.to(activeSceneGroupRef.current.rotation, {
        x: 0,
        y: 0,
        z: 0,
        duration: 0.8,
        ease: "power2.out",
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[540px] md:h-[620px] rounded-2xl md:rounded-3xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden shadow-xl select-none ${className}`}
    >
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="h-full w-full block cursor-grab active:cursor-grabbing" />

      {/* Top Header Mode Selector Pills */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        <div className="flex items-center rounded-xl border border-border bg-background/80 p-1 backdrop-blur-md shadow-md pointer-events-auto">
          <button
            type="button"
            onClick={() => switchMode("globe")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              mode === "globe"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>Supply Chain Globe</span>
          </button>

          <button
            type="button"
            onClick={() => switchMode("product")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              mode === "product"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>Prodotto 3D Esploso</span>
          </button>

          <button
            type="button"
            onClick={() => switchMode("circular")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              mode === "circular"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
              <path d="M11 19h8.2a1.8 1.8 0 0 0 1.57-.88 1.8 1.8 0 0 0 0-1.78L17 10" />
              <path d="M15.5 3.3a1.8 1.8 0 0 0-1.57.88L9.5 12" />
            </svg>
            <span>Economia Circolare</span>
          </button>
        </div>

        {/* View Tools: Auto-Rotate & Reset */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`rounded-lg border border-border p-2 text-xs font-medium backdrop-blur-md transition-colors shadow-sm ${
              isAutoRotating ? "bg-background text-primary" : "bg-muted text-muted-foreground"
            }`}
            title={isAutoRotating ? "Pausa rotazione automatica" : "Avvia rotazione automatica"}
            aria-label="Toggle rotazione"
          >
            <svg className={`h-4 w-4 ${isAutoRotating ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            className="rounded-lg border border-border bg-background/80 p-2 text-xs text-muted-foreground backdrop-blur-md hover:text-foreground transition-colors shadow-sm"
            title="Reimposta angolazione"
            aria-label="Reimposta angolazione"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Floating Product Explode Slider (when in Product mode) */}
      {mode === "product" && (
        <div className="absolute top-18 left-4 z-20 rounded-xl border border-border bg-background/90 px-3.5 py-2.5 backdrop-blur-md shadow-lg pointer-events-auto max-w-[260px]">
          <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
            <span className="text-muted-foreground">Scomposizione 3D</span>
            <span className="text-primary font-mono">{Math.round(explosion * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={explosion}
            onChange={(e) => handleExplosionChange(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
            aria-label="Scomposizione modello 3D"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Assemblato</span>
            <span>Esploso</span>
          </div>
        </div>
      )}

      {/* Quick Node/Part Selector Pills at bottom left */}
      <div className="absolute bottom-12 left-4 z-20 hidden sm:flex items-center gap-1.5 pointer-events-auto">
        {mode === "globe" &&
          SUPPLY_CHAIN_NODES.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleSelectNode(n)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium border backdrop-blur-md transition-colors ${
                selectedNode?.id === n.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background/80 text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {n.city}
            </button>
          ))}

        {mode === "product" &&
          PRODUCT_PARTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelectPart(p)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium border backdrop-blur-md transition-colors ${
                selectedPart?.id === p.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background/80 text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {p.category.split("&")[0].trim()}
            </button>
          ))}

        {mode === "circular" &&
          CIRCULAR_PHASES.map((cp) => (
            <button
              key={cp.id}
              type="button"
              onClick={() => handleSelectPhase(cp)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium border backdrop-blur-md transition-colors ${
                selectedPhase?.id === cp.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background/80 text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              Fase {cp.phaseNumber}
            </button>
          ))}
      </div>

      {/* Bottom Hint Banner */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 px-3 py-1 text-[11px] text-muted-foreground backdrop-blur-md shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          {mode === "globe" && "Trascina per ruotare · Clicca su un nodo per impronta CO₂, certificazioni e audit"}
          {mode === "product" && "Ruota o muovi lo slider per esplodere · Clicca sulle componenti per riciclabilità e riparazione"}
          {mode === "circular" && "Tracciamento live del ciclo di vita · Clicca su una fase per la scheda tecnica ESPR"}
        </span>

        <span className="hidden md:inline-block font-mono text-[10px] text-muted-foreground/60">
          DPP 3D ENGINE · THREE.JS & WEBGL
        </span>
      </div>

      {/* Interactive Detail Drawer */}
      <DppDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        selectedNode={selectedNode}
        selectedPart={selectedPart}
        selectedPhase={selectedPhase}
      />
    </div>
  );
}
