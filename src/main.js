import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import fragmentShader from './shaders/plane.frag?raw';
import vertexShader from './shaders/plane.vert?raw';
import {
  SPEECH_BUBBLE_MIN_HEIGHT,
  SPEECH_BUBBLE_MIN_WIDTH,
  SPEECH_BUBBLE_TEXT_PAD_X,
  SPEECH_BUBBLE_TEXT_PAD_Y,
  buildSpeechBubbleSvg,
  buildThoughtBubbleSvg,
  clamp,
  getSpeechBubbleExit,
  getResponsiveBubbleMaxWidth
} from './speechBubble.js';
import gsap from 'gsap';
import './style.css';
import defaultPanorama from '/panoramas/Fort.png'
import earthTexturePath from '/textures/world.jpg'
import trinidadPanorama from '/panoramas/trini.png'
import rotaPanorama from '/panoramas/rotaN.png'
import playaPanorama from '/panoramas/41y42N.png'
import centroHabanaPanorama from '/panoramas/centroH.png'
import domingoCharacter from '/characters/Domingo.png'
import pacoCharacter from '/characters/Paco.png'
import martaNoraCharacter from '/characters/MartaNora.png'
import maniseraCharacter from '/characters/manisera.png'
import yanislaidisCharacter from '/characters/Yanislaidis.png'

const PANORAMA_HORIZONTAL_VIEW_LIMIT = THREE.MathUtils.degToRad(170);
const PANORAMA_HORIZONTAL_VIEW_LIMIT_MOBILE = THREE.MathUtils.degToRad(244);
const PANORAMA_VERTICAL_VIEW_LIMIT = THREE.MathUtils.degToRad(50);
const PANORAMA_HALF_VERTICAL_VIEW_LIMIT = PANORAMA_VERTICAL_VIEW_LIMIT * 0.5;
const PANORAMA_CAMERA_RADIUS = 2;
const SPEECH_BUBBLE_TAIL_OFFSET = 36;
const SPEECH_BUBBLE_REVEAL_DELAY_SHORT = 34;
const SPEECH_BUBBLE_REVEAL_DELAY_LONG = 24;
const SPEECH_BUBBLE_REVEAL_PAUSE_SOFT = 34;
const SPEECH_BUBBLE_REVEAL_PAUSE_HARD = 62;
const SPEECH_BUBBLE_STREAM_DELAY = 18;
const SPEECH_BUBBLE_STREAM_BATCH = 2;
const SPEECH_BUBBLE_STREAM_CATCHUP_THRESHOLD = 90;
const PLANET_DRAG_DAMPING = 0.88;
const PLANET_DRAG_RESPONSE = 1 - PLANET_DRAG_DAMPING;
const PLANET_DRAG_EPSILON = 0.00001;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const BETA_ACCESS_REQUIRED = import.meta.env.VITE_BETA_ACCESS_REQUIRED === 'true';
const BETA_ACCESS_CODE_STORAGE_KEY = 'planeta-barrio-beta-access-code';
const AMBIENT_AUDIO_STORAGE_KEY = 'planeta-barrio-ambient-audio-enabled';
const AMBIENT_AUDIO_FADE_SECONDS = 1.2;

function getCityTransform(lat, lon){
  var phi = (lat * Math.PI/180);
  var theta = (lon + 180) * Math.PI/180;
  var theta1 = (270 - lon) * (Math.PI/180);
  let x = -(Math.cos(phi)* Math.cos(theta));
  let z = (Math.cos(phi)* Math.sin(theta));
  let y = (Math.sin(phi));
  let vector = {x, y, z};
  let euler = new THREE.Euler(phi, theta1, 0, 'XYZ');
  let quaternion = new THREE.Quaternion().setFromEuler(euler)
  return {vector, quaternion};
}

function getPanoramaHalfHorizontalViewLimit(width, height){
  const isCompact = width < 720;
  const isPortrait = height > width;
  const horizontalLimit = isCompact && isPortrait
    ? PANORAMA_HORIZONTAL_VIEW_LIMIT_MOBILE
    : PANORAMA_HORIZONTAL_VIEW_LIMIT;

  return horizontalLimit * 0.5;
}

let cityPoints = [
  {
    title: 'Habana',
    coords: {lat: 23.1303, lng: -82.3531},
    texture: defaultPanorama,
    view: {yaw: -78, pitch: 0},
    audio: {
      ambient: '/audio/habana-portal.mp3',
      volume: 0.58,
      label: 'Portal de La Habana'
    },
    character: {
      agentId: 'domingo',
      name: 'Domingo',
      texture: domingoCharacter,
      yawOffset: 20,
      pitch: -130,
      distance: 3.9,
      height: 6.2,
      feetOffset: 2.0,
      aspect: 448 / 558,
      bubble: {
        side: 'left',
        tailX: 0.06,
        anchorX: 2.5,
        anchorY: 1.86,
        tailY: 0.82,
        offset: 150
      }
    }
  },
  {
    title: 'Rota',
    coords: {
      lat: 36.62364 ,
      lng: -6.35997
    },
    texture: rotaPanorama,
    view: {yaw: -110, pitch: -12},
    audio: {
      ambient: '/audio/rota-calle.mp3',
      volume: 0.12,
      label: 'Calle de Rota'
    },
    character: {
      agentId: 'paco',
      name: 'Paco',
      texture: pacoCharacter,
      yawOffset: 0,
      pitch: -50,
      distance: 2.9,
      height: 5.6,
      feetOffset: 2.2,
      aspect: 448 / 558,
      bubble: {
        side: 'left',
        tailX: 0.1,
        anchorX: 27.35,
        anchorY: 12.14,
        tailY: 0.82,
        offset: 160
      }
    }
  },
  {
    title: 'Trinidad',
    coords: {
      lat: 21.80224,
      lng: -79.98467
    },
    texture: trinidadPanorama,
    view: {yaw: -80, pitch: -10},
    audio: {
      ambient: '/audio/trinidad-tarde.mp3',
      volume: 0.2,
      label: 'Tarde en Trinidad'
    },
    character: {
      agentId: 'yanislaidis',
      name: 'Yanislaidis',
      texture: yanislaidisCharacter,
      yawOffset: -48,
      pitch: -50,
      distance: 2.9,
      height: 6.9,
      feetOffset: 2.5,
      aspect: 832 / 1248,
      bubble: {
        side: 'right',
        tailX: 0.1,
        anchorX: 1.35,
        anchorY: 1.14,
        tailY: 0.82,
        offset: 100
      }
    }
  },
   {
    title: 'Habana-41y42',
    coords: {
      lat: 23.1103,
      lng: -82.4318
    },
    texture: playaPanorama,
    view: {yaw: -120, pitch: -17},
    audio: {
      ambient: '/audio/habana-41y42-vecinos.mp3',
      volume: 0.08,
      label: '41 y 42'
    },
    character: {
      agentId: 'marta-nora',
      name: 'Marta Nora',
      texture: martaNoraCharacter,
      yawOffset: -32,
      pitch: -29,
      distance: 4.5,
      height: 6.4,
      feetOffset: 3.5,
      aspect: 832 / 1248,
      bubble: {
        side: 'left',
        tailX: 0.2,
        anchorX: 2.38,
        anchorY: 1.82,
        tailY: 0.82,
        offset: 122
      }
    }
  },
   {
    title: 'Habana-centro',
    coords: {
      lat: 23.13833,
      lng: -82.36417
    },
    texture: centroHabanaPanorama,
    view: {yaw: -80, pitch: -10},
    audio: {
      ambient: '/audio/centro-habana-pregon.mp3',
      volume: 0.32,
      label: 'Centro Habana'
    },
    character: {
      agentId: 'manisera',
      name: 'La manisera',
      texture: maniseraCharacter,
      yawOffset: 0,
      pitch: -50,
      distance: 2.9,
      height: 6.3,
      feetOffset: 2.3,
      aspect: 408 / 612,
      bubble: {
        side: 'left',
        tailX: 0.12,
        anchorX: 1.25,
        anchorY: 1.14,
        tailY: 0.84,
        offset: 100
      }
    }
  },
]

