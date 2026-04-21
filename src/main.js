import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import fragmentShader from './shaders/plane.frag?raw';
import vertexShader from './shaders/plane.vert?raw';
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
      texture: domingoCharacter,
      yawOffset: 20,
      pitch: -130,
      distance: 3.9,
      height: 6.2,
      feetOffset: 2.0,
      aspect: 448 / 558
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
      texture: pacoCharacter,
      yawOffset: 0,
      pitch: -50,
      distance: 2.9,
      height: 5.6,
      feetOffset: 2.0,
      aspect: 448 / 558
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
      texture: yanislaidisCharacter,
      yawOffset: -48,
      pitch: -50,
      distance: 2.9,
      height: 6.9,
      feetOffset: 2.5,
      aspect: 832 / 1248
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
      texture: martaNoraCharacter,
      yawOffset: -32,
      pitch: -29,
      distance: 4.5,
      height: 6.4,
      feetOffset: 3.5,
      aspect: 832 / 1248
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
      texture: maniseraCharacter,
      yawOffset: 0,
      pitch: -50,
      distance: 2.9,
      height: 6.3,
      feetOffset: 2.3,
      aspect: 408 / 612
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
