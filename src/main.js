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

const PANORAMA_VIEW_LIMIT = THREE.MathUtils.degToRad(170);
const PANORAMA_HALF_VIEW_LIMIT = PANORAMA_VIEW_LIMIT * 0.5;
const PANORAMA_CAMERA_RADIUS = 2;
const SPEECH_BUBBLE_TAIL_OFFSET = 36;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

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
let cityPoints = [
  {
    title: 'Habana',
    coords: {lat: 23.1303, lng: -82.3531},
    texture: defaultPanorama,
    view: {yaw: -70, pitch: 0},
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
        side: 'right',
        anchorX: 1.35,
        anchorY: 1.16,
        tailY: 0.72,
        offset: 50
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
    view: {yaw: -110, pitch: 0},
    character: {
      agentId: 'paco',
      name: 'Paco',
      texture: pacoCharacter,
      yawOffset: 0,
      pitch: -50,
      distance: 2.9,
      height: 5.6,
      feetOffset: 2.0,
      aspect: 448 / 558,
      bubble: {
        side: 'left',
        anchorX: 27.35,
        anchorY: 12.14,
        tailY: 0.82,
        offset: 290
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
    view: {yaw: -80, pitch: 0},
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
        anchorX: 1.35,
        anchorY: 1.14,
        tailY: 0.72,
        offset: 50
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
    view: {yaw: -120, pitch: 0},
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
        anchorX: 172.38,
        anchorY: 0.82,
        tailY: 1.72,
        offset: 152
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
    view: {yaw: -80, pitch: 0},
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
        side: 'right',
        anchorX: 1.35,
        anchorY: 1.14,
        tailY: 0.72,
        offset: 50
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
    this.currentPanoramaTexture = defaultPanorama;
    this.characterMesh = null;
    this.activeCity = null;
    this.chatSessionId = this.getChatSessionId();
    this.dialogLoading = false;
    this.speechBubbleVariant = 'tail';
    this.speechBubbleVisible = false;
    this.speechBubbleText = '';
    this.speechBubbleSize = {w: SPEECH_BUBBLE_MIN_WIDTH, h: SPEECH_BUBBLE_MIN_HEIGHT};
    this.speechTailWorld = new THREE.Vector3();
    this.speechAnchorWorld = new THREE.Vector3();
    this.speechTailNdc = new THREE.Vector3();
    this.speechAnchorNdc = new THREE.Vector3();
    this.speechTailLocal = new THREE.Vector3();
    this.speechAnchorLocal = new THREE.Vector3();

    this.createDialogueUI();
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

  this.speechBubbleElement = bubble;
  this.speechBubbleSvg = svg;
  this.speechBubbleTextElement = text;
  this.speechBubbleMeasure = measure;
  this.speechBubbleMeasureText = measureText;
  this.dialogForm = form;
  this.dialogInput = input;
  this.dialogSendButton = button;
  this.speechBubbleVariantButtons = {
    thought: variantA,
    tail: variantB
  };
  this.updateDialogueUI();
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
  this.showSpeechBubble('...');

  try{
    const reply = await this.sendAgentMessage(text);
    this.showSpeechBubble(reply);
  }catch(error){
    console.error(error);
    this.showSpeechBubble('Parece que se fue la luz... Dame un momentico, que en cuanto vuelva la corriente seguimos conversando.');
  }finally{
    this.dialogLoading = false;
    this.updateDialogueUI();
    this.dialogInput.focus({preventScroll: true});
  }
}

async sendAgentMessage(text){
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId: this.chatSessionId,
      agentId: this.activeCity.character.agentId,
      message: text
    })
  });

  const payload = await response.json().catch(() => ({}));

  if(!response.ok){
    throw new Error(payload.error || `Chat request failed (${response.status})`);
  }

  if(payload.sessionId && payload.sessionId !== this.chatSessionId){
    this.chatSessionId = payload.sessionId;
    window.localStorage?.setItem('planeta-barrio-session-id', payload.sessionId);
  }

  return payload.message?.content || '';
}

showSpeechBubble(text){
  this.speechBubbleText = text;
  this.speechBubbleVisible = true;
  this.speechBubbleElement.classList.add('is-visible');
  this.speechBubbleElement.classList.remove('is-offscreen');
  this.updateSpeechBubbleSize();
  this.updateSpeechBubblePosition();
}

