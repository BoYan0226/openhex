'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const MAX_TRAIL = 128;
const CONTENT_FRAME_INTERVAL = 1000 / 20;
const CONTENT_PIXEL_RATIO = 0.3;
const CONTENT_BLUR_RADIUS = 12;
const HERO_PIXEL_RATIO = 1.35;
const HERO_RGB_SHIFT = 0.004;

const VIGNETTE_RGB_SHIFT_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    blurAmount: { value: 0 },
    shiftAmount: { value: HERO_RGB_SHIFT },
    texelSize: { value: new THREE.Vector2(1, 1) },
    vignetteRadius: { value: 0.3 },
    vignetteSoftness: { value: 0.3 },
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float blurAmount;
    uniform float shiftAmount;
    uniform vec2 texelSize;
    uniform float vignetteRadius;
    uniform float vignetteSoftness;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5);
      float dist = distance(vUv, center);
      float horzQuadrant = sign(vUv.x - center.x);
      float vertQuadrant = sign(vUv.y - center.y);
      float vignetteFactor = smoothstep(vignetteRadius, vignetteRadius + vignetteSoftness, dist);
      float currentShift = shiftAmount * vignetteFactor;

      vec3 shiftedColor;
      if (blurAmount > 0.0) {
        vec2 farOffset = texelSize * blurAmount;
        vec2 nearOffset = farOffset * 0.45;
        shiftedColor = texture2D(tDiffuse, vUv).rgb * 0.16;
        shiftedColor += texture2D(tDiffuse, vUv + vec2(nearOffset.x, 0.0)).rgb * 0.08;
        shiftedColor += texture2D(tDiffuse, vUv - vec2(nearOffset.x, 0.0)).rgb * 0.08;
        shiftedColor += texture2D(tDiffuse, vUv + vec2(0.0, nearOffset.y)).rgb * 0.08;
        shiftedColor += texture2D(tDiffuse, vUv - vec2(0.0, nearOffset.y)).rgb * 0.08;
        shiftedColor += texture2D(tDiffuse, vUv + vec2(farOffset.x, 0.0)).rgb * 0.05;
        shiftedColor += texture2D(tDiffuse, vUv - vec2(farOffset.x, 0.0)).rgb * 0.05;
        shiftedColor += texture2D(tDiffuse, vUv + vec2(0.0, farOffset.y)).rgb * 0.05;
        shiftedColor += texture2D(tDiffuse, vUv - vec2(0.0, farOffset.y)).rgb * 0.05;
        shiftedColor += texture2D(tDiffuse, vUv + farOffset).rgb * 0.08;
        shiftedColor += texture2D(tDiffuse, vUv - farOffset).rgb * 0.08;
        shiftedColor += texture2D(tDiffuse, vUv + vec2(farOffset.x, -farOffset.y)).rgb * 0.08;
        shiftedColor += texture2D(tDiffuse, vUv + vec2(-farOffset.x, farOffset.y)).rgb * 0.08;
      } else {
        float r = texture2D(tDiffuse, vUv + vec2(currentShift * horzQuadrant, currentShift * vertQuadrant)).r;
        float g = texture2D(tDiffuse, vUv).g;
        float b = texture2D(tDiffuse, vUv - vec2(currentShift * horzQuadrant, currentShift * vertQuadrant)).b;
        shiftedColor = vec3(r, g, b);
      }
      float darken = 1.0 - vignetteFactor * 0.34;

      gl_FragColor = vec4(shiftedColor * darken, 1.0);
    }
  `,
};

type TrailPoint = {
  age: number;
  distDelta: number;
  x: number;
  z: number;
};

function overrideVertexShader(vertexShader: string) {
  return vertexShader
    .replace(
      '#include <common>',
      `#include <common>
      varying float vHeight;
      attribute vec2 aOffset;
      uniform sampler2D uTrailTexture;
      uniform int uTrailCount;
      uniform float uWaveSpeed;
      uniform float uWaveFreq;
      uniform float uWaveWidth;
      uniform float uFadeTime;
      uniform float uAmplitude;
      uniform float uJitter;
      uniform float uMaxHeight;

      vec2 hash2(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return fract(sin(p) * 43758.5453123) - 0.5;
      }`
    )
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>

      vHeight = 0.0;

      if (position.y > 0.0) {
        vec2 jitter = hash2(aOffset) * uJitter;
        vec2 worldXZ = aOffset + jitter;
        float waveHeight = 0.0;
        float totalWeight = 0.0;

        for (int i = 0; i < uTrailCount; i++) {
          vec4 td = texture2D(uTrailTexture, vec2((float(i) + 0.5) / 128.0, 0.5));
          float dist = length(worldXZ - td.rg);
          float wavefront = uWaveSpeed * td.b;
          float relDist = dist - wavefront;
          float window = exp(-(relDist * relDist) / (uWaveWidth * uWaveWidth));
          float fade = exp(-td.b / uFadeTime);
          float atten = 1.0 / (1.0 + dist * 0.1);
          float weight = fade * window * atten * td.a;

          waveHeight += weight * cos(uWaveFreq * relDist);
          totalWeight += weight;
        }

        waveHeight /= max(totalWeight, 1.0);

        float displacement = clamp(waveHeight * uAmplitude, -uMaxHeight, uMaxHeight);
        transformed.y += displacement;
        vHeight = displacement;
      }`
    );
}