export default class WorldTour{
  constructor(options) {
    this.panoramaScene = new THREE.Scene();
    this.planetScene = new THREE.Scene();
    this.compositeScene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.textureLoader = new THREE.TextureLoader();
    this.textureCache = {};
    this.characterTextureCache = {};
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.style.touchAction = 'none';

    this.container.appendChild(this.renderer.domElement);

    this.planetCamera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.001, 1000);
    this.panoramaCamera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.001, 1000);
    var frustumSize = 1; 
    var aspect = window.innerWidth / window.innerHeight;
    this.compositeCamera = new THREE.OrthographicCamera(frustumSize / -2, frustumSize / 2, frustumSize / 2, frustumSize / -2, -1000, 1000);
    this.planetCamera.position.set(0, 0, 2);
    this.panoramaCamera.position.set(0, 0, 2);
    this.planetControls = new OrbitControls(this.planetCamera, this.renderer.domElement);
    this.planetControls.enabled = false;
    this.panoramaControls = new OrbitControls(this.panoramaCamera, this.renderer.domElement); 
    this.panoramaControls.enableDamping = true;
    this.panoramaControls.dampingFactor = 0.08;
    this.panoramaControls.enabled = false;
    this.time = 0;

    this.isPlaying = true;
    this.isInsideCity = false;
    this.isTransitioning = false;
    this.isDraggingPlanet = false;
    this.dragDistance = 0;
    this.previousPointer = new THREE.Vector2();
    this.planetDragDelta = new THREE.Vector2();
    this.currentPanoramaTexture = defaultPanorama;
    this.characterMesh = null;
    this.activeCity = null;
    this.chatSessionId = this.getChatSessionId();
    this.betaAccessRequired = BETA_ACCESS_REQUIRED;
    this.betaAccessCode = this.getBetaAccessCode();
    this.ambientAudioEnabled = this.getAmbientAudioEnabled();
    this.ambientAudioGestureGranted = false;
    this.ambientAudioElement = null;
    this.ambientAudioSource = '';
    this.ambientAudioStatus = 'idle';
    this.currentView = null;
    this.brandTitleCompactMode = null;
    this.brandTitleTimeline = null;
    this.dialogLoading = false;
    this.speechBubbleVariant = 'tail';
    this.speechBubbleVisible = false;
    this.speechBubbleTyping = false;
    this.speechBubbleText = '';
    this.speechBubbleRenderedText = '';
    this.speechBubbleRevealTimeout = null;
    this.speechBubbleRevealToken = 0;
    this.speechBubbleStreamTimeout = null;
    this.speechBubbleStreamToken = 0;
    this.speechBubbleStreamResolve = null;
    this.speechBubbleSize = {w: SPEECH_BUBBLE_MIN_WIDTH, h: SPEECH_BUBBLE_MIN_HEIGHT};
    this.speechTailWorld = new THREE.Vector3();
    this.speechAnchorWorld = new THREE.Vector3();
    this.speechTailNdc = new THREE.Vector3();
    this.speechAnchorNdc = new THREE.Vector3();
    this.speechTailLocal = new THREE.Vector3();
    this.speechAnchorLocal = new THREE.Vector3();
    this.speechTailCenterLocal = new THREE.Vector3();
    this.speechTailCenterWorld = new THREE.Vector3();
    this.speechTailCenterNdc = new THREE.Vector3();
    this.speechAnchorDirectionNdc = new THREE.Vector3();

    this.createDialogueUI();
    this.createBrandTitleUI();
    this.createPanoramaScene();
    this.preloadPanoramaTextures();
    this.createPlanet();
    this.setupPlanetDrag();
    this.createCompositeScene();
    this.setupTransitionState();
    this.resize();
    this.setupResize();
    this.setupKeyboard();
    this.updateControls();
    this.render();
  }
 
setupTransitionState(){ 
    this.transition = { progress: 0 };
  }

setupResize(){
  window.addEventListener("resize", this.resize.bind(this));
}

setupKeyboard(){
  window.addEventListener("keydown", (e) => {
    if(e.key === "Escape"){
      this.exitCity();
    }
  });
}

getChatSessionId(){
  const storageKey = 'planeta-barrio-session-id';
  const existing = window.localStorage?.getItem(storageKey);

  if(existing) return existing;

  const nextId = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage?.setItem(storageKey, nextId);
  return nextId;
}

getBetaAccessCode(){
  return window.localStorage?.getItem(BETA_ACCESS_CODE_STORAGE_KEY) || '';
}

setBetaAccessCode(code){
  this.betaAccessCode = code.trim();

  if(this.betaAccessCode){
    window.localStorage?.setItem(BETA_ACCESS_CODE_STORAGE_KEY, this.betaAccessCode);
    return;
  }

  window.localStorage?.removeItem(BETA_ACCESS_CODE_STORAGE_KEY);
}

getAmbientAudioEnabled(){
  return window.localStorage?.getItem(AMBIENT_AUDIO_STORAGE_KEY) === 'true';
}

setAmbientAudioEnabled(enabled){
  this.ambientAudioEnabled = Boolean(enabled);
  window.localStorage?.setItem(AMBIENT_AUDIO_STORAGE_KEY, this.ambientAudioEnabled ? 'true' : 'false');
  this.updateAmbientAudioButton();
}

getAmbientAudioVolume(city = this.activeCity){
  return clamp(city?.audio?.volume ?? 0.28, 0, 1);
}