hideSpeechBubble(){
  this.speechBubbleVisible = false;
  this.speechBubbleText = '';

  if(this.speechBubbleElement){
    this.speechBubbleElement.classList.remove('is-visible');
    this.speechBubbleElement.classList.remove('is-offscreen');
  }
}

updateSpeechBubbleSize(){
  if(!this.speechBubbleMeasure || !this.speechBubbleTextElement) return;

  const maxWidth = getResponsiveBubbleMaxWidth(this.width);

  this.speechBubbleMeasureText.textContent = this.speechBubbleText;
  this.speechBubbleMeasureText.style.width = 'auto';

  let width = Math.ceil(this.speechBubbleMeasure.scrollWidth + SPEECH_BUBBLE_TEXT_PAD_X);
  width = clamp(width, SPEECH_BUBBLE_MIN_WIDTH, maxWidth);

  const textWidth = Math.max(width - SPEECH_BUBBLE_TEXT_PAD_X, 0);
  this.speechBubbleMeasureText.style.width = `${textWidth}px`;

  let height = Math.ceil(this.speechBubbleMeasure.scrollHeight + SPEECH_BUBBLE_TEXT_PAD_Y);
  height = Math.max(height, SPEECH_BUBBLE_MIN_HEIGHT);

  this.speechBubbleSize = {w: width, h: height};
  this.speechBubbleTextElement.textContent = this.speechBubbleText;
  this.speechBubbleTextElement.style.width = `${textWidth}px`;
  this.speechBubbleElement.style.width = `${width}px`;
  this.speechBubbleElement.style.height = `${height}px`;
  this.speechBubbleSvg.setAttribute('width', `${width}`);
  this.speechBubbleSvg.setAttribute('height', `${height}`);
  this.speechBubbleSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
}

getCharacterBubblePoints(){
  if(!this.characterMesh || !this.activeCity?.character) return null;

  const character = this.activeCity.character;
  const bubble = character.bubble || {};
  const height = character.height || 2;
  const width = height * (character.aspect || 1);
  const feetOffset = character.feetOffset || 0;
  const side = bubble.side === 'left' ? -1 : 1;
  const tailY = height * (bubble.tailY ?? 0.72) - feetOffset;
  const anchorY = height * (bubble.anchorY ?? 1.14) - feetOffset;
  const anchorX = side * width * (bubble.anchorX ?? 1.35);

  this.characterMesh.updateMatrixWorld(true);

  this.speechTailLocal.set(0, tailY, 0);
  this.speechAnchorLocal.set(anchorX, anchorY, 0);

  this.speechTailWorld.copy(this.speechTailLocal);
  this.speechAnchorWorld.copy(this.speechAnchorLocal);
  this.characterMesh.localToWorld(this.speechTailWorld);
  this.characterMesh.localToWorld(this.speechAnchorWorld);

  return {
    tail: this.speechTailWorld,
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
  this.speechAnchorNdc.copy(points.anchor).project(this.panoramaCamera);

  const tailX = (this.speechTailNdc.x * 0.5 + 0.5) * this.width;
  const tailY = (this.speechTailNdc.y * -0.5 + 0.5) * this.height;
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
    this.positionTailSpeechBubble(tailX, tailY, anchorX, anchorY, outsideMargin);
    return;
  }

  this.positionThoughtSpeechBubble(tailX, tailY, anchorX, anchorY);
}

positionThoughtSpeechBubble(tailX, tailY, anchorX, anchorY){
  const {w, h} = this.speechBubbleSize;
  const margin = this.width < 560 ? 10 : 18;
  const inputHeight = this.dialogForm && !this.dialogForm.hidden ? this.dialogForm.offsetHeight : 82;
  const bubble = this.activeCity?.character?.bubble || {};
  const thoughtDistance = bubble.thoughtDistance || (this.width < 560 ? 138 : 185);
  const dx = anchorX - tailX;
  const dy = anchorY - tailY;
  const distance = Math.hypot(dx, dy);
  const ux = distance > 1 ? dx / distance : bubble.side === 'left' ? -1 : 1;
  const uy = distance > 1 ? dy / distance : -0.34;
  const thoughtAnchorX = tailX + ux * thoughtDistance;
  const thoughtAnchorY = tailY + uy * thoughtDistance * 0.72;
  const maxX = Math.max(margin, this.width - w - margin);
  const maxY = Math.max(margin, this.height - h - inputHeight - margin * 2);
  const x = clamp(thoughtAnchorX - w / 2, margin, maxX);
  const y = clamp(thoughtAnchorY - h / 2, margin, maxY);
  const tipX = tailX - x;
  const tipY = tailY - y;

  this.speechBubbleElement.classList.remove('is-offscreen');
  this.speechBubbleElement.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  this.speechBubbleSvg.innerHTML = buildThoughtBubbleSvg(w, h, tipX, tipY);
}

