import * as THREE from "three";
import { cameraKeyframes, moodKeyframes, sampleIndex } from "@/data/journey";
import { createGlowTexture, createSkyTexture } from "./textures";

const SPINE_START_Z = 10;
const SPINE_END_Z = -178;
const SPINE_LENGTH = SPINE_START_Z - SPINE_END_Z;

/** Small helper: keeps a THREE.Color updated by lerping between two mood keyframes. */
class MoodColor {
  color = new THREE.Color();
  private a = new THREE.Color();
  private b = new THREE.Color();
  constructor(private key: "fog" | "key" | "warm") {}
  update(i: number, t: number) {
    this.a.set(moodKeyframes[i][this.key]);
    this.b.set(moodKeyframes[Math.min(i + 1, moodKeyframes.length - 1)][this.key]);
    this.color.copy(this.a).lerp(this.b, t);
    return this.color;
  }
}

export class HotelScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;

  private cameraCurve: THREE.CatmullRomCurve3;
  private lookCurve: THREE.CatmullRomCurve3;

  private targetProgress = 0;
  private displayProgress = 0;

  private fogColor = new MoodColor("fog");
  private keyColor = new MoodColor("key");
  private warmColor = new MoodColor("warm");

  private fog: THREE.FogExp2;
  private keyLight: THREE.PointLight;
  private hemi: THREE.HemisphereLight;
  private roomLights: THREE.PointLight[] = [];

  private floorMat: THREE.MeshStandardMaterial;
  private columnMat: THREE.MeshStandardMaterial;
  private archMat: THREE.MeshStandardMaterial;

  private leftDoor: THREE.Group;
  private rightDoor: THREE.Group;

  private poolMat: THREE.ShaderMaterial;
  private skyMat: THREE.MeshBasicMaterial;

  private particles: THREE.Points;
  private particlePositions: Float32Array;
  private particleCount = 420;

  private reducedMotion: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.camera = new THREE.PerspectiveCamera(
      cameraKeyframes[0].fov,
      1,
      0.1,
      400
    );

    this.fog = new THREE.FogExp2(0x05070c, 0.045);
    this.scene.fog = this.fog;
    this.scene.background = new THREE.Color(0x05070c);

    this.cameraCurve = new THREE.CatmullRomCurve3(
      cameraKeyframes.map((k) => new THREE.Vector3(...k.position)),
      false,
      "catmullrom",
      0.4
    );
    this.lookCurve = new THREE.CatmullRomCurve3(
      cameraKeyframes.map((k) => new THREE.Vector3(...k.lookAt)),
      false,
      "catmullrom",
      0.4
    );

    // -- Lighting ---------------------------------------------------------
    this.hemi = new THREE.HemisphereLight(0x8fb4ff, 0x090c14, 0.5);
    this.scene.add(this.hemi);

    this.keyLight = new THREE.PointLight(0x8fb4ff, 0.6, 26, 2);
    this.keyLight.position.set(0, 1, 2);
    this.camera.add(this.keyLight);
    this.scene.add(this.camera);

    // -- Materials ----------------------------------------------------------
    this.floorMat = new THREE.MeshStandardMaterial({
      color: 0x1b140a,
      roughness: 0.22,
      metalness: 0.55,
    });
    this.columnMat = new THREE.MeshStandardMaterial({
      color: 0x2a2018,
      roughness: 0.5,
      metalness: 0.2,
    });
    this.archMat = new THREE.MeshStandardMaterial({
      color: 0x2a2018,
      roughness: 0.4,
      metalness: 0.3,
    });

    this.buildFloor();
    this.buildColonnade();
    const doors = this.buildDoors();
    this.leftDoor = doors.left;
    this.rightDoor = doors.right;
    this.buildStaircase();
    this.poolMat = this.buildPool();
    this.buildSuiteAndSkyLounge();
    this.skyMat = this.buildBackdrop();
    this.buildFinaleSilhouette();
    this.buildLightShafts();

    const dust = this.buildParticles();
    this.particles = dust.points;
    this.particlePositions = dust.positions;

    window.addEventListener("resize", this.handleResize);
    this.handleResize();
    this.animate();
  }

  // -------------------------------------------------------------------------
  private buildFloor() {
    const geo = new THREE.PlaneGeometry(22, SPINE_LENGTH + 40, 1, 1);
    const mesh = new THREE.Mesh(geo, this.floorMat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0, (SPINE_START_Z + SPINE_END_Z) / 2);
    this.scene.add(mesh);
  }

  private buildColonnade() {
    // Only the "roofed" halves of the journey get columns — arrival's
    // facade, the pool, balcony, sky lounge and finale stay open to the sky.
    const roofedRanges: [number, number][] = [
      [8, -31],
      [-33, -75],
    ];
    const spacing = 11;
    const positions: number[] = [];
    roofedRanges.forEach(([start, end]) => {
      for (let z = start; z >= end; z -= spacing) positions.push(z);
    });
    const count = positions.length;

    const colGeo = new THREE.CylinderGeometry(0.24, 0.3, 6, 12);
    const columns = new THREE.InstancedMesh(colGeo, this.columnMat, count * 2);
    // Short capitals sit above each column individually rather than spanning
    // the corridor, so the repeat never reads as a stack of full-width bars.
    const lintelGeo = new THREE.BoxGeometry(1.4, 0.34, 0.6);
    const lintels = new THREE.InstancedMesh(lintelGeo, this.archMat, count * 2);
    const m = new THREE.Matrix4();

    positions.forEach((z, i) => {
      m.makeTranslation(-3.6, 3, z);
      columns.setMatrixAt(i * 2, m);
      m.makeTranslation(-3.6, 6.05, z);
      lintels.setMatrixAt(i * 2, m);
      m.makeTranslation(3.6, 3, z);
      columns.setMatrixAt(i * 2 + 1, m);
      m.makeTranslation(3.6, 6.05, z);
      lintels.setMatrixAt(i * 2 + 1, m);
    });
    columns.instanceMatrix.needsUpdate = true;
    lintels.instanceMatrix.needsUpdate = true;
    this.scene.add(columns, lintels);

    // Pendant bulbs: mostly fake emissive, a handful are real lights for warmth.
    const glow = createGlowTexture();
    const bulbMat = new THREE.SpriteMaterial({
      map: glow,
      color: 0xffcf94,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    positions.forEach((z, i) => {
      if (i % 2 !== 0) return;
      const sprite = new THREE.Sprite(bulbMat);
      sprite.position.set(0, 5.6, z);
      sprite.scale.setScalar(0.9);
      this.scene.add(sprite);

      if (i % 6 === 0) {
        const light = new THREE.PointLight(0xffb066, 0, 14, 2);
        light.position.set(0, 5.4, z);
        this.scene.add(light);
        this.roomLights.push(light);
      }
    });
  }

  private buildDoors() {
    const geo = new THREE.BoxGeometry(1.9, 4.2, 0.14);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x151008,
      roughness: 0.3,
      metalness: 0.7,
    });

    const left = new THREE.Group();
    left.position.set(-1.9, 2.1, 9.4);
    const leftMesh = new THREE.Mesh(geo, mat);
    leftMesh.position.set(0.95, 0, 0);
    left.add(leftMesh);

    const right = new THREE.Group();
    right.position.set(1.9, 2.1, 9.4);
    const rightMesh = new THREE.Mesh(geo, mat);
    rightMesh.position.set(-0.95, 0, 0);
    right.add(rightMesh);

    this.scene.add(left, right);
    return { left, right };
  }

  private buildStaircase() {
    const steps = 12;
    const geo = new THREE.BoxGeometry(2.6, 0.32, 0.9);
    const mesh = new THREE.InstancedMesh(geo, this.floorMat, steps);
    const m = new THREE.Matrix4();
    for (let i = 0; i < steps; i++) {
      m.makeTranslation(2.6, i * 0.34, -20 - i * 0.9);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    this.scene.add(mesh);
  }

  private buildPool() {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x0c1c22) },
        uFoam: { value: new THREE.Color(0x8fe3d8) },
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z += sin(p.x * 1.6 + uTime * 0.6) * 0.05 + cos(p.y * 1.3 + uTime * 0.5) * 0.05;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;
        uniform vec3 uFoam;
        void main() {
          float ripple = sin((vUv.x + vUv.y) * 18.0 + uTime * 0.8) * 0.5 + 0.5;
          vec3 col = mix(uColor, uFoam, ripple * 0.25);
          float edge = smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.94, vUv.y);
          gl_FragColor = vec4(col, 0.92);
        }
      `,
      transparent: true,
    });
    const geo = new THREE.PlaneGeometry(9, 15, 32, 32);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, 0.03, -84);
    this.scene.add(mesh);
    return mat;
  }

  private buildSuiteAndSkyLounge() {
    const glow = createGlowTexture();
    const stringMat = new THREE.SpriteMaterial({
      map: glow,
      color: 0xffe3ad,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    for (let i = 0; i < 24; i++) {
      const sprite = new THREE.Sprite(stringMat);
      const z = -122 - i * 1.5;
      sprite.position.set(Math.sin(i * 0.6) * 5, 6.4 + Math.cos(i * 0.4) * 0.4, z);
      sprite.scale.setScalar(0.35);
      this.scene.add(sprite);
    }
  }

  private buildBackdrop() {
    const tex = createSkyTexture();
    const mat = new THREE.MeshBasicMaterial({ map: tex, fog: false });
    // Large enough to fill the frame at every camera height/FOV in the
    // journey, so its edge never seams against the flat clear color.
    const geo = new THREE.PlaneGeometry(500, 340);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 20, -195);
    this.scene.add(mesh);
    return mat;
  }

  private buildFinaleSilhouette() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x0a0705, roughness: 0.8 });
    const group = new THREE.Group();
    const heights = [10, 16, 22, 14, 18, 9];
    heights.forEach((h, i) => {
      const geo = new THREE.BoxGeometry(6, h, 6);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((i - heights.length / 2) * 7.5, h / 2 - 6, -172);
      group.add(mesh);

      const glow = createGlowTexture();
      const winMat = new THREE.SpriteMaterial({
        map: glow,
        color: 0xffcf94,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      for (let w = 0; w < 6; w++) {
        const sprite = new THREE.Sprite(winMat);
        sprite.position.set(
          (i - heights.length / 2) * 7.5 + (Math.random() - 0.5) * 3,
          Math.random() * h - 6,
          -168.5
        );
        sprite.scale.setScalar(0.4);
        group.add(sprite);
      }
    });
    this.scene.add(group);
  }

  private buildLightShafts() {
    const tex = createGlowTexture();
    const positions: [number, number, number][] = [
      [0, 8, -16],
      [-3, 8, -55],
      [0, 10, -130],
    ];
    positions.forEach(([x, y, z]) => {
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const geo = new THREE.PlaneGeometry(3, 10);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.rotation.x = Math.PI / 2.3;
      this.scene.add(mesh);
    });
  }

  private buildParticles() {
    const count = this.particleCount;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = Math.random() * 7;
      positions[i * 3 + 2] = SPINE_START_Z - Math.random() * SPINE_LENGTH;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xffe9c7,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    return { points, positions };
  }

  // -------------------------------------------------------------------------
  setProgress(p: number) {
    this.targetProgress = Math.min(Math.max(p, 0), 1);
  }

  handleResize = () => {
    const canvas = this.renderer.domElement;
    const parent = canvas.parentElement;
    const width = parent ? parent.clientWidth : window.innerWidth;
    const height = parent ? parent.clientHeight : window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  private animate = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.animate);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    const smoothing = this.reducedMotion ? 1 : 1 - Math.pow(0.001, dt);
    this.displayProgress += (this.targetProgress - this.displayProgress) * smoothing;

    const pos = this.cameraCurve.getPointAt(this.displayProgress);
    const look = this.lookCurve.getPointAt(this.displayProgress);
    const bob = this.reducedMotion ? 0 : Math.sin(elapsed * 0.9) * 0.03;
    this.camera.position.set(pos.x, pos.y + bob, pos.z);
    this.camera.lookAt(look);

    const { i, t } = sampleIndex(this.displayProgress, cameraKeyframes.length);
    this.camera.fov = THREE.MathUtils.lerp(
      cameraKeyframes[i].fov,
      cameraKeyframes[Math.min(i + 1, cameraKeyframes.length - 1)].fov,
      t
    );
    this.camera.updateProjectionMatrix();

    const mood = sampleIndex(this.displayProgress, moodKeyframes.length);
    const fog = this.fogColor.update(mood.i, mood.t);
    const key = this.keyColor.update(mood.i, mood.t);
    const warm = this.warmColor.update(mood.i, mood.t);
    const a = moodKeyframes[mood.i];
    const b = moodKeyframes[Math.min(mood.i + 1, moodKeyframes.length - 1)];
    const keyIntensity = THREE.MathUtils.lerp(a.keyIntensity, b.keyIntensity, mood.t);
    const warmIntensity = THREE.MathUtils.lerp(a.warmIntensity, b.warmIntensity, mood.t);
    const fogDensity = THREE.MathUtils.lerp(a.fogDensity, b.fogDensity, mood.t);

    this.fog.color.copy(fog);
    this.fog.density = fogDensity;
    (this.scene.background as THREE.Color).copy(fog);
    this.hemi.color.copy(key);
    this.keyLight.color.copy(key);
    this.keyLight.intensity = keyIntensity;
    this.floorMat.color.copy(warm).multiplyScalar(0.55);
    this.columnMat.color.copy(warm).multiplyScalar(0.35);
    this.archMat.color.copy(warm).multiplyScalar(0.35);
    this.roomLights.forEach((light) => {
      light.color.copy(warm);
      light.intensity = warmIntensity * 1.4;
    });

    // Doors swing open early in the journey.
    const doorT = THREE.MathUtils.clamp(
      (this.displayProgress - 0.03) / 0.1,
      0,
      1
    );
    const eased = 1 - Math.pow(1 - doorT, 3);
    this.leftDoor.rotation.y = eased * 1.9;
    this.rightDoor.rotation.y = -eased * 1.9;

    this.poolMat.uniforms.uTime.value = elapsed;

    // Recycle dust motes so the field feels endless and drifts upward.
    const arr = this.particlePositions;
    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      arr[idx + 1] += dt * 0.12;
      arr[idx] += Math.sin(elapsed * 0.3 + i) * 0.001;
      if (arr[idx + 1] > 7.5) arr[idx + 1] = 0;
      const relativeZ = arr[idx + 2] - this.camera.position.z;
      if (relativeZ > 6) {
        arr[idx + 2] -= SPINE_LENGTH * 0.4;
      }
    }
    (this.particles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.handleResize);
    this.renderer.dispose();
  }
}