createDialogueUI(){
  const bubble = document.createElement('div');
  bubble.className = 'speech-bubble';
  bubble.dataset.variant = this.speechBubbleVariant;
  bubble.style.width = `${this.speechBubbleSize.w}px`;
  bubble.style.height = `${this.speechBubbleSize.h}px`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('speech-bubble__svg');
  svg.setAttribute('aria-hidden', 'true');

  const textLayer = document.createElement('div');
  textLayer.className = 'speech-bubble__text-layer';

  const text = document.createElement('p');
  text.className = 'speech-bubble__text';
  textLayer.appendChild(text);

  const measure = document.createElement('div');
  measure.className = 'speech-bubble__measure';

  const measureText = document.createElement('p');
  measureText.className = 'speech-bubble__text';
  measure.appendChild(measureText);

  bubble.appendChild(svg);
  bubble.appendChild(textLayer);
  bubble.appendChild(measure);
  document.body.appendChild(bubble);

  const form = document.createElement('form');
  form.className = 'dialog-input';
  form.hidden = true;

  const variants = document.createElement('div');
  variants.className = 'dialog-input__variants';

  const variantA = document.createElement('button');
  variantA.className = 'dialog-input__variant';
  variantA.type = 'button';
  variantA.innerText = 'A';
  variantA.setAttribute('aria-label', 'Burbuja A');
  variantA.setAttribute('aria-pressed', 'false');

  const variantB = document.createElement('button');
  variantB.className = 'dialog-input__variant is-active';
  variantB.type = 'button';
  variantB.innerText = 'B';
  variantB.setAttribute('aria-label', 'Burbuja B');
  variantB.setAttribute('aria-pressed', 'true');

  variantA.addEventListener('click', () => {
    this.setSpeechBubbleVariant('thought');
  });

  variantB.addEventListener('click', () => {
    this.setSpeechBubbleVariant('tail');
  });

  variants.appendChild(variantA);
  variants.appendChild(variantB);

  const input = document.createElement('input');
  input.className = 'dialog-input__field';
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = true;

  const button = document.createElement('button');
  button.className = 'dialog-input__send';
  button.type = 'submit';
  button.innerText = '→';
  button.setAttribute('aria-label', 'Enviar');
  button.disabled = true;

  input.addEventListener('input', () => {
    button.disabled = !input.value.trim();
  });

  form.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    this.submitDialogueMessage();
  });

  form.appendChild(variants);
  form.appendChild(input);
  form.appendChild(button);
  document.body.appendChild(form);

  const betaOverlay = document.createElement('div');
  betaOverlay.className = 'beta-access';
  betaOverlay.hidden = true;

  const betaForm = document.createElement('form');
  betaForm.className = 'beta-access__form';

  const betaTitle = document.createElement('h1');
  betaTitle.className = 'beta-access__title';
  betaTitle.textContent = 'Planeta Barrio';

  const betaText = document.createElement('p');
  betaText.className = 'beta-access__text';
  betaText.textContent = 'Código de acceso';

  const betaInput = document.createElement('input');
  betaInput.className = 'beta-access__field';
  betaInput.type = 'password';
  betaInput.autocomplete = 'current-password';
  betaInput.placeholder = 'Código';
  betaInput.setAttribute('aria-label', 'Código de acceso');

  const betaMessage = document.createElement('p');
  betaMessage.className = 'beta-access__message';

  const betaButton = document.createElement('button');
  betaButton.className = 'beta-access__button';
  betaButton.type = 'submit';
  betaButton.textContent = 'Entrar';

  betaForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const code = betaInput.value.trim();

    if(!code){
      betaMessage.textContent = 'Escribe el código para entrar.';
      betaInput.focus();
      return;
    }

    this.setBetaAccessCode(code);
    this.hideBetaAccessGate();
  });

  betaForm.appendChild(betaTitle);
  betaForm.appendChild(betaText);
  betaForm.appendChild(betaInput);
  betaForm.appendChild(betaMessage);
  betaForm.appendChild(betaButton);
  betaOverlay.appendChild(betaForm);
  document.body.appendChild(betaOverlay);

  this.speechBubbleElement = bubble;
  this.speechBubbleSvg = svg;
  this.speechBubbleTextElement = text;
  this.speechBubbleMeasure = measure;
  this.speechBubbleMeasureText = measureText;
  this.dialogForm = form;
  this.dialogInput = input;
  this.dialogSendButton = button;
  this.betaAccessElement = betaOverlay;
  this.betaAccessInput = betaInput;
  this.betaAccessMessage = betaMessage;
  this.speechBubbleVariantButtons = {
    thought: variantA,
    tail: variantB
  };

  if(this.betaAccessRequired && !this.betaAccessCode){
    this.showBetaAccessGate();
  }

  this.updateDialogueUI();
}

createBrandTitleUI(){
  const title = document.createElement('div');
  title.className = 'brand-title';
  title.setAttribute('aria-hidden', 'true');

  const inner = document.createElement('div');
  inner.className = 'brand-title__inner';

  const line = document.createElement('span');
  line.className = 'brand-title__line';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'brand-title__eyebrow';
  eyebrow.textContent = 'Atlas de Voces';

  const name = document.createElement('h1');
  name.className = 'brand-title__name';
  name.textContent = 'Planeta Barrio';

  inner.appendChild(line);
  inner.appendChild(eyebrow);
  inner.appendChild(name);
  title.appendChild(inner);
  document.body.appendChild(title);

  this.brandTitleElement = title;
  this.brandTitleInner = inner;
  this.brandTitleLine = line;
  this.brandTitleEyebrow = eyebrow;
  this.brandTitleName = name;
}

isBrandTitleCompactMode(){
  return this.width < 720 && this.height > this.width;
}

clearBrandTitleAnimationStyles(){
  if(!this.brandTitleElement) return;

  if(this.brandTitleTimeline){
    this.brandTitleTimeline.kill();
    this.brandTitleTimeline = null;
  }

  const animatedTargets = [
    this.brandTitleElement,
    this.brandTitleInner,
    this.brandTitleLine,
    this.brandTitleEyebrow,
    this.brandTitleName
  ];

  gsap.killTweensOf(animatedTargets);
  gsap.set(this.brandTitleElement, {clearProps: 'opacity,visibility,filter'});
  gsap.set(this.brandTitleInner, {clearProps: 'opacity,visibility,y'});
  gsap.set(this.brandTitleLine, {clearProps: 'opacity,scaleX,transformOrigin,y'});
  gsap.set([this.brandTitleEyebrow, this.brandTitleName], {clearProps: 'opacity,y'});
  this.brandTitleElement.classList.remove('is-animated');
}

playBrandTitleIntro(){
  if(!this.brandTitleElement) return;

  this.clearBrandTitleAnimationStyles();

  const title = this.brandTitleElement;
  const inner = this.brandTitleInner;
  const line = this.brandTitleLine;
  const eyebrow = this.brandTitleEyebrow;
  const name = this.brandTitleName;

  title.classList.remove('is-compact');
  title.classList.add('is-visible', 'is-animated');

  gsap.set(title, {opacity: 0, visibility: 'visible', filter: 'blur(10px)'});
  gsap.set(inner, {y: -10});
  gsap.set(line, {opacity: 0, scaleX: 0.62, transformOrigin: 'center center'});
  gsap.set(eyebrow, {opacity: 0, y: 12});
  gsap.set(name, {opacity: 0, y: 18});

  this.brandTitleTimeline = gsap.timeline({
    defaults: {ease: 'power2.out'},
    onComplete: () => {
      this.brandTitleTimeline = null;
      title.classList.remove('is-visible', 'is-animated');
      this.clearBrandTitleAnimationStyles();
    }
  });

  this.brandTitleTimeline
    .to(title, {opacity: 1, filter: 'blur(0px)', duration: 0.45}, 0)
    .to(inner, {y: 0, duration: 0.55}, 0)
    .to(line, {opacity: 0.9, scaleX: 1, duration: 0.58}, 0.02)
    .to(eyebrow, {opacity: 0.84, y: 0, duration: 0.42}, 0.08)
    .to(name, {opacity: 1, y: 0, duration: 0.52}, 0.14)
    .to({}, {duration: 1.15})
    .add('out')
    .to([eyebrow, name], {opacity: 0, y: -8, duration: 0.36, ease: 'power2.in'}, 'out')
    .to(line, {opacity: 0, scaleX: 1.14, duration: 0.34, ease: 'power2.in'}, 'out')
    .to(title, {opacity: 0, filter: 'blur(8px)', duration: 0.4, ease: 'power2.in'}, 'out');
}

updateBrandTitleState({previousView = this.currentView, force = false} = {}){
  if(!this.brandTitleElement) return;

  const view = this.currentView || document.body.dataset.view || 'planet';
  const isCompactMode = this.isBrandTitleCompactMode();
  const supportsDesktopIntro = this.width >= 720;

  this.brandTitleCompactMode = isCompactMode;

  if(isCompactMode){
    this.clearBrandTitleAnimationStyles();
    this.brandTitleElement.classList.add('is-compact');
    this.brandTitleElement.classList.toggle('is-visible', view === 'planet');
    return;
  }

  this.brandTitleElement.classList.remove('is-compact');

  if(!supportsDesktopIntro){
    this.clearBrandTitleAnimationStyles();
    this.brandTitleElement.classList.remove('is-visible');
    return;
  }

  if(view !== 'planet'){
    this.clearBrandTitleAnimationStyles();
    this.brandTitleElement.classList.remove('is-visible');
    return;
  }

  if(force || previousView !== 'planet'){
    this.playBrandTitleIntro();
  }
}

showBetaAccessGate(message = ''){
  if(!this.betaAccessElement) return;

  this.betaAccessMessage.textContent = message;
  this.betaAccessElement.hidden = false;
  this.betaAccessInput.value = '';
  window.requestAnimationFrame(() => {
    this.betaAccessInput.focus({preventScroll: true});
  });
}

hideBetaAccessGate(){
  if(!this.betaAccessElement) return;

  this.betaAccessElement.hidden = true;
  this.betaAccessMessage.textContent = '';
}