export function WaveGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    try {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f7f4e9');

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas,
    });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.55;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor('#f7f4e9');

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    camera.up.set(0, 0, -1);
    scene.add(camera);

    const ambientLight = new THREE.AmbientLight('#ffffff', 0.65);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight('#ffffff', 4);
    directionalLight.position.set(-20, 10, 6);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(512, 512);
    directionalLight.shadow.radius = 6;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 60;
    directionalLight.shadow.camera.left = -22;
    directionalLight.shadow.camera.right = 22;
    directionalLight.shadow.camera.top = 22;
    directionalLight.shadow.camera.bottom = -22;
    directionalLight.shadow.bias = 0.0001;
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight('#ffffff', 1);
    directionalLight2.position.set(10, 5, -3);
    scene.add(directionalLight2);

    const gridSize = window.innerWidth < 768 ? 32 : 40;
    const cubeWidth = 0.8;
    const cubeHeight = 3;
    const gap = 0.01;
    const bounds = gridSize * (cubeWidth + gap);
    const count = gridSize * gridSize;
    const geometry = new THREE.BoxGeometry(cubeWidth, cubeHeight, cubeWidth);
    const offsets = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2);
    geometry.setAttribute('aOffset', offsets);

    const trail: TrailPoint[] = [];
    const trailData = new Float32Array(MAX_TRAIL * 4);
    const trailTexture = new THREE.DataTexture(
      trailData,
      MAX_TRAIL,
      1,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    trailTexture.needsUpdate = true;

    const trailUniforms = {
      uFadeTime: { value: 2 },
      uTrailCount: { value: 0 },
      uTrailTexture: { value: trailTexture },
    };

    const waveParams = {
      colorBase: '#fbf8ed',
      colorHigh: '#ffe16a',
      waveAmplitude: 0.4,
      waveFrequency: 1.2,
      waveJitter: 0.2,
      waveMaxHeight: 0.4,
      waveSpeed: 6,
      waveWidth: 3,
    };

    const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
    material.onBeforeCompile = shader => {
      shader.uniforms.uTrailTexture = trailUniforms.uTrailTexture;
      shader.uniforms.uTrailCount = trailUniforms.uTrailCount;
      shader.uniforms.uFadeTime = trailUniforms.uFadeTime;
      shader.uniforms.uWaveSpeed = { value: waveParams.waveSpeed };
      shader.uniforms.uWaveFreq = { value: waveParams.waveFrequency };
      shader.uniforms.uWaveWidth = { value: waveParams.waveWidth };
      shader.uniforms.uAmplitude = { value: waveParams.waveAmplitude };
      shader.uniforms.uJitter = { value: waveParams.waveJitter };
      shader.uniforms.uMaxHeight = { value: waveParams.waveMaxHeight };
      shader.uniforms.uColorBase = { value: new THREE.Color(waveParams.colorBase) };
      shader.uniforms.uColorHigh = { value: new THREE.Color(waveParams.colorHigh) };
      shader.vertexShader = overrideVertexShader(shader.vertexShader);
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          varying float vHeight;
          uniform vec3 uColorBase;
          uniform vec3 uColorHigh;
          uniform float uMaxHeight;`
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>
          float t = clamp(vHeight / uMaxHeight, 0.0, 1.0);
          diffuseColor.rgb = mix(uColorBase, uColorHigh, t);`
        );
    };

    const depthMaterial = new THREE.MeshDepthMaterial();
    depthMaterial.onBeforeCompile = shader => {
      shader.uniforms.uTrailTexture = trailUniforms.uTrailTexture;
      shader.uniforms.uTrailCount = trailUniforms.uTrailCount;
      shader.uniforms.uFadeTime = trailUniforms.uFadeTime;
      shader.uniforms.uWaveSpeed = { value: waveParams.waveSpeed };
      shader.uniforms.uWaveFreq = { value: waveParams.waveFrequency };
      shader.uniforms.uWaveWidth = { value: waveParams.waveWidth };
      shader.uniforms.uAmplitude = { value: waveParams.waveAmplitude };
      shader.uniforms.uJitter = { value: waveParams.waveJitter };
      shader.uniforms.uMaxHeight = { value: waveParams.waveMaxHeight };
      shader.vertexShader = overrideVertexShader(shader.vertexShader);
    };

    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.customDepthMaterial = depthMaterial;
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;
    scene.add(instancedMesh);

    const dummy = new THREE.Object3D();
    const spacing = cubeWidth + gap;
    const offset = ((gridSize - 1) * spacing) / 2;
    for (let i = 0; i < gridSize; i += 1) {
      for (let j = 0; j < gridSize; j += 1) {
        const index = i * gridSize + j;
        const x = i * spacing - offset;
        const z = j * spacing - offset;
        dummy.position.set(x, 0, z);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(index, dummy.matrix);
        offsets.setXY(index, x, z);
      }
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    offsets.needsUpdate = true;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const rgbShiftPass = new ShaderPass(VIGNETTE_RGB_SHIFT_SHADER);
    composer.addPass(rgbShiftPass);
    composer.addPass(new OutputPass());

    const mouse = new THREE.Vector2(0, 0);
    const lerpedMouse = new THREE.Vector2(0, 0);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();
    const hit = new THREE.Vector3();
    let lastTrailPoint: { x: number; z: number } | null = null;
    let animationFrame = 0;
    let lastTime = performance.now();
    let randomPointTimer = 1.5;
    let timeSinceLastMove = 3;
    let isPlacingRandomPoints = true;
    let isVisible = document.visibilityState === 'visible';
    const scrollRoot = document.querySelector<HTMLElement>('[data-landing-scroll-root]');
    let isContentMode = Boolean(
      scrollRoot && scrollRoot.scrollTop >= scrollRoot.clientHeight * 0.95
    );
    canvas.classList.toggle('wave-grid-background--content', isContentMode);
    rgbShiftPass.uniforms.blurAmount.value = isContentMode ? CONTENT_BLUR_RADIUS : 0;
    rgbShiftPass.uniforms.shiftAmount.value = isContentMode ? 0 : HERO_RGB_SHIFT;

    const addTrailPoint = (x: number, z: number, distDelta: number) => {
      if (trail.length >= MAX_TRAIL) trail.shift();
      trail.push({ age: 0, distDelta, x, z });
    };

    const addRandomPoint = () => {
      addTrailPoint(
        (Math.random() * 0.5 - 0.25) * bounds,
        (Math.random() * 0.5 - 0.25) * bounds,
        0.8 + Math.random() * 0.2
      );
    };

    const setSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatio = Math.min(
        window.devicePixelRatio,
        isContentMode ? CONTENT_PIXEL_RATIO : HERO_PIXEL_RATIO
      );
      renderer.setSize(width, height);
      renderer.setPixelRatio(pixelRatio);
      composer.setSize(width, height);
      composer.setPixelRatio(pixelRatio);
      rgbShiftPass.uniforms.texelSize.value.set(
        1 / Math.max(1, width * pixelRatio),
        1 / Math.max(1, height * pixelRatio)
      );
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const updateRenderMode = () => {
      if (!scrollRoot) return;

      const nextContentMode = scrollRoot.scrollTop >= scrollRoot.clientHeight * 0.95;
      if (nextContentMode === isContentMode) return;

      isContentMode = nextContentMode;
      canvas.classList.toggle('wave-grid-background--content', isContentMode);
      rgbShiftPass.uniforms.blurAmount.value = isContentMode ? CONTENT_BLUR_RADIUS : 0;
      rgbShiftPass.uniforms.shiftAmount.value = isContentMode ? 0 : HERO_RGB_SHIFT;
      lastTime = performance.now();
      setSize();
    };

    const updateCamera = () => {
      lerpedMouse.x += (mouse.x - lerpedMouse.x) * 0.04;
      lerpedMouse.y += (mouse.y - lerpedMouse.y) * 0.04;
      const radius = 12;
      const alpha = lerpedMouse.y * Math.PI * 0.03;
      const beta = lerpedMouse.x * Math.PI * 0.05;

      camera.position.set(
        -radius * Math.cos(alpha) * Math.sin(beta),
        radius * Math.cos(alpha) * Math.cos(beta),
        radius * Math.sin(alpha)
      );
      camera.lookAt(0, 0, 0);
    };

    const onPointerMove = (event: PointerEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (!raycaster.ray.intersectPlane(plane, hit)) return;

      const { x, z } = hit;
      let distDelta = 0;
      if (lastTrailPoint) {
        const dx = x - lastTrailPoint.x;
        const dz = z - lastTrailPoint.z;
        distDelta = Math.sqrt(dx * dx + dz * dz);
        if (distDelta < 0.1) return;
      }

      addTrailPoint(x, z, distDelta);
      lastTrailPoint = { x, z };
      timeSinceLastMove = 0;
      isPlacingRandomPoints = false;
      randomPointTimer = 0;
    };

    const updateTrail = (delta: number) => {
      const expiry = trailUniforms.uFadeTime.value * 4;
      for (let i = trail.length - 1; i >= 0; i -= 1) {
        trail[i].age += delta;
        if (trail[i].age > expiry) trail.splice(i, 1);
      }

      timeSinceLastMove += delta;
      if (timeSinceLastMove >= 3 && !isPlacingRandomPoints) {
        isPlacingRandomPoints = true;
        randomPointTimer = 0;
      }

      if (isPlacingRandomPoints) {
        randomPointTimer += delta;
        if (randomPointTimer >= 1.5) {
          addRandomPoint();
          randomPointTimer = 0;
        }
      }

      const liveCount = Math.min(trail.length, MAX_TRAIL);
      for (let i = 0; i < liveCount; i += 1) {
        const dataIndex = i * 4;
        trailData[dataIndex] = trail[i].x;
        trailData[dataIndex + 1] = trail[i].z;
        trailData[dataIndex + 2] = trail[i].age;
        trailData[dataIndex + 3] = trail[i].distDelta;
      }
      trailTexture.needsUpdate = true;
      trailUniforms.uTrailCount.value = liveCount;
    };

    const tick = (now: number) => {
      try {
        if (isVisible && isContentMode && now - lastTime < CONTENT_FRAME_INTERVAL) {
          animationFrame = window.requestAnimationFrame(tick);
          return;
        }

        const delta = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        if (isVisible) {
          updateCamera();
          updateTrail(delta);
          composer.render();
        }
        animationFrame = window.requestAnimationFrame(tick);
      } catch (error) {
        console.warn('Wave grid background disabled after a render error.', error);
      }
    };

    const onVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible';
      lastTime = performance.now();
    };

    setSize();
    updateCamera();
    window.addEventListener('resize', setSize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    scrollRoot?.addEventListener('scroll', updateRenderMode, { passive: true });
    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', setSize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      scrollRoot?.removeEventListener('scroll', updateRenderMode);
      canvas.classList.remove('wave-grid-background--content');
      composer.dispose();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      depthMaterial.dispose();
      trailTexture.dispose();
    };
    } catch (error) {
      console.warn('Wave grid background disabled.', error);
      return undefined;
    }
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="wave-grid-background" />;
}