positionTailSpeechBubble(tailX, tailY, anchorX, anchorY, outsideMargin){
  const {w, h} = this.speechBubbleSize;
  const dx = anchorX - tailX;
  const dy = anchorY - tailY;
  const distance = Math.hypot(dx, dy);

  if(distance < 1){
    this.speechBubbleElement.classList.add('is-offscreen');
    return;
  }

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

  if(bubbleIsOutside){
    this.speechBubbleElement.classList.add('is-offscreen');
    return;
  }

  const tipX = tailX - x;
  const tipY = tailY - y;

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
}

updateExitButton(){
  if(!this.exitButton) return;

  this.exitButton.hidden = !this.isInsideCity;
  this.exitButton.disabled = this.isTransitioning;
  this.updateViewState();
  this.updateDialogueUI();
}

updateViewState(){
  if(this.isTransitioning){
    document.body.dataset.view = 'transition';
  }else if(this.isInsideCity){
    document.body.dataset.view = 'city';
  }else{
    document.body.dataset.view = 'planet';
  }
}

updateControls(){
  this.planetControls.enabled = false;
  this.panoramaControls.enabled = this.isInsideCity && !this.isTransitioning;

  if(this.isInsideCity || this.isTransitioning){
    this.isDraggingPlanet = false;
  }
}

setupPlanetDrag(){
  this.renderer.domElement.addEventListener("pointerdown", (e) => {
    if(this.isInsideCity || this.isTransitioning) return;

    this.isDraggingPlanet = true;
    this.dragDistance = 0;
    this.previousPointer.set(e.clientX, e.clientY);
    this.renderer.domElement.setPointerCapture(e.pointerId);
  });

  this.renderer.domElement.addEventListener("pointermove", (e) => {
    if(!this.isDraggingPlanet || this.isInsideCity || this.isTransitioning) return;

    let deltaX = e.clientX - this.previousPointer.x;
    let deltaY = e.clientY - this.previousPointer.y;
    this.dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
    this.previousPointer.set(e.clientX, e.clientY);
    this.rotatePlanet(deltaX, deltaY);
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
  });
}

rotatePlanet(deltaX, deltaY){
  let angleX = (deltaX / this.width) * Math.PI;
  let angleY = (deltaY / this.height) * Math.PI;
  let horizontal = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angleX);
  let vertical = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angleY);

  this.planetGroup.quaternion.premultiply(horizontal);
  this.planetGroup.quaternion.premultiply(vertical);
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

}

updateResponsiveCameras(){
  const isCompact = this.width < 720;
  const isPortrait = this.height > this.width;

  this.planetCamera.fov = isCompact ? 76 : 70;
  this.planetCamera.position.z = isCompact ? 2.55 : isPortrait ? 2.25 : 2;
  this.panoramaCamera.fov = isCompact ? 78 : 70;
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
  const minPolar = Math.max(0.01, centerPolar - PANORAMA_HALF_VIEW_LIMIT);
  const maxPolar = Math.min(Math.PI - 0.01, centerPolar + PANORAMA_HALF_VIEW_LIMIT);
  const spherical = new THREE.Spherical(
    PANORAMA_CAMERA_RADIUS,
    centerPolar,
    centerAzimuth
  );

  this.panoramaControls.target.set(0, 0, 0);
  this.panoramaControls.minAzimuthAngle = centerAzimuth - PANORAMA_HALF_VIEW_LIMIT;
  this.panoramaControls.maxAzimuthAngle = centerAzimuth + PANORAMA_HALF_VIEW_LIMIT;
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
    }
  })
}

exitCity(){
  if(!this.isInsideCity || this.isTransitioning) return;

  this.isTransitioning = true;
  this.updateExitButton();
  this.updateControls();
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