setSpeechBubbleVariant(variant){
  this.speechBubbleVariant = variant;

  Object.entries(this.speechBubbleVariantButtons || {}).forEach(([key, button]) => {
    const isActive = key === variant;

    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  if(this.speechBubbleElement){
    this.speechBubbleElement.dataset.variant = variant;
  }

  this.updateSpeechBubblePosition();
}

updateDialogueUI(){
  if(!this.dialogForm) return;

  const canTalk = this.isInsideCity && !this.isTransitioning && Boolean(this.activeCity?.character);
  const characterName = this.activeCity?.character?.name || this.activeCity?.title || 'el barrio';

  this.dialogForm.hidden = !canTalk;
  this.dialogInput.disabled = !canTalk || this.dialogLoading;
  this.dialogInput.placeholder = `Habla con ${characterName}`;
  this.dialogSendButton.disabled = !canTalk || this.dialogLoading || !this.dialogInput.value.trim();

  if(!canTalk){
    this.dialogInput.value = '';
    this.hideSpeechBubble();
  }
}

async submitDialogueMessage(){
  const text = this.dialogInput.value.trim();

  if(!text || !this.activeCity?.character || this.dialogLoading) return;

  this.dialogInput.value = '';
  this.dialogLoading = true;
  this.updateDialogueUI();
  this.showSpeechBubble('', {typing: true});

  try{
    this.prepareSpeechBubbleStream();

    const reply = await this.sendAgentMessage(text, {
      onDelta: (partialText) => {
        this.updateSpeechBubbleStreamTarget(partialText);
      }
    });

    if(this.speechBubbleText !== reply || this.speechBubbleTyping || this.speechBubbleRenderedText !== reply){
      await this.finishSpeechBubbleStream(reply);
    }else{
      this.showSpeechBubble(reply, {reveal: false});
    }
  }catch(error){
    console.error(error);

    if(error.code === 'beta_access_required'){
      this.showSpeechBubble('Necesito el código de acceso para seguir conversando.', {reveal: false});
      this.showBetaAccessGate('Código no válido o caducado.');
      return;
    }

    if(error.code === 'rate_limited'){
      this.showSpeechBubble('Dame un respiro, que se llenó la acera. Probamos otra vez en un momentico.', {reveal: false});
      return;
    }

    this.showSpeechBubble('Parece que se fue la luz... Dame un momentico, que en cuanto vuelva la corriente seguimos conversando.', {reveal: false});
  }finally{
    this.dialogLoading = false;
    this.updateDialogueUI();

    if(this.betaAccessElement?.hidden !== false){
      this.dialogInput.focus({preventScroll: true});
    }
  }
}

async sendAgentMessage(text, options = {}){
  const headers = {
    'Content-Type': 'application/json'
  };
  const betaAccessCode = this.betaAccessCode || this.getBetaAccessCode();

  if(betaAccessCode){
    headers['X-Beta-Access-Code'] = betaAccessCode;
  }

  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sessionId: this.chatSessionId,
      agentId: this.activeCity.character.agentId,
      message: text,
      stream: true
    })
  });

  if(!response.ok){
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.error || `Chat request failed (${response.status})`);
    error.code = payload.code || null;

    if(response.status === 401 && error.code === 'beta_access_required'){
      this.setBetaAccessCode('');
    }

    throw error;
  }

  const contentType = response.headers.get('content-type') || '';

  if(contentType.includes('text/event-stream') && response.body){
    return this.readAgentMessageStream(response, options);
  }

  const payload = await response.json().catch(() => ({}));

  if(payload.sessionId && payload.sessionId !== this.chatSessionId){
    this.chatSessionId = payload.sessionId;
    window.localStorage?.setItem('planeta-barrio-session-id', payload.sessionId);
  }

  return payload.message?.content || '';
}

async readAgentMessageStream(response, options = {}){
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let donePayload = null;

  const processEvent = (rawEvent) => {
    const lines = rawEvent.split('\n');
    let eventName = 'message';
    const dataLines = [];

    lines.forEach((line) => {
      if(!line || line.startsWith(':')) return;

      if(line.startsWith('event:')){
        eventName = line.slice(6).trim();
        return;
      }

      if(line.startsWith('data:')){
        dataLines.push(line.slice(5).trimStart());
      }
    });

    if(!dataLines.length) return;

    let payload;

    try{
      payload = JSON.parse(dataLines.join('\n'));
    }catch{
      return;
    }

    if(eventName === 'delta'){
      content += payload.content || '';
      options.onDelta?.(content, payload);
      return;
    }

    if(eventName === 'done'){
      donePayload = payload;
      return;
    }

    if(eventName === 'error'){
      const error = new Error(payload.error || 'Stream failed');
      error.code = payload.code || null;
      throw error;
    }
  };

  while(true){
    const {value, done} = await reader.read();

    if(done) break;

    buffer += decoder.decode(value, {stream: true}).replace(/\r\n/g, '\n');

    while(true){
      const boundary = buffer.indexOf('\n\n');

      if(boundary === -1) break;

      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      processEvent(rawEvent);
    }
  }

  if(donePayload?.sessionId && donePayload.sessionId !== this.chatSessionId){
    this.chatSessionId = donePayload.sessionId;
    window.localStorage?.setItem('planeta-barrio-session-id', donePayload.sessionId);
  }

  return donePayload?.message?.content || content;
}

showSpeechBubble(text, options = {}){
  this.clearSpeechBubbleStream();
  this.clearSpeechBubbleReveal();
  this.speechBubbleTyping = Boolean(options.typing);
  this.speechBubbleText = text;
  this.speechBubbleRenderedText = this.speechBubbleTyping ? '' : options.reveal === false ? text : '';
  this.speechBubbleVisible = true;
  this.speechBubbleElement.classList.add('is-visible');
  this.speechBubbleElement.classList.remove('is-offscreen');
  this.updateSpeechBubbleSize();
  this.updateSpeechBubblePosition();

  if(!this.speechBubbleTyping && options.reveal !== false){
    this.startSpeechBubbleReveal();
  }
}

hideSpeechBubble(){
  this.clearSpeechBubbleStream();
  this.clearSpeechBubbleReveal();
  this.speechBubbleVisible = false;
  this.speechBubbleTyping = false;
  this.speechBubbleText = '';
  this.speechBubbleRenderedText = '';

  if(this.speechBubbleElement){
    this.speechBubbleElement.classList.remove('is-visible');
    this.speechBubbleElement.classList.remove('is-offscreen');
  }

  if(this.speechBubbleTextElement){
    this.speechBubbleTextElement.textContent = '';
  }
}

updateSpeechBubbleSize(){
  if(!this.speechBubbleMeasure || !this.speechBubbleTextElement) return;

  const maxWidth = getResponsiveBubbleMaxWidth(this.width);
  const typingHtml = '<span></span><span></span><span></span>';

  this.speechBubbleMeasureText.classList.toggle('speech-bubble__typing', this.speechBubbleTyping);
  this.speechBubbleTextElement.classList.toggle('speech-bubble__typing', this.speechBubbleTyping);

  if(this.speechBubbleTyping){
    this.speechBubbleMeasureText.innerHTML = typingHtml;
    this.speechBubbleTextElement.innerHTML = typingHtml;
  }else{
    this.speechBubbleMeasureText.textContent = this.speechBubbleText;
    this.speechBubbleTextElement.textContent = this.speechBubbleRenderedText;
  }

  this.speechBubbleMeasureText.style.width = 'auto';

  let width = Math.ceil(this.speechBubbleMeasure.scrollWidth + SPEECH_BUBBLE_TEXT_PAD_X);
  width = clamp(width, SPEECH_BUBBLE_MIN_WIDTH, maxWidth);

  const textWidth = Math.max(width - SPEECH_BUBBLE_TEXT_PAD_X, 0);
  this.speechBubbleMeasureText.style.width = `${textWidth}px`;

  let height = Math.ceil(this.speechBubbleMeasure.scrollHeight + SPEECH_BUBBLE_TEXT_PAD_Y);
  height = Math.max(height, SPEECH_BUBBLE_MIN_HEIGHT);

  this.speechBubbleSize = {w: width, h: height};
  this.speechBubbleTextElement.style.width = `${textWidth}px`;
  this.speechBubbleElement.style.width = `${width}px`;
  this.speechBubbleElement.style.height = `${height}px`;
  this.speechBubbleSvg.setAttribute('width', `${width}`);
  this.speechBubbleSvg.setAttribute('height', `${height}`);
  this.speechBubbleSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
}

