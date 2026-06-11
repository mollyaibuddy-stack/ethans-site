"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  BEAD_STEP,
  CYBER_FOOD_BEADS,
  MAX_CYBER_FOOD_IMAGE_DATA_URL_LENGTH,
  countBeadCrossings,
  defaultCyberFoodBeads,
  normalizeAngle,
} from "@/lib/cyber-food-beads.mjs";

const PROJECT_VERSION = "0.2.0";
const PROJECT_UPDATED = "June 12, 2026";

type FoodDraft = {
  position: number;
  name: string;
  imageDataUrl: string;
};

type RenderFood = FoodDraft & {
  palette: string[];
};

type DragState = {
  pointerId: number;
  x: number;
  lastTime: number;
  moved: boolean;
};

type AudioWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

function foodsWithPalette(foods: FoodDraft[]): RenderFood[] {
  return foods.map((food, index) => ({
    ...food,
    position: index,
    palette: CYBER_FOOD_BEADS[index]?.palette || ["#f8d66d", "#c95c2e", "#f6efe2"],
  }));
}

function drawUploadedImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - sourceSize) / 2;
  const sourceY = (image.naturalHeight - sourceSize) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(128, 128, 112, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 16, 16, 224, 224);
  ctx.restore();

  const shine = ctx.createRadialGradient(88, 64, 8, 128, 128, 128);
  shine.addColorStop(0, "rgba(255,255,255,0.5)");
  shine.addColorStop(0.45, "rgba(255,255,255,0.08)");
  shine.addColorStop(1, "rgba(0,0,0,0.34)");
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.arc(128, 128, 116, 0, Math.PI * 2);
  ctx.fill();
}

function drawFoodIcon(ctx: CanvasRenderingContext2D, food: RenderFood) {
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

function createFoodTexture(food: RenderFood) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  drawFoodIcon(ctx, food);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  if (food.imageDataUrl) {
    const image = new Image();
    image.onload = () => {
      ctx.clearRect(0, 0, 256, 256);
      drawUploadedImage(ctx, image);
      texture.needsUpdate = true;
    };
    image.src = food.imageDataUrl;
  }

  return texture;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read compressed image."));
    reader.readAsDataURL(blob);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error("Could not compress image."));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

