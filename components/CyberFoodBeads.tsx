"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  BEAD_STEP,
  CYBER_FOOD_BEADS,
  countBeadCrossings,
  getSelectedFood,
} from "@/lib/cyber-food-beads.mjs";

const PROJECT_VERSION = "0.1.0";
const PROJECT_UPDATED = "June 11, 2026";

type FoodBead = {
  name: string;
  palette: string[];
};

type DragState = {
  pointerId: number;
  x: number;
  lastTime: number;
};

type AudioWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

function drawFoodIcon(ctx: CanvasRenderingContext2D, food: FoodBead) {
  const [primary, secondary, accent] = food.palette;

  ctx.clearRect(0, 0, 256, 256);
  const gradient = ctx.createRadialGradient(92, 72, 16, 128, 128, 128);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.32, primary);
  gradient.addColorStop(1, secondary);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(128, 128, 116, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 10;
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.arc(128, 128, 92, 0.3, Math.PI * 1.55);
  ctx.stroke();

  ctx.fillStyle = accent;
  ctx.strokeStyle = "rgba(20,20,28,0.55)";
  ctx.lineWidth = 8;

  if (food.name === "Ramen") {
    ctx.beginPath();
    ctx.arc(128, 136, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = secondary;
    ctx.lineWidth = 9;
    for (let y = 120; y <= 148; y += 14) {
      ctx.beginPath();
      ctx.moveTo(76, y);
      ctx.bezierCurveTo(102, y - 18, 132, y + 18, 180, y - 6);
      ctx.stroke();
    }
  } else if (food.name === "Pizza") {
    ctx.beginPath();
    ctx.moveTo(82, 62);
    ctx.lineTo(190, 116);
    ctx.lineTo(94, 194);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = secondary;
    [112, 136, 154].forEach((x, index) => {
      ctx.beginPath();
      ctx.arc(x, 116 + index * 18, 11, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (food.name === "Burger") {
    ctx.beginPath();
    ctx.ellipse(128, 91, 70, 32, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = secondary;
    ctx.fillRect(62, 120, 132, 30);
    ctx.fillStyle = "#69b65f";
    ctx.fillRect(70, 106, 116, 18);
    ctx.fillStyle = primary;
    ctx.beginPath();
    ctx.ellipse(128, 164, 68, 26, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (food.name === "Sushi") {
    ctx.fillStyle = "#14251f";
    ctx.fillRect(68, 78, 120, 100);
    ctx.fillStyle = accent;
    ctx.fillRect(84, 94, 88, 68);
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.arc(128, 128, 31, 0, Math.PI * 2);
    ctx.fill();
  } else if (food.name === "Dumplings") {
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.ellipse(86 + i * 28, 132, 33, 48, -0.25 + i * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (food.name === "Tacos") {
    ctx.beginPath();
    ctx.arc(128, 144, 72, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#65b85b";
    ctx.fillRect(70, 111, 116, 20);
    ctx.fillStyle = secondary;
    ctx.fillRect(90, 100, 28, 36);
    ctx.fillRect(136, 96, 28, 40);
  } else if (food.name === "Curry") {
    ctx.beginPath();
    ctx.ellipse(128, 142, 78, 48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = secondary;
    [95, 126, 158].forEach(x => {
      ctx.beginPath();
      ctx.arc(x, 128, 14, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (food.name === "Chicken") {
    ctx.beginPath();
    ctx.ellipse(123, 132, 66, 48, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(178, 102, 20, 0, Math.PI * 2);
    ctx.arc(197, 105, 16, 0, Math.PI * 2);
    ctx.fill();
  } else if (food.name === "Pasta") {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 13;
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.arc(86 + i * 17, 132, 31, 0.25, Math.PI * 1.65);
      ctx.stroke();
    }
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.arc(142, 132, 22, 0, Math.PI * 2);
    ctx.fill();
  } else if (food.name === "Sandwich") {
    ctx.beginPath();
    ctx.moveTo(72, 86);
    ctx.lineTo(184, 118);
    ctx.lineTo(94, 186);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#68a85d";
    ctx.fillRect(86, 116, 100, 20);
    ctx.fillStyle = secondary;
    ctx.fillRect(91, 139, 86, 18);
  } else if (food.name === "Hot Dog") {
    ctx.beginPath();
    ctx.ellipse(128, 136, 78, 34, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.ellipse(128, 128, 68, 18, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(77, 127);
    ctx.bezierCurveTo(102, 105, 126, 149, 153, 122);
    ctx.bezierCurveTo(164, 112, 174, 113, 187, 123);
    ctx.stroke();
  } else {
    [112, 128, 144].forEach((y, index) => {
      ctx.fillStyle = index === 1 ? accent : primary;
      ctx.beginPath();
      ctx.ellipse(128, y, 66, 23, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.arc(128, 93, 13, 0, Math.PI * 2);
    ctx.fill();
  }
}

function createFoodTexture(food: FoodBead) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  drawFoodIcon(ctx, food);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export default function CyberFoodBeads() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const dragRef = useRef<DragState | null>(null);
  const stoppingRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [result, setResult] = useState<FoodBead | null>(null);

  const unlockAudio = () => {
    if (audioContextRef.current) {
      if (audioContextRef.current.state === "suspended") {
        void audioContextRef.current.resume();
      }
      return;
    }

    const audioWindow = window as AudioWindow;
    const AudioCtor = audioWindow.AudioContext || audioWindow.webkitAudioContext;
    if (!AudioCtor) return;
    const audio = new AudioCtor();
    audioContextRef.current = audio;
    void audio.resume();
  };

  const playTick = () => {
    const audio = audioContextRef.current;
    if (!audio || audio.state === "suspended") return;

    const now = audio.currentTime;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(980, now);
    oscillator.frequency.exponentialRampToValueAtTime(520, now + 0.035);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#07080d");

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.7, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    host.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight("#ffffff", 1.1);
    scene.add(ambient);

    const key = new THREE.PointLight("#8be9ff", 3.5, 20);
    key.position.set(-3.5, 3, 5);
    scene.add(key);

    const rim = new THREE.PointLight("#ff6ac1", 2.4, 18);
    rim.position.set(4, -2, 4);
    scene.add(rim);

    const group = new THREE.Group();
    group.rotation.x = -0.92;
    groupRef.current = group;
    scene.add(group);

    const beadGeometry = new THREE.SphereGeometry(0.44, 40, 40);
    const cordGeometry = new THREE.TorusGeometry(2.38, 0.025, 12, 96);
    const cordMaterial = new THREE.MeshStandardMaterial({
      color: "#8be9ff",
      emissive: "#134a59",
      metalness: 0.45,
      roughness: 0.42,
    });
    const cord = new THREE.Mesh(cordGeometry, cordMaterial);
    group.add(cord);

    const textures: THREE.Texture[] = [];
    const beadMaterials: THREE.MeshStandardMaterial[] = [];
    const radius = 2.38;
    CYBER_FOOD_BEADS.forEach((food: FoodBead, index: number) => {
      const angle = Math.PI / 2 + index * BEAD_STEP;
      const texture = createFoodTexture(food);
      if (texture) textures.push(texture);
      const material = new THREE.MeshStandardMaterial({
        color: food.palette[0],
        map: texture || undefined,
        emissive: food.palette[1],
        emissiveIntensity: 0.08,
        metalness: 0.18,
        roughness: 0.36,
      });
      beadMaterials.push(material);
      const bead = new THREE.Mesh(beadGeometry, material);
      bead.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      bead.rotation.z = -angle;
      group.add(bead);
    });

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(320, Math.floor(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const animate = () => {
      const previousRotation = rotationRef.current;

      if (!dragRef.current) {
        rotationRef.current += velocityRef.current;
        velocityRef.current *= stoppingRef.current ? 0.88 : 0.982;
        if (Math.abs(velocityRef.current) < 0.0007) {
          velocityRef.current = 0;
          if (stoppingRef.current) {
            stoppingRef.current = false;
            setResult(getSelectedFood(rotationRef.current));
          }
        }
      }

      const crossings = Math.min(countBeadCrossings(previousRotation, rotationRef.current), 5);
      for (let i = 0; i < crossings; i += 1) {
        playTick();
      }

      if (groupRef.current) {
        groupRef.current.rotation.z = rotationRef.current;
        groupRef.current.children.forEach(child => {
          if (child instanceof THREE.Mesh && child.geometry.type === "SphereGeometry") {
            child.rotation.y += 0.012 + Math.min(Math.abs(velocityRef.current), 0.06);
          }
        });
      }

      renderer.render(scene, camera);
      animationRef.current = window.requestAnimationFrame(animate);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    animationRef.current = window.requestAnimationFrame(animate);

    return () => {
      observer.disconnect();
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
      host.removeChild(renderer.domElement);
      beadGeometry.dispose();
      cordGeometry.dispose();
      cordMaterial.dispose();
      textures.forEach(texture => texture.dispose());
      beadMaterials.forEach(material => material.dispose());
      renderer.dispose();
      audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  const startPan = () => {
    unlockAudio();
    setResult(null);
    stoppingRef.current = false;
    velocityRef.current = velocityRef.current >= 0 ? 0.055 : -0.055;
  };

  const stopPan = () => {
    unlockAudio();
    setResult(null);
    stoppingRef.current = true;
    if (Math.abs(velocityRef.current) < 0.012) {
      velocityRef.current = velocityRef.current >= 0 ? 0.03 : -0.03;
    }
  };

  const reset = () => {
    unlockAudio();
    rotationRef.current = 0;
    velocityRef.current = 0;
    stoppingRef.current = false;
    setResult(null);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    unlockAudio();
    setResult(null);
    stoppingRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      lastTime: performance.now(),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const now = performance.now();
    const dx = event.clientX - drag.x;
    const elapsed = Math.max(now - drag.lastTime, 16);
    const nextRotation = rotationRef.current + dx * 0.009;
    const crossings = Math.min(countBeadCrossings(rotationRef.current, nextRotation), 5);
    rotationRef.current = nextRotation;
    velocityRef.current = (dx / elapsed) * 0.22;
    dragRef.current = {
      ...drag,
      x: event.clientX,
      lastTime: now,
    };
    for (let i = 0; i < crossings; i += 1) {
      playTick();
    }
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <section className="cyber-food-beads" aria-label="Cyber Food Beads project">
      <div className="cyber-food-header">
        <div>
          <h2>Cyber Food Beads</h2>
          <p className="muted">赛博盘串</p>
          <p className="project-meta">
            <span>Version {PROJECT_VERSION}</span>
            <span>Updated {PROJECT_UPDATED}</span>
          </p>
        </div>
      </div>

      <div className="cyber-food-scene">
        <div className="cyber-food-selector" aria-hidden="true" />
        <div
          ref={hostRef}
          className="cyber-food-canvas-host"
          aria-label="Drag the Cyber Food Beads ring"
          role="application"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      </div>

      <div className="cyber-food-actions">
        <button type="button" onClick={startPan}>Pan</button>
        <button type="button" onClick={stopPan}>Stop</button>
        <button type="button" onClick={reset}>Reset</button>
      </div>

      {result && (
        <div className="cyber-food-result-modal" role="dialog" aria-modal="true" aria-label="Cyber Food Beads result">
          <div className="cyber-food-result-card">
            <p>Today we eat: &quot;{result.name}&quot;</p>
            <button type="button" onClick={() => setResult(null)}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
}