clearSpeechBubbleReveal(){
  this.speechBubbleRevealToken += 1;

  if(this.speechBubbleRevealTimeout){
    window.clearTimeout(this.speechBubbleRevealTimeout);
    this.speechBubbleRevealTimeout = null;
  }
}

clearSpeechBubbleStream({resolve = true} = {}){
  this.speechBubbleStreamToken += 1;

  if(this.speechBubbleStreamTimeout){
    window.clearTimeout(this.speechBubbleStreamTimeout);
    this.speechBubbleStreamTimeout = null;
  }

  if(resolve && this.speechBubbleStreamResolve){
    this.speechBubbleStreamResolve();
    this.speechBubbleStreamResolve = null;
  }
}

prepareSpeechBubbleStream(){
  this.clearSpeechBubbleStream();
  this.clearSpeechBubbleReveal();
  this.speechBubbleTyping = true;
  this.speechBubbleText = '';
  this.speechBubbleRenderedText = '';
  this.speechBubbleVisible = true;
  this.speechBubbleElement.classList.add('is-visible');
  this.speechBubbleElement.classList.remove('is-offscreen');
  this.updateSpeechBubbleSize();
  this.updateSpeechBubblePosition();
}

updateSpeechBubbleStreamTarget(targetText){
  if(!targetText && !this.speechBubbleText) return;

  const wasTyping = this.speechBubbleTyping;
  this.speechBubbleTyping = false;
  this.speechBubbleText = targetText;
  this.speechBubbleVisible = true;
  this.speechBubbleElement.classList.add('is-visible');
  this.speechBubbleElement.classList.remove('is-offscreen');

  if(wasTyping){
    this.speechBubbleRenderedText = '';
  }

  this.updateSpeechBubbleSize();
  this.updateSpeechBubblePosition();
  this.scheduleSpeechBubbleStreamStep();
}

getSpeechBubbleStreamDelay(previousChar){
  if(/[,:;]$/.test(previousChar)) return SPEECH_BUBBLE_STREAM_DELAY + 28;
  if(/[.!?…]$/.test(previousChar)) return SPEECH_BUBBLE_STREAM_DELAY + 52;

  return SPEECH_BUBBLE_STREAM_DELAY;
}

scheduleSpeechBubbleStreamStep(){
  if(this.speechBubbleStreamTimeout || this.speechBubbleTyping) return;
  if(this.speechBubbleRenderedText.length >= this.speechBubbleText.length) return;

  const streamToken = this.speechBubbleStreamToken;

  const step = () => {
    if(
      streamToken !== this.speechBubbleStreamToken ||
      !this.speechBubbleVisible ||
      this.speechBubbleTyping
    ){
      return;
    }

    const remaining = this.speechBubbleText.length - this.speechBubbleRenderedText.length;
    const batch = remaining > SPEECH_BUBBLE_STREAM_CATCHUP_THRESHOLD
      ? SPEECH_BUBBLE_STREAM_BATCH + 3
      : remaining > 36
        ? SPEECH_BUBBLE_STREAM_BATCH + 1
        : SPEECH_BUBBLE_STREAM_BATCH;
    const nextLength = Math.min(this.speechBubbleRenderedText.length + batch, this.speechBubbleText.length);
    const previousChar = this.speechBubbleText.charAt(nextLength - 1);

    this.speechBubbleRenderedText = this.speechBubbleText.slice(0, nextLength);
    this.speechBubbleTextElement.textContent = this.speechBubbleRenderedText;

    if(nextLength >= this.speechBubbleText.length){
      this.speechBubbleStreamTimeout = null;

      if(this.speechBubbleStreamResolve){
        this.speechBubbleStreamResolve();
        this.speechBubbleStreamResolve = null;
      }

      return;
    }

    this.speechBubbleStreamTimeout = window.setTimeout(
      step,
      this.getSpeechBubbleStreamDelay(previousChar)
    );
  };

  this.speechBubbleStreamTimeout = window.setTimeout(step, SPEECH_BUBBLE_STREAM_DELAY);
}

finishSpeechBubbleStream(finalText){
  this.updateSpeechBubbleStreamTarget(finalText);

  if(this.speechBubbleRenderedText.length >= this.speechBubbleText.length){
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    this.speechBubbleStreamResolve = resolve;
    this.scheduleSpeechBubbleStreamStep();
  });
}

getSpeechBubbleRevealDelay(previousWord, totalWords){
  let delay = totalWords > 18
    ? SPEECH_BUBBLE_REVEAL_DELAY_LONG
    : SPEECH_BUBBLE_REVEAL_DELAY_SHORT;

  if(/[,:;]$/.test(previousWord)){
    delay += SPEECH_BUBBLE_REVEAL_PAUSE_SOFT;
  }else if(/[.!?…]$/.test(previousWord)){
    delay += SPEECH_BUBBLE_REVEAL_PAUSE_HARD;
  }

  return delay;
}

startSpeechBubbleReveal(){
  if(!this.speechBubbleTextElement || this.speechBubbleTyping) return;

  const words = this.speechBubbleText.trim().split(/\s+/).filter(Boolean);

  if(words.length <= 1){
    this.speechBubbleRenderedText = this.speechBubbleText;
    this.speechBubbleTextElement.textContent = this.speechBubbleRenderedText;
    return;
  }

  const revealToken = this.speechBubbleRevealToken;
  let index = 0;

  const revealNextWord = () => {
    if(
      revealToken !== this.speechBubbleRevealToken ||
      !this.speechBubbleVisible ||
      this.speechBubbleTyping
    ){
      return;
    }

    index += 1;
    this.speechBubbleRenderedText = words.slice(0, index).join(' ');
    this.speechBubbleTextElement.textContent = this.speechBubbleRenderedText;

    if(index >= words.length){
      this.speechBubbleRevealTimeout = null;
      return;
    }

    this.speechBubbleRevealTimeout = window.setTimeout(
      revealNextWord,
      this.getSpeechBubbleRevealDelay(words[index - 1], words.length)
    );
  };

  revealNextWord();
}

getCharacterBubblePoints(){
  if(!this.characterMesh || !this.activeCity?.character) return null;

  const character = this.activeCity.character;
  const bubble = character.bubble || {};
  const height = character.height || 2;
  const width = height * (character.aspect || 1);
  const feetOffset = character.feetOffset || 0;
  const side = bubble.side === 'left' ? -1 : 1;
  const tailOffsetX = Math.abs(bubble.tailX ?? 0);
  const tailY = height * (bubble.tailY ?? 0.72) - feetOffset;
  const anchorY = height * (bubble.anchorY ?? 1.14) - feetOffset;
  const anchorX = side * width * (bubble.anchorX ?? 1.35);

  this.characterMesh.updateMatrixWorld(true);

  this.speechTailCenterLocal.set(0, tailY, 0);
  this.speechAnchorLocal.set(anchorX, anchorY, 0);

  this.speechTailCenterWorld.copy(this.speechTailCenterLocal);
  this.speechAnchorWorld.copy(this.speechAnchorLocal);
  this.characterMesh.localToWorld(this.speechTailCenterWorld);
  this.characterMesh.localToWorld(this.speechAnchorWorld);

  this.speechTailCenterNdc.copy(this.speechTailCenterWorld).project(this.panoramaCamera);
  this.speechAnchorDirectionNdc.copy(this.speechAnchorWorld).project(this.panoramaCamera);

  // Mirror the tail from the character center by the bubble side, not by the plane's projected local X axis.
  const anchorScreenDirection = Math.sign(this.speechAnchorDirectionNdc.x - this.speechTailCenterNdc.x) || side;
  const tailX = anchorScreenDirection * width * tailOffsetX;

  this.speechTailLocal.set(tailX, tailY, 0);

  this.speechTailWorld.copy(this.speechTailLocal);
  this.characterMesh.localToWorld(this.speechTailWorld);

  return {
    tail: this.speechTailWorld,
    directionTail: this.speechTailCenterWorld,
    anchor: this.speechAnchorWorld
  };
}