async function processFoodImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }

  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  try {
    image.src = objectUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image processing is not available.");

    const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
    const sourceX = (image.naturalWidth - sourceSize) / 2;
    const sourceY = (image.naturalHeight - sourceSize) / 2;
    ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 256, 256);

    const webpBlob = await canvasToBlob(canvas, "image/webp", 0.78);
    const blob = webpBlob.type === "image/webp"
      ? webpBlob
      : await canvasToBlob(canvas, "image/jpeg", 0.82);
    const imageDataUrl = await blobToDataUrl(blob);

    if (imageDataUrl.length > MAX_CYBER_FOOD_IMAGE_DATA_URL_LENGTH) {
      throw new Error("Processed image is too large. Please choose a simpler image.");
    }

    return imageDataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
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
  const resolveOnStopRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [foods, setFoods] = useState<FoodDraft[]>(() => defaultCyberFoodBeads());
  const foodsRef = useRef<RenderFood[]>(foodsWithPalette(defaultCyberFoodBeads()));
  const [draftFoods, setDraftFoods] = useState<FoodDraft[]>(() => defaultCyberFoodBeads());
  const [result, setResult] = useState<RenderFood | null>(null);
  const [customizing, setCustomizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    let active = true;
    fetch("/api/cyber-food-beads")
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Could not load custom foods.")))
      .then(data => {
        if (!active || !Array.isArray(data?.foods)) return;
        setFoods(data.foods);
        setDraftFoods(data.foods);
      })
      .catch(() => {
        if (active) setMessage("Using default foods.");
      });

    return () => {
      active = false;
    };
  }, []);

  const renderFoods = foodsWithPalette(foods);
  foodsRef.current = renderFoods;

  const getSelectedFood = (rotation: number) => {
    const normalized = normalizeAngle(-rotation);
    const index = Math.round(normalized / BEAD_STEP) % foodsRef.current.length;
    return foodsRef.current[index];
  };

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

    const beadGeometry = new THREE.SphereGeometry(0.6, 40, 40);
    const cordGeometry = new THREE.TorusGeometry(2.34, 0.025, 12, 96);
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
    const radius = 2.34;
    renderFoods.forEach((food, index) => {
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
        velocityRef.current *= (stoppingRef.current || resolveOnStopRef.current) ? 0.9 : 0.982;
        if (Math.abs(velocityRef.current) < 0.0007) {
          velocityRef.current = 0;
          if (resolveOnStopRef.current) {
            resolveOnStopRef.current = false;
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
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
      beadGeometry.dispose();
      cordGeometry.dispose();
      cordMaterial.dispose();
      textures.forEach(texture => texture.dispose());
      beadMaterials.forEach(material => material.dispose());
      renderer.dispose();
    };
  }, [foods]);

  useEffect(() => () => {
    audioContextRef.current?.close();
    audioContextRef.current = null;
  }, []);

  const startPan = () => {
    unlockAudio();
    setResult(null);
    stoppingRef.current = false;
    resolveOnStopRef.current = false;
    velocityRef.current = velocityRef.current >= 0 ? 0.055 : -0.055;
  };

  const stopPan = () => {
    unlockAudio();
    setResult(null);
    stoppingRef.current = true;
    resolveOnStopRef.current = true;
    if (Math.abs(velocityRef.current) < 0.012) {
      velocityRef.current = velocityRef.current >= 0 ? 0.03 : -0.03;
    }
  };

  const reset = () => {
    unlockAudio();
    rotationRef.current = 0;
    velocityRef.current = 0;
    stoppingRef.current = false;
    resolveOnStopRef.current = false;
    setResult(null);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    unlockAudio();
    setResult(null);
    stoppingRef.current = false;
    resolveOnStopRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      lastTime: performance.now(),
      moved: false,
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
      moved: drag.moved || Math.abs(dx) > 2,
    };
    for (let i = 0; i < crossings; i += 1) {
      playTick();
    }
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    if (drag.moved) {
      resolveOnStopRef.current = true;
    }
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const openCustomizer = () => {
    setDraftFoods(foods);
    setRowErrors({});
    setMessage("");
    setCustomizing(true);
  };

  const updateDraftName = (position: number, name: string) => {
    setDraftFoods(current => current.map(food => food.position === position ? { ...food, name } : food));
  };

  const updateDraftImage = async (position: number, file: File | null) => {
    if (!file) return;
    setRowErrors(current => ({ ...current, [position]: "" }));
    try {
      const imageDataUrl = await processFoodImage(file);
      setDraftFoods(current => current.map(food => food.position === position ? { ...food, imageDataUrl } : food));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not process image.";
      setRowErrors(current => ({ ...current, [position]: errorMessage }));
    }
  };

  const resetDraftToDefaults = () => {
    setDraftFoods(defaultCyberFoodBeads());
    setRowErrors({});
    setMessage("Defaults ready to save.");
  };

  const saveFoods = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/private/cyber-food-beads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foods: draftFoods }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Could not save foods.");
      }
      setFoods(data.foods);
      setDraftFoods(data.foods);
      setCustomizing(false);
      setMessage("Custom foods saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save foods.");
    } finally {
      setSaving(false);
    }
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
        <button type="button" onClick={openCustomizer}>Customize Foods</button>
      </div>

      {message && <p className="cyber-food-message">{message}</p>}

      {customizing && (
        <div className="cyber-food-customizer" aria-label="Customize Cyber Food Beads foods">
          <div className="cyber-food-customizer-header">
            <h3>Customize Foods</h3>
            <button type="button" onClick={() => setCustomizing(false)}>Cancel</button>
          </div>
          <div className="cyber-food-custom-list">
            {draftFoods.map(food => (
              <div className="cyber-food-custom-row" key={food.position}>
                <span className="cyber-food-custom-number">{food.position + 1}</span>
                <label>
                  <span>Name</span>
                  <input
                    value={food.name}
                    maxLength={40}
                    onChange={event => updateDraftName(food.position, event.target.value)}
                  />
                </label>
                <div className="cyber-food-custom-preview" aria-label={`Preview for ${food.name}`}>
                  {food.imageDataUrl ? <img src={food.imageDataUrl} alt="" /> : <span>No image</span>}
                </div>
                <label className="file-button cyber-food-upload">
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={event => void updateDraftImage(food.position, event.target.files?.[0] || null)}
                  />
                </label>
                {rowErrors[food.position] && <p className="cyber-food-row-error">{rowErrors[food.position]}</p>}
              </div>
            ))}
          </div>
          <div className="cyber-food-custom-actions">
            <button type="button" onClick={saveFoods} disabled={saving}>{saving ? "Saving..." : "Save Foods"}</button>
            <button type="button" onClick={resetDraftToDefaults}>Reset to Defaults</button>
            <button type="button" onClick={() => setCustomizing(false)}>Cancel</button>
          </div>
        </div>
      )}

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
