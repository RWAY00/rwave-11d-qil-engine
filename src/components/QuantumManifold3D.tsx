import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCw,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Layers,
  Info,
  Compass,
  Atom,
} from 'lucide-react';
import { QILComputationResult } from '../types';
import { DIMENSION_METADATA } from '../lib/quantumEngine';

interface QuantumManifold3DProps {
  computation: QILComputationResult;
  language: 'en' | 'hi';
  onInspectDimension?: (dimIndex: number) => void;
  className?: string;
  riskOverlayEnabled?: boolean;
  thresholdHigh?: number;
  thresholdLow?: number;
}

type ManifoldGeometryType = 'calabi_yau' | 'torus' | 'geodesic';

export const QuantumManifold3D: React.FC<QuantumManifold3DProps> = ({
  computation,
  language,
  onInspectDimension,
  className = '',
  riskOverlayEnabled = true,
  thresholdHigh = 0.90,
  thresholdLow = 0.10,
}) => {
  const isHi = language === 'hi';
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // User interactive state
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.008);
  const [manifoldType, setManifoldType] = useState<ManifoldGeometryType>('calabi_yau');
  const [showWireframe, setShowWireframe] = useState<boolean>(true);
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [hoveredDim, setHoveredDim] = useState<number | null>(null);
  const [selectedDim, setSelectedDim] = useState<number | null>(null);

  // Real-time Risk Assessment map (Dimensions outside safe operational bounds)
  const breachedDimMap = useMemo(() => {
    const map = new Map<number, { type: 'HIGH' | 'LOW'; value: number }>();
    if (!riskOverlayEnabled) return map;

    const vector = computation.paddedStateVector;
    vector.forEach((val, idx) => {
      if (val > thresholdHigh) {
        map.set(idx, { type: 'HIGH', value: val });
      } else if (val < thresholdLow) {
        map.set(idx, { type: 'LOW', value: val });
      }
    });
    return map;
  }, [computation.paddedStateVector, riskOverlayEnabled, thresholdHigh, thresholdLow]);

  const breachedDimMapRef = useRef(breachedDimMap);
  useEffect(() => {
    breachedDimMapRef.current = breachedDimMap;
  }, [breachedDimMap]);

  // References for Three.js objects to avoid re-instantiating the renderer on every state change
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const manifoldMeshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.LineSegments | null>(null);
  const nodesGroupRef = useRef<THREE.Group | null>(null);
  const linesGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const rotationGroupRef = useRef<THREE.Group | null>(null);
  const crimsonLightRef = useRef<THREE.PointLight | null>(null);

  // Interaction tracking (mouse drag rotation & zoom)
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const zoomLevelRef = useRef(26);
  const targetRotationRef = useRef({ x: 0.3, y: 0.5 });
  const currentRotationRef = useRef({ x: 0.3, y: 0.5 });

  const { normalizedOutput, phaseAngles, hermitianError } = computation;

  // Maximum dimension
  const peakDimIndex = useMemo(() => {
    let maxIdx = 0;
    let maxVal = -1;
    normalizedOutput.forEach((v, i) => {
      if (v > maxVal) {
        maxVal = v;
        maxIdx = i;
      }
    });
    return maxIdx;
  }, [normalizedOutput]);

  // Generate 11 3D canonical positions around manifold
  const dimensionNodePositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio for even sphere distribution

    for (let i = 0; i < 11; i++) {
      // Archimedean / Fibonacci spiral on sphere radius R ~ 10-12
      const theta = (2 * Math.PI * i) / phi;
      const y = 1 - (i / 10) * 2; // from 1 to -1
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      // Modulate radius by normalized 11D amplitude
      const val = normalizedOutput[i] ?? 0.09;
      const r = 10 + val * 20; // expands with higher resonance
      positions.push(new THREE.Vector3(x * r, y * r, z * r));
    }
    return positions;
  }, [normalizedOutput]);

  // Main Three.js setup and render loop
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 350;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = zoomLevelRef.current;
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and alpha transparency
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00f2ff, 2.5, 60);
    pointLight1.position.set(15, 20, 20);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x7000ff, 2.0, 60);
    pointLight2.position.set(-20, -15, -15);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0x10b981, 1.5, 50);
    pointLight3.position.set(0, -20, 15);
    scene.add(pointLight3);

    // Pulsating Crimson Alert Light for real-time risk breaches
    const crimsonLight = new THREE.PointLight(0xff003c, 0, 80);
    crimsonLight.position.set(0, 0, 0);
    scene.add(crimsonLight);
    crimsonLightRef.current = crimsonLight;

    // 5. Main Root Rotation Group
    const rotationGroup = new THREE.Group();
    rotationGroup.rotation.x = currentRotationRef.current.x;
    rotationGroup.rotation.y = currentRotationRef.current.y;
    scene.add(rotationGroup);
    rotationGroupRef.current = rotationGroup;

    // 6. Raycaster & Mouse tracking for 3D Node picking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    // 7. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Auto-rotation when not dragging
      if (isRotating && !isDraggingRef.current) {
        targetRotationRef.current.y += rotationSpeed;
        targetRotationRef.current.x += rotationSpeed * 0.3;
      }

      // Smooth interpolation (slerp-like dampening)
      currentRotationRef.current.x += (targetRotationRef.current.x - currentRotationRef.current.x) * 0.1;
      currentRotationRef.current.y += (targetRotationRef.current.y - currentRotationRef.current.y) * 0.1;

      if (rotationGroupRef.current) {
        rotationGroupRef.current.rotation.x = currentRotationRef.current.x;
        rotationGroupRef.current.rotation.y = currentRotationRef.current.y;
      }

      // Smooth Camera Zoom
      if (cameraRef.current) {
        cameraRef.current.position.z += (zoomLevelRef.current - cameraRef.current.position.z) * 0.1;
      }

      // Dynamic vertex wave oscillations for Calabi-Yau / Manifold surface
      if (manifoldMeshRef.current && manifoldType === 'calabi_yau') {
        const geometry = manifoldMeshRef.current.geometry as THREE.BufferGeometry;
        const posAttr = geometry.attributes.position;
        if (posAttr) {
          const originalPos = (geometry as any)._originalPositions;
          if (originalPos) {
            const count = posAttr.count;
            for (let i = 0; i < count; i++) {
              const ox = originalPos[i * 3];
              const oy = originalPos[i * 3 + 1];
              const oz = originalPos[i * 3 + 2];
              const dist = Math.sqrt(ox * ox + oy * oy + oz * oz);

              // 11 harmonic wave pulses derived from normalized 11D coordinates
              let displacement = 0;
              for (let k = 0; k < 11; k++) {
                const amp = normalizedOutput[k] ?? 0.08;
                const phase = phaseAngles[k] ?? 0;
                displacement += amp * Math.sin(dist * (k + 1) * 0.3 - elapsedTime * 2.2 + phase);
              }

              const scale = 1 + displacement * 0.25;
              posAttr.setXYZ(i, ox * scale, oy * scale, oz * scale);
            }
            posAttr.needsUpdate = true;
          }
        }
      }

      // Animate orbital quantum particles
      if (particlesRef.current) {
        particlesRef.current.rotation.y = -elapsedTime * 0.15;
        particlesRef.current.rotation.z = elapsedTime * 0.08;
      }

      // Dynamic pulsating crimson alert light when dimensions breach safety thresholds
      if (crimsonLightRef.current) {
        if (breachedDimMapRef.current.size > 0) {
          crimsonLightRef.current.intensity = 3.2 + Math.sin(elapsedTime * 7.5) * 2.0;
        } else {
          crimsonLightRef.current.intensity = 0;
        }
      }

      // Animate node pulsating scale
      if (nodesGroupRef.current) {
        nodesGroupRef.current.children.forEach((child: any) => {
          const idx = child.dimIndex;
          if (idx !== undefined) {
            const isBreached = breachedDimMapRef.current.has(idx);
            const isPeak = idx === peakDimIndex;
            const hoverBoost = hoveredDim === idx ? 1.5 : 1.0;

            if (isBreached) {
              // Rapid heartbeat pulsating crimson effect
              const crimsonPulse = 1 + Math.sin(elapsedTime * 7.5) * 0.35;
              child.scale.setScalar(crimsonPulse * 1.35 * hoverBoost);
            } else {
              const baseScale = 1 + Math.sin(elapsedTime * 3 + idx) * 0.12;
              child.scale.setScalar(baseScale * (isPeak ? 1.3 : 1.0) * hoverBoost);
            }
          } else if (child.isCrimsonHalo) {
            const haloPulse = 1 + Math.sin(elapsedTime * 7.5) * 0.38;
            child.scale.setScalar(haloPulse);
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize observer
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        cameraRef.current.aspect = newWidth / newHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newWidth, newHeight);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.clear();
    };
  }, []); // Run once for base canvas setup

  // Build / update 3D Manifold geometries when computation or manifoldType changes
  useEffect(() => {
    if (!rotationGroupRef.current || !sceneRef.current) return;

    const group = rotationGroupRef.current;

    // Clear previous dynamic meshes
    while (group.children.length > 0) {
      const obj = group.children[0];
      if ((obj as any).geometry) (obj as any).geometry.dispose();
      if ((obj as any).material) {
        if (Array.isArray((obj as any).material)) {
          (obj as any).material.forEach((m: any) => m.dispose());
        } else {
          (obj as any).material.dispose();
        }
      }
      group.remove(obj);
    }

    // A. Manifold Surface Mesh
    let manifoldGeom: THREE.BufferGeometry;

    if (manifoldType === 'calabi_yau') {
      // High-resolution icosphere for harmonic ripple deformation
      manifoldGeom = new THREE.IcosahedronGeometry(8.5, 4);
    } else if (manifoldType === 'torus') {
      // 4D Clifford Torus projection into 3D
      manifoldGeom = new THREE.TorusGeometry(8.0, 3.2, 32, 64);
    } else {
      // Geodesic Polyhedron (Dodecahedron / 11D Vertex Hull)
      manifoldGeom = new THREE.DodecahedronGeometry(8.5, 2);
    }

    // Cache original positions for dynamic vertex displacement
    const posAttr = manifoldGeom.attributes.position;
    const originalPos = new Float32Array(posAttr.array.length);
    originalPos.set(posAttr.array);
    (manifoldGeom as any)._originalPositions = originalPos;

    // Semi-translucent quantum shader/standard material
    const manifoldMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x002447),
      emissive: new THREE.Color(0x001428),
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.45,
      transmission: 0.6,
      ior: 1.5,
      depthWrite: false,
    });

    const manifoldMesh = new THREE.Mesh(manifoldGeom, manifoldMat);
    group.add(manifoldMesh);
    manifoldMeshRef.current = manifoldMesh;

    // B. Wireframe Overlay with Neon Glow
    if (showWireframe) {
      const wireframeGeom = new THREE.WireframeGeometry(manifoldGeom);
      const wireframeMat = new THREE.LineBasicMaterial({
        color: manifoldType === 'torus' ? 0xa855f7 : 0x00f2ff,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
      });
      const wireframeMesh = new THREE.LineSegments(wireframeGeom, wireframeMat);
      group.add(wireframeMesh);
      wireframeMeshRef.current = wireframeMesh;
    }

    // C. 11 Dimension Quantum Resonance Nodes in 3D
    const nodesGroup = new THREE.Group();
    nodesGroupRef.current = nodesGroup;

    dimensionNodePositions.forEach((pos, idx) => {
      const val = normalizedOutput[idx] ?? 0.08;
      const isPeak = idx === peakDimIndex;
      const isBreached = breachedDimMap.has(idx);

      // Outer glowing orb (intense crimson if breached)
      const nodeGeom = new THREE.SphereGeometry(isBreached ? 0.85 : isPeak ? 0.75 : 0.5, 16, 16);
      const nodeColor = isBreached
        ? new THREE.Color(0xff003c) // Intense pulsating crimson
        : isPeak
        ? new THREE.Color(0x00f2ff)
        : idx % 3 === 0
        ? new THREE.Color(0x10b981)
        : idx % 2 === 0
        ? new THREE.Color(0xa855f7)
        : new THREE.Color(0x38bdf8);

      const nodeMat = new THREE.MeshStandardMaterial({
        color: nodeColor,
        emissive: nodeColor,
        emissiveIntensity: isBreached ? 2.8 : isPeak ? 1.6 : 1.0,
        roughness: 0.1,
        metalness: 0.9,
      });

      const nodeMesh = new THREE.Mesh(nodeGeom, nodeMat);
      nodeMesh.position.copy(pos);
      (nodeMesh as any).dimIndex = idx;
      nodesGroup.add(nodeMesh);

      // Add pulsating halo rings
      if (isBreached) {
        // Crimson alert beacon halo
        const haloGeom = new THREE.RingGeometry(1.15, 1.45, 32);
        const haloMat = new THREE.MeshBasicMaterial({
          color: 0xff003c,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const haloMesh = new THREE.Mesh(haloGeom, haloMat);
        haloMesh.position.copy(pos);
        haloMesh.lookAt(0, 0, 0);
        (haloMesh as any).isCrimsonHalo = true;
        nodesGroup.add(haloMesh);
      } else if (isPeak) {
        const ringGeom = new THREE.RingGeometry(1.0, 1.25, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x00f2ff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8,
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.position.copy(pos);
        ringMesh.lookAt(0, 0, 0);
        nodesGroup.add(ringMesh);
      }
    });

    group.add(nodesGroup);

    // D. Geodesic Entanglement Lines between 11 Nodes
    const linesGroup = new THREE.Group();
    linesGroupRef.current = linesGroup;

    for (let i = 0; i < 11; i++) {
      for (let j = i + 1; j < 11; j++) {
        const p1 = dimensionNodePositions[i];
        const p2 = dimensionNodePositions[j];
        const dist = p1.distanceTo(p2);

        // Connect nodes that are within harmonic proximity
        if (dist < 18) {
          const lineGeom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
          const couplingStrength = ((normalizedOutput[i] + normalizedOutput[j]) / 2) * 5;
          const iBreached = breachedDimMap.has(i);
          const jBreached = breachedDimMap.has(j);
          const lineMat = new THREE.LineBasicMaterial({
            color: iBreached || jBreached ? 0xff003c : i === peakDimIndex || j === peakDimIndex ? 0x00f2ff : 0x7000ff,
            transparent: true,
            opacity: Math.min(0.7, Math.max(0.15, couplingStrength * 0.35)),
            blending: THREE.AdditiveBlending,
          });
          const line = new THREE.Line(lineGeom, lineMat);
          linesGroup.add(line);
        }
      }
    }
    group.add(linesGroup);

    // E. Quantum Orbital Particles
    if (showParticles) {
      const particleCount = 200;
      const particleGeom = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      const particleColors = new Float32Array(particleCount * 3);

      const color1 = new THREE.Color(0x00f2ff);
      const color2 = new THREE.Color(0xa855f7);

      for (let i = 0; i < particleCount; i++) {
        const r = 11 + Math.random() * 8;
        const theta = Math.random() * Math.PI * 2;
        const phiAngle = Math.acos(Math.random() * 2 - 1);

        particlePositions[i * 3] = r * Math.sin(phiAngle) * Math.cos(theta);
        particlePositions[i * 3 + 1] = r * Math.sin(phiAngle) * Math.sin(theta);
        particlePositions[i * 3 + 2] = r * Math.cos(phiAngle);

        const mixedColor = color1.clone().lerp(color2, Math.random());
        particleColors[i * 3] = mixedColor.r;
        particleColors[i * 3 + 1] = mixedColor.g;
        particleColors[i * 3 + 2] = mixedColor.b;
      }

      particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

      const particleMat = new THREE.PointsMaterial({
        size: 0.35,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });

      const particleSystem = new THREE.Points(particleGeom, particleMat);
      group.add(particleSystem);
      particlesRef.current = particleSystem;
    }
  }, [manifoldType, showWireframe, showParticles, dimensionNodePositions, normalizedOutput, peakDimIndex, breachedDimMap]);

  // Pointer Drag Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!containerRef.current || !canvasRef.current || !cameraRef.current || !nodesGroupRef.current) return;

    // 1. Raycasting for 3D Node Hovering
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const intersects = raycaster.intersectObjects(nodesGroupRef.current.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0].object as any;
      if (hit.dimIndex !== undefined) {
        setHoveredDim(hit.dimIndex);
      }
    } else {
      setHoveredDim(null);
    }

    // 2. Drag rotation
    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      targetRotationRef.current.y += deltaX * 0.008;
      targetRotationRef.current.x += deltaY * 0.008;

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Node click selection
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !cameraRef.current || !nodesGroupRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const intersects = raycaster.intersectObjects(nodesGroupRef.current.children, true);
    if (intersects.length > 0) {
      const hit = intersects[0].object as any;
      if (hit.dimIndex !== undefined) {
        setSelectedDim(hit.dimIndex);
        if (onInspectDimension) {
          onInspectDimension(hit.dimIndex);
        }
      }
    }
  };

  // Wheel Zoom Handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.02;
    zoomLevelRef.current = Math.min(45, Math.max(14, zoomLevelRef.current + zoomDelta));
  };

  const handleZoomIn = () => {
    zoomLevelRef.current = Math.max(14, zoomLevelRef.current - 4);
  };

  const handleZoomOut = () => {
    zoomLevelRef.current = Math.min(45, zoomLevelRef.current + 4);
  };

  const handleResetCamera = () => {
    targetRotationRef.current = { x: 0.3, y: 0.5 };
    zoomLevelRef.current = 26;
  };

  // Hovered or selected dimension metadata
  const activeDimInfo = hoveredDim !== null ? DIMENSION_METADATA[hoveredDim] : selectedDim !== null ? DIMENSION_METADATA[selectedDim] : null;
  const activeDimIndex = hoveredDim !== null ? hoveredDim : selectedDim;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className={`relative w-full h-full min-h-[380px] bg-[#020408] rounded-lg overflow-hidden select-none flex flex-col ${className}`}
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-grab active:cursor-grabbing block touch-none"
      />

      {/* Top Left: Manifold Resonance Header & Invariant Status */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col space-y-1 pointer-events-none">
        <div className="flex items-center space-x-2 bg-[#050810]/85 backdrop-blur-md px-2.5 py-1 rounded border border-[#1a2234] text-xs">
          <Atom className="w-3.5 h-3.5 text-[#00f2ff] animate-spin-slow" />
          <span className="font-mono font-bold text-white text-[11px] tracking-wider uppercase">
            {isHi ? '11D अनुनाद मैनिफोल्ड (Resonance Geometry)' : '11D Quantum Manifold'}
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
            H = H†
          </span>
        </div>
        <div className="text-[10px] font-mono text-gray-400 bg-[#050810]/75 px-2 py-0.5 rounded border border-[#1a2234]/50 w-fit">
          {isHi ? 'प्रक्षेपण:' : 'Projection:'}{' '}
          <span className="text-[#00f2ff] font-semibold">
            {manifoldType === 'calabi_yau'
              ? isHi ? 'कैलाबी-याउ हार्मोनिक' : 'Calabi-Yau Hypersurface'
              : manifoldType === 'torus'
              ? isHi ? 'टॉरॉइडल फ्लक्स' : 'Clifford Torus'
              : isHi ? 'जियोडेसिक जालक' : 'Geodesic Entanglement'}
          </span>
        </div>

        {/* Real-Time Risk Assessment HUD Badge */}
        {riskOverlayEnabled && breachedDimMap.size > 0 && (
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded border border-rose-500/80 bg-rose-950/90 text-rose-200 text-[10px] font-mono font-bold animate-pulse-crimson w-fit shadow-[0_0_12px_rgba(255,0,60,0.6)]">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
            <span>
              {isHi
                ? `⚠️ ${breachedDimMap.size} आयाम जोखिम सीमा से बाहर`
                : `⚠️ RISK ALERT: ${breachedDimMap.size} DIMS IN BREACH`}
            </span>
          </div>
        )}
      </div>

      {/* Top Right: Geometry Mode & Viewport Controls */}
      <div className="absolute top-2.5 right-2.5 z-10 flex flex-wrap items-center gap-1.5 bg-[#050810]/85 backdrop-blur-md p-1 rounded border border-[#1a2234]">
        {/* Geometry Type Selector */}
        <div className="flex bg-[#0a0f1d] p-0.5 rounded border border-[#1a2234] text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setManifoldType('calabi_yau')}
            className={`px-2 py-1 rounded transition ${
              manifoldType === 'calabi_yau'
                ? 'bg-[#00f2ff] text-[#020408] font-bold shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Calabi-Yau Harmonic Hypersurface with 11D wave modulations"
          >
            {isHi ? 'हार्मोनिक' : 'Harmonic'}
          </button>
          <button
            type="button"
            onClick={() => setManifoldType('torus')}
            className={`px-2 py-1 rounded transition ${
              manifoldType === 'torus'
                ? 'bg-[#00f2ff] text-[#020408] font-bold shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Clifford Torus projection of 11D cyclic flux"
          >
            {isHi ? 'टॉरस' : 'Torus'}
          </button>
          <button
            type="button"
            onClick={() => setManifoldType('geodesic')}
            className={`px-2 py-1 rounded transition ${
              manifoldType === 'geodesic'
                ? 'bg-[#00f2ff] text-[#020408] font-bold shadow-[0_0_8px_rgba(0,242,255,0.3)]'
                : 'text-gray-400 hover:text-white'
            }`}
            title="11-Vertex Geodesic Web"
          >
            {isHi ? 'जियोडेसिक' : 'Geodesic'}
          </button>
        </div>

        {/* Wireframe toggle */}
        <button
          type="button"
          onClick={() => setShowWireframe(!showWireframe)}
          className={`p-1.5 rounded border transition ${
            showWireframe
              ? 'bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/40'
              : 'bg-[#0a0f1d] text-gray-400 border-[#1a2234] hover:text-white'
          }`}
          title="Toggle Wireframe Grid"
        >
          <Layers className="w-3.5 h-3.5" />
        </button>

        {/* Particles toggle */}
        <button
          type="button"
          onClick={() => setShowParticles(!showParticles)}
          className={`p-1.5 rounded border transition ${
            showParticles
              ? 'bg-[#a855f7]/20 text-[#a855f7] border-[#a855f7]/40'
              : 'bg-[#0a0f1d] text-gray-400 border-[#1a2234] hover:text-white'
          }`}
          title="Toggle Quantum Wave Quanta Particles"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>

        {/* Auto-rotation toggle */}
        <button
          type="button"
          onClick={() => setIsRotating(!isRotating)}
          className={`p-1.5 rounded border transition ${
            isRotating
              ? 'bg-[#00f2ff]/20 text-[#00f2ff] border-[#00f2ff]/40'
              : 'bg-[#0a0f1d] text-gray-400 border-[#1a2234] hover:text-white'
          }`}
          title={isRotating ? 'Pause Auto-Rotation' : 'Resume Auto-Rotation'}
        >
          {isRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        {/* Camera Zoom In/Out & Reset */}
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1.5 bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-300 hover:text-white rounded border border-[#1a2234] transition"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-300 hover:text-white rounded border border-[#1a2234] transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleResetCamera}
          className="p-1.5 bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-300 hover:text-[#00f2ff] rounded border border-[#1a2234] transition"
          title="Reset Camera Orientation"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Active / Hovered 3D Node Tooltip Card */}
      {activeDimInfo && activeDimIndex !== null && (
        <div className="absolute bottom-12 left-3 right-3 sm:right-auto sm:max-w-xs z-20 bg-[#050810]/90 backdrop-blur-md p-3 rounded-lg border border-[#00f2ff]/40 shadow-[0_0_20px_rgba(0,242,255,0.2)] animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-auto">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[#00f2ff] text-[#020408]">
                D{activeDimIndex + 1}
              </span>
              <span className="font-bold text-white text-xs truncate">
                {isHi ? activeDimInfo.hindiName : activeDimInfo.name}
              </span>
            </div>
            {activeDimIndex === peakDimIndex && (
              <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                PEAK
              </span>
            )}
            {activeDimIndex !== null && breachedDimMap.has(activeDimIndex) && (
              <span className="text-[9px] font-mono font-bold text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500 animate-pulse">
                {breachedDimMap.get(activeDimIndex)?.type === 'HIGH' ? 'BREACH > 0.90' : 'BREACH < 0.10'}
              </span>
            )}
          </div>

          {activeDimIndex !== null && breachedDimMap.has(activeDimIndex) && (
            <div className="mb-2 p-1.5 rounded bg-rose-950/70 border border-rose-500 text-rose-200 font-mono text-[10px] flex items-center justify-between">
              <span className="font-bold text-rose-400">
                {breachedDimMap.get(activeDimIndex)?.type === 'HIGH'
                  ? isHi ? 'अति-दबाव संकट:' : 'CRITICAL OVERLOAD:'
                  : isHi ? 'रिक्तीकरण संकट:' : 'CRITICAL DEPLETION:'}
              </span>
              <span className="text-rose-100 font-bold">
                {(computation.paddedStateVector[activeDimIndex] ?? 0).toFixed(3)}{' '}
                {breachedDimMap.get(activeDimIndex)?.type === 'HIGH' ? `> ${thresholdHigh}` : `< ${thresholdLow}`}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-300 my-1 bg-[#0a0f1d] p-1.5 rounded border border-[#1a2234]">
            <div>
              <span className="text-gray-500 block">Probability |P|²:</span>
              <span className="font-bold text-[#00f2ff] text-xs">
                {(normalizedOutput[activeDimIndex] ?? 0).toFixed(5)} (
                {((normalizedOutput[activeDimIndex] ?? 0) * 100).toFixed(1)}%)
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Quantum Phase θ:</span>
              <span className="font-bold text-emerald-400 text-xs">
                {(phaseAngles[activeDimIndex] ?? 0).toFixed(2)} rad
              </span>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 leading-tight line-clamp-2 mt-1">
            {activeDimInfo.description}
          </p>

          {onInspectDimension && (
            <button
              type="button"
              onClick={() => onInspectDimension(activeDimIndex)}
              className="w-full mt-2 py-1 bg-[#00f2ff]/10 hover:bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/30 text-[10px] font-mono font-bold rounded transition text-center"
            >
              {isHi ? 'विस्तृत आयाम भौतिकी देखें' : 'Inspect Dimension Physics'} →
            </button>
          )}
        </div>
      )}

      {/* Bottom Footer: Gesture Hint & Peak Resonance Badge */}
      <div className="absolute bottom-2 left-2.5 right-2.5 z-10 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] font-mono text-gray-400 pointer-events-none">
        <div className="flex items-center space-x-2 bg-[#050810]/80 backdrop-blur-sm px-2 py-1 rounded border border-[#1a2234]/60">
          <Compass className="w-3 h-3 text-[#00f2ff]" />
          <span>{isHi ? 'माउस से घुमाएं • स्क्रॉल से ज़ूम करें • 11D नोड्स पर क्लिक करें' : 'Drag to Rotate • Scroll to Zoom • Click 11D Nodes'}</span>
        </div>

        <div className="bg-[#050810]/80 backdrop-blur-sm px-2 py-1 rounded border border-[#1a2234]/60">
          {isHi ? 'शीर्ष ऊर्जा ध्रुव:' : 'Peak Resonance Node:'}{' '}
          <strong className="text-[#00f2ff]">D{peakDimIndex + 1}</strong> (
          {((normalizedOutput[peakDimIndex] ?? 0) * 100).toFixed(1)}%)
        </div>
      </div>
    </div>
  );
};