updateSpeechBubblePosition(){
  if(!this.speechBubbleVisible || !this.speechBubbleElement || !this.characterMesh) return;

  const points = this.getCharacterBubblePoints();

  if(!points){
    this.speechBubbleElement.classList.add('is-offscreen');
    return;
  }

  this.speechTailNdc.copy(points.tail).project(this.panoramaCamera);
  this.speechTailCenterNdc.copy(points.directionTail).project(this.panoramaCamera);
  this.speechAnchorNdc.copy(points.anchor).project(this.panoramaCamera);

  const tailX = (this.speechTailNdc.x * 0.5 + 0.5) * this.width;
  const tailY = (this.speechTailNdc.y * -0.5 + 0.5) * this.height;
  const directionTailX = (this.speechTailCenterNdc.x * 0.5 + 0.5) * this.width;
  const directionTailY = (this.speechTailCenterNdc.y * -0.5 + 0.5) * this.height;
  const anchorX = (this.speechAnchorNdc.x * 0.5 + 0.5) * this.width;
  const anchorY = (this.speechAnchorNdc.y * -0.5 + 0.5) * this.height;
  const outsideMargin = Math.max(110, Math.min(this.width, this.height) * 0.18);
  const pointIsBehind = this.speechTailNdc.z < -1 || this.speechTailNdc.z > 1;
  const pointIsOutside =
    tailX < -outsideMargin ||
    tailX > this.width + outsideMargin ||
    tailY < -outsideMargin ||
    tailY > this.height + outsideMargin;

  if(pointIsBehind || pointIsOutside){
    this.speechBubbleElement.classList.add('is-offscreen');
    return;
  }

  if(this.speechBubbleVariant === 'tail'){
    this.positionTailSpeechBubble(tailX, tailY, directionTailX, directionTailY, anchorX, anchorY, outsideMargin);
    return;
  }

  this.positionThoughtSpeechBubble(tailX, tailY, directionTailX, directionTailY, anchorX, anchorY, outsideMargin);
}

getSpeechBubblePlacement(tailX, tailY, directionTailX, directionTailY, anchorX, anchorY, outsideMargin){
  const {w, h} = this.speechBubbleSize;
  const dx = anchorX - directionTailX;
  const dy = anchorY - directionTailY;
  const distance = Math.hypot(dx, dy);

  if(distance < 1) return null;

  const ux = dx / distance;
  const uy = dy / distance;
  const tipAngleDeg = Math.atan2(-uy, -ux) * 180 / Math.PI;
  const exit = getSpeechBubbleExit(tipAngleDeg, w, h);
  const bubble = this.activeCity?.character?.bubble || {};
  const baseOffset = bubble.offset ?? SPEECH_BUBBLE_TAIL_OFFSET;
  const dynamicOffset = baseOffset + clamp((h - 96) * 0.08, 0, 18);
  const x = tailX + ux * dynamicOffset - exit.x;
  const y = tailY + uy * dynamicOffset - exit.y;
  const bubbleIsOutside =
    x + w < -outsideMargin ||
    x > this.width + outsideMargin ||
    y + h < -outsideMargin ||
    y > this.height + outsideMargin;

  if(bubbleIsOutside) return null;

  return {
    w,
    h,
    x,
    y,
    tipX: tailX - x,
    tipY: tailY - y
  };
}

positionThoughtSpeechBubble(tailX, tailY, directionTailX, directionTailY, anchorX, anchorY, outsideMargin){
  const placement = this.getSpeechBubblePlacement(tailX, tailY, directionTailX, directionTailY, anchorX, anchorY, outsideMargin);

  if(!placement){
    this.speechBubbleElement.classList.add('is-offscreen');
    return;
  }

  const {w, h, x, y, tipX, tipY} = placement;

  this.speechBubbleElement.classList.remove('is-offscreen');
  this.speechBubbleElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  this.speechBubbleSvg.innerHTML = buildThoughtBubbleSvg(w, h, tipX, tipY);
}

positionTailSpeechBubble(tailX, tailY, directionTailX, directionTailY, anchorX, anchorY, outsideMargin){
  const placement = this.getSpeechBubblePlacement(tailX, tailY, directionTailX, directionTailY, anchorX, anchorY, outsideMargin);

  if(!placement){
    this.speechBubbleElement.classList.add('is-offscreen');
    return;
  }

  const {w, h, x, y, tipX, tipY} = placement;

  this.speechBubbleElement.classList.remove('is-offscreen');
  this.speechBubbleElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  this.speechBubbleSvg.innerHTML = buildSpeechBubbleSvg(w, h, tipX, tipY);
}

setupExitButton(list){
  this.exitButton = document.createElement('button');
  this.exitButton.innerText = 'Salir';
  this.exitButton.hidden = true;
  this.exitButton.addEventListener('click', () => {
    this.exitCity();
  });
  list.appendChild(this.exitButton);

  this.ambientAudioButton = document.createElement('button');
  this.ambientAudioButton.type = 'button';
  this.ambientAudioButton.className = 'ambient-audio-toggle';
  this.ambientAudioButton.hidden = true;
  this.ambientAudioButton.addEventListener('click', () => {
    this.toggleAmbientAudio();
  });
  list.appendChild(this.ambientAudioButton);
  this.updateAmbientAudioButton();
}

updateExitButton(){
  if(!this.exitButton) return;

  this.exitButton.hidden = !(this.isInsideCity || this.isTransitioning);
  this.exitButton.disabled = this.isTransitioning;
  this.updateAmbientAudioButton();
  this.updateViewState();
  this.updateDialogueUI();
}

updateAmbientAudioButton(){
  if(!this.ambientAudioButton) return;

  const hasAudio = Boolean(this.activeCity?.audio?.ambient);
  const canShow = hasAudio && (this.isInsideCity || this.isTransitioning);

  this.ambientAudioButton.hidden = !canShow;
  this.ambientAudioButton.disabled = this.isTransitioning;
  const isPlaying = this.ambientAudioEnabled && this.ambientAudioStatus === 'playing';

  this.ambientAudioButton.classList.toggle('is-active', isPlaying);
  this.ambientAudioButton.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');

  if(!hasAudio){
    this.ambientAudioButton.textContent = 'Sonido';
  }else if(this.ambientAudioStatus === 'missing'){
    this.ambientAudioButton.textContent = 'Audio no disponible';
  }else{
    this.ambientAudioButton.textContent = isPlaying ? 'Silenciar escena' : 'Sonido ambiente';
  }
}

updateViewState(){
  const previousView = this.currentView;

  if(this.isTransitioning){
    this.currentView = 'transition';
  }else if(this.isInsideCity){
    this.currentView = 'city';
  }else{
    this.currentView = 'planet';
  }

  document.body.dataset.view = this.currentView;
  this.updateBrandTitleState({previousView});
}

updateControls(){
  this.planetControls.enabled = false;
  this.panoramaControls.enabled = this.isInsideCity && !this.isTransitioning;

  if(this.isInsideCity || this.isTransitioning){
    this.isDraggingPlanet = false;
    this.planetDragDelta.set(0, 0);
  }
}

getAmbientAudioElement(){
  if(this.ambientAudioElement) return this.ambientAudioElement;

  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0;
  audio.addEventListener('error', () => {
    this.ambientAudioStatus = 'missing';
    this.updateAmbientAudioButton();
  });
  this.ambientAudioElement = audio;

  return audio;
}

setAmbientAudioSource(city){
  const source = city?.audio?.ambient || '';
  const audio = this.getAmbientAudioElement();

  if(this.ambientAudioSource === source) return audio;

  gsap.killTweensOf(audio);
  audio.pause();
  audio.currentTime = 0;
  audio.volume = 0;
  audio.src = source;
  this.ambientAudioSource = source;
  this.ambientAudioStatus = source ? 'ready' : 'idle';
  this.updateAmbientAudioButton();

  return audio;
}

async playAmbientAudioForCity(city, {forceGesture = false} = {}){
  if(!city?.audio?.ambient || !this.ambientAudioEnabled) return;
  if(!forceGesture && !this.ambientAudioGestureGranted) return;

  const audio = this.setAmbientAudioSource(city);
  const targetVolume = this.getAmbientAudioVolume(city);

  try{
    audio.volume = 0;
    await audio.play();
    this.ambientAudioStatus = 'playing';
    this.updateAmbientAudioButton();
    gsap.killTweensOf(audio);
    gsap.to(audio, {
      volume: targetVolume,
      duration: AMBIENT_AUDIO_FADE_SECONDS,
      ease: 'power2.out'
    });
  }catch(error){
    this.ambientAudioStatus = 'idle';
    this.ambientAudioGestureGranted = false;
    this.setAmbientAudioEnabled(false);
  }
}

stopAmbientAudio({clearSource = false} = {}){
  if(!this.ambientAudioElement) return;

  const audio = this.ambientAudioElement;
  gsap.killTweensOf(audio);
  gsap.to(audio, {
    volume: 0,
    duration: AMBIENT_AUDIO_FADE_SECONDS * 0.75,
    ease: 'power2.in',
    onComplete: () => {
      audio.pause();

      if(clearSource){
        audio.removeAttribute('src');
        audio.load();
        this.ambientAudioSource = '';
        this.ambientAudioStatus = 'idle';
      }

      this.updateAmbientAudioButton();
    }
  });
}

toggleAmbientAudio(){
  this.ambientAudioGestureGranted = true;
  const shouldStart = !this.ambientAudioEnabled || this.ambientAudioStatus !== 'playing';

  if(shouldStart){
    this.setAmbientAudioEnabled(true);
    this.playAmbientAudioForCity(this.activeCity, {forceGesture: true});
    return;
  }

  this.setAmbientAudioEnabled(false);
  this.stopAmbientAudio();
}

setupPlanetDrag(){
  this.renderer.domElement.addEventListener("pointerdown", (e) => {
    if(this.isInsideCity || this.isTransitioning) return;

    this.isDraggingPlanet = true;
    this.dragDistance = 0;
    this.planetDragDelta.set(0, 0);
    this.previousPointer.set(e.clientX, e.clientY);
    this.renderer.domElement.setPointerCapture(e.pointerId);
  });

  this.renderer.domElement.addEventListener("pointermove", (e) => {
    if(!this.isDraggingPlanet || this.isInsideCity || this.isTransitioning) return;

    let deltaX = e.clientX - this.previousPointer.x;
    let deltaY = e.clientY - this.previousPointer.y;
    this.dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
    this.previousPointer.set(e.clientX, e.clientY);
    this.planetDragDelta.x += ((deltaX / this.width) * Math.PI) * PLANET_DRAG_RESPONSE;
    this.planetDragDelta.y += ((deltaY / this.height) * Math.PI) * PLANET_DRAG_RESPONSE;
  });

  window.addEventListener("pointerup", () => {
    this.isDraggingPlanet = false;
    setTimeout(() => {
      this.dragDistance = 0;
    }, 0);
  });

  window.addEventListener("pointercancel", () => {
    this.isDraggingPlanet = false;
    this.dragDistance = 0;
    this.planetDragDelta.set(0, 0);
  });
}

rotatePlanet(deltaX, deltaY){
  let angleX = (deltaX / this.width) * Math.PI;
  let angleY = (deltaY / this.height) * Math.PI;
  this.applyPlanetRotation(angleX, angleY);
}

applyPlanetRotation(angleX, angleY){
  let horizontal = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angleX);
  let vertical = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angleY);

  this.planetGroup.quaternion.premultiply(horizontal);
  this.planetGroup.quaternion.premultiply(vertical);
}

updatePlanetDragDamping(){
  if(this.isInsideCity || this.isTransitioning) return;

  if(this.planetDragDelta.lengthSq() < PLANET_DRAG_EPSILON){
    this.planetDragDelta.set(0, 0);
    return;
  }

  this.applyPlanetRotation(this.planetDragDelta.x, this.planetDragDelta.y);
  this.planetDragDelta.multiplyScalar(PLANET_DRAG_DAMPING);
}

resize() {
 this.width = this.container.offsetWidth;
 this.height = this.container.offsetHeight;
 this.renderer.setSize(this.width, this.height);
 this.updateResponsiveCameras();
 this.planetCamera.aspect = this.width/this.height;
 this.panoramaCamera.aspect = this.width/this.height;

 this.planetCamera.updateProjectionMatrix();
 this.panoramaCamera.updateProjectionMatrix();

 if(this.panoramaTarget && this.planetTarget){
  this.panoramaTarget.setSize(this.width, this.height);
  this.planetTarget.setSize(this.width, this.height);
 }

 if(this.speechBubbleVisible){
  this.updateSpeechBubbleSize();
  this.updateSpeechBubblePosition();
 }

 this.updateBrandTitleState();

}

updateResponsiveCameras(){
  const isCompact = this.width < 720;
  const isPortrait = this.height > this.width;

  this.planetCamera.fov = isCompact ? 76 : 70;
  this.planetCamera.position.z = isCompact ? 2.55 : isPortrait ? 2.25 : 2;
  this.panoramaCamera.fov = isCompact ? 78 : 70;

  if(this.planetGroup){
    this.planetGroup.position.y = 0;
  }
}

createPanoramaScene(){ // sin usar
  this.geometry = new THREE.SphereGeometry(10, 30, 30);
  let t = this.loadPanoramaTexture(defaultPanorama);
  this.sphere = new THREE.Mesh(
    this.geometry,
    new THREE.MeshBasicMaterial ({ map: t, side: THREE.BackSide })
  );
  this.panoramaScene.add(this.sphere);
}

loadPanoramaTexture(texture){
  if(!this.textureCache[texture]){
    let t = this.textureLoader.load(texture);
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.x = -1;
    this.textureCache[texture] = t;
  }

  return this.textureCache[texture];
}

preloadPanoramaTextures(){
  cityPoints.forEach(city => {
    this.loadPanoramaTexture(city.texture);
  })
}

setPanoramaTexture(texture){
  if(this.currentPanoramaTexture === texture) return;

  let t = this.loadPanoramaTexture(texture);
  this.sphere.material.map = t;
  this.sphere.material.needsUpdate = true;
  this.currentPanoramaTexture = texture;
}

setPanoramaView(city){
  const view = city.view || {yaw: 0, pitch: 0};
  const centerAzimuth = THREE.MathUtils.degToRad(view.yaw || 0);
  const centerPolar = THREE.MathUtils.degToRad(90 - (view.pitch || 0));
  const halfHorizontalViewLimit = getPanoramaHalfHorizontalViewLimit(this.width, this.height);
  const minPolar = Math.max(0.01, centerPolar - PANORAMA_HALF_VERTICAL_VIEW_LIMIT);
  const maxPolar = Math.min(Math.PI - 0.01, centerPolar + PANORAMA_HALF_VERTICAL_VIEW_LIMIT);
  const spherical = new THREE.Spherical(
    PANORAMA_CAMERA_RADIUS,
    centerPolar,
    centerAzimuth
  );

  this.panoramaControls.target.set(0, 0, 0);
  this.panoramaControls.minAzimuthAngle = centerAzimuth - halfHorizontalViewLimit;
  this.panoramaControls.maxAzimuthAngle = centerAzimuth + halfHorizontalViewLimit;
  this.panoramaControls.minPolarAngle = minPolar;
  this.panoramaControls.maxPolarAngle = maxPolar;

  this.panoramaCamera.position.setFromSpherical(spherical);
  this.panoramaCamera.lookAt(this.panoramaControls.target);
  this.panoramaControls.update();
}

loadCharacterTexture(texture){
  if(!this.characterTextureCache[texture]){
    let t = this.textureLoader.load(texture);
    t.colorSpace = THREE.SRGBColorSpace;
    this.characterTextureCache[texture] = t;
  }

  return this.characterTextureCache[texture];
}

getCharacterPosition(city, character){
  const view = city.view || {yaw: 0, pitch: 0};
  const yaw = (view.yaw || 0) + 180 + (character.yawOffset || 0);
  const pitch = character.pitch || 0;
  const spherical = new THREE.Spherical(
    character.distance || 5.5,
    THREE.MathUtils.degToRad(90 - pitch),
    THREE.MathUtils.degToRad(yaw)
  );

  return new THREE.Vector3().setFromSpherical(spherical);
}

clearCityCharacter(){
  if(!this.characterMesh) return;

  this.panoramaScene.remove(this.characterMesh);
  this.characterMesh.geometry.dispose();
  this.characterMesh.material.dispose();
  this.characterMesh = null;
}

setCityCharacter(city){
  this.clearCityCharacter();

  if(!city.character) return;

  const character = city.character;
  const texture = this.loadCharacterTexture(character.texture);
  const height = character.height || 2;
  const aspect = character.aspect || 1;
  const width = height * aspect;
  const feetOffset = character.feetOffset || 0;
  const geometry = new THREE.PlaneGeometry(width, height);

  geometry.translate(0, (height / 2) - feetOffset, 0);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.02,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(geometry, material);
  const toCamera = this.panoramaCamera.position.clone().sub(this.getCharacterPosition(city, character));

  mesh.position.copy(this.getCharacterPosition(city, character));
  mesh.rotation.y = Math.atan2(toCamera.x, toCamera.z);
  this.panoramaScene.add(mesh);
  this.characterMesh = mesh;
}

enterCity(city){
  this.activeCity = city;
  this.hideSpeechBubble();
  this.setAmbientAudioSource(city);
  this.setPanoramaTexture(city.texture);
  this.setPanoramaView(city);
  this.setCityCharacter(city);
  this.material.uniforms.direction.value = 1;
  gsap.to(this.transition, {
    duration: 1,
    delay: 0.15,
    progress: 1,
    onComplete: () => {
      this.isInsideCity = true;
      this.isTransitioning = false;
      this.updateExitButton();
      this.updateControls();
      this.playAmbientAudioForCity(city);
    }
  })
}

exitCity(){
  if(!this.isInsideCity || this.isTransitioning) return;

  this.isTransitioning = true;
  this.updateExitButton();
  this.updateControls();
  this.stopAmbientAudio({clearSource: true});
  this.material.uniforms.direction.value = -1;
  gsap.to(this.transition, {
    duration: 1,
    delay: 0.5,
    progress: 0,
    onComplete: () => {
      this.isInsideCity = false;
      this.isTransitioning = false;
      this.clearCityCharacter();
      this.activeCity = null;
      this.updateExitButton();
      this.updateControls();
    }
  })
}

createPlanet(){
  this.planetGroup = new THREE.Group();
  this.planetScene.background = new THREE.Color(0x050711);
  this.createPlanetBackdrop();

  // Primero probar con MeshBasicMaterial (funciona seguro)
  const earthTexture = this.textureLoader.load(earthTexturePath);
  
  this.earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 30, 30),
    new THREE.MeshBasicMaterial({ map: earthTexture })
  )
  this.planetGroup.add(this.earthMesh);
  this.createPlanetAtmosphere();
  this.planetScene.add(this.planetGroup)
  
  let list = document.getElementById('list');
  this.setupExitButton(list);
  this.updateViewState();
  cityPoints.forEach(city => {
    let coords = getCityTransform(city.coords.lat, city.coords.lng);
    let element = document.createElement('div');
    element.innerText = city.title;
    list.appendChild(element);
    let mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.005,10,10),
      new THREE.MeshBasicMaterial({color: 0xff0000})
    )
    this.planetGroup.add(mesh);
    mesh.position.copy(coords.vector)
    
    let animatedQuaternion = new THREE.Quaternion();
    element.addEventListener('click', () => {
      if(this.dragDistance > 3) return;
      if(this.isInsideCity || this.isTransitioning) return;

      this.planetDragDelta.set(0, 0);
      this.isTransitioning = true;
      this.updateExitButton();
      this.updateControls();
      let rotationProgress = {p: 0};
      let currentQuaternion = new THREE.Quaternion();
      currentQuaternion.copy(this.planetGroup.quaternion);
      gsap.to(rotationProgress, {
        p: 1,
        duration: 1,
        onUpdate:() => {
         animatedQuaternion.slerpQuaternions(currentQuaternion, coords.quaternion, rotationProgress.p);
         this.planetGroup.quaternion.copy(animatedQuaternion);
        },
        onComplete:() => {
          this.enterCity(city);
        }
      })
    })
  })
}

createPlanetBackdrop(){
  const count = 700;
  const positions = new Float32Array(count * 3);

  for(let i = 0; i < count; i++){
    const radius = 6 + Math.random() * 10;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.012,
    transparent: true,
    opacity: 0.75,
    sizeAttenuation: true,
    depthWrite: false
  });

  this.stars = new THREE.Points(geometry, material);
  this.planetScene.add(this.stars);
}

createPlanetAtmosphere(){
  const texture = this.createAtmosphereTexture();
  const atmosphere = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      color: 0xffffff,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false
    })
  );

  atmosphere.scale.set(2.85, 2.85, 1);
  this.planetGroup.add(atmosphere);
}

createAtmosphereTexture(){
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  gradient.addColorStop(0.0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.58, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.72, 'rgba(38, 126, 255, 0.16)');
  gradient.addColorStop(0.82, 'rgba(130, 220, 255, 0.46)');
  gradient.addColorStop(0.92, 'rgba(62, 148, 255, 0.18)');
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

createCompositeScene() {
  this.panoramaTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  })
  this.planetTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
  })
    this.material = new THREE.ShaderMaterial({
    extensions: { derivatives: "#extension GL_OES_standard_derivatives : enable" },
    side: THREE.DoubleSide,
    uniforms: { progress: {value: 0}, direction: {value: 1}, scene360: {value: null},scenePlanet: {value: null} },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
  });
  let geo = new THREE.PlaneGeometry(1,1);
  let mesh = new THREE.Mesh(geo, this.material);
  this.compositeScene.add(mesh);
}
 stop(){
  this.isPlaying = false;
 }
 play(){
  if(!this.isPlaying){
  this.isPlaying = true;
  this.render() 
  }
 }

 render(){
  if(!this.isPlaying)return;
  this.time += 0.05;
  // this.material.uniforms.time.value = this.time;
  requestAnimationFrame(this.render.bind(this));
  this.updatePlanetDragDamping();
  if(this.panoramaControls.enabled) this.panoramaControls.update();
  this.updateSpeechBubblePosition();

  this.renderer. setRenderTarget(this.panoramaTarget);
  this.renderer.render(this.panoramaScene, this.panoramaCamera);
  this.renderer. setRenderTarget(this.planetTarget);
  this.renderer.render(this.planetScene, this.planetCamera);
  this.material.uniforms.scene360.value = this.panoramaTarget.texture;
  this.material.uniforms.scenePlanet.value = this.planetTarget.texture;
  this.material.uniforms.progress.value = this.transition.progress;
  this.renderer. setRenderTarget(null);
  this.renderer.render(this.compositeScene, this.compositeCamera);
 }
}

new WorldTour({
  dom: document.getElementById("scene")
});
