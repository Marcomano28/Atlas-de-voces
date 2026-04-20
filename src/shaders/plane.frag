uniform sampler2D scene360;
uniform sampler2D scenePlanet;
uniform vec4 resolution;
uniform float progress;
uniform float direction;
uniform float time;
varying vec2 vUv;

vec2 distortion(vec2 old, float prog, float expo){
  vec2 p0 = 2.0 * old - 1.0;
  vec2 p1 = p0/(1.0 - prog * length(p0) * expo);
  return (p1 + 1.0)*0.5;
}
void main() {
  float transitionProgress = progress;
  if(direction < 0.0){
    transitionProgress = 1.0 - progress;
  }

  float progress1 = smoothstep(0.75, 1., transitionProgress);

  vec2 uv1 = distortion(vUv, -10. * pow(0.5 + 0.5 * transitionProgress, 32.), transitionProgress * 4.);
  vec2 uv2 = distortion(vUv, -10. * (1. - progress1), transitionProgress * 4.);

  vec4 s360 = texture2D(scene360, direction > 0.0 ? uv2 : uv1);
  vec4 sPlanet = texture2D(scenePlanet, direction > 0.0 ? uv1 : uv2);
  float mixed = progress1;
  gl_FragColor = vec4(vUv,0.0,1.0);
  gl_FragColor = s360;
  vec4 finalTexture = mix(sPlanet, s360, mixed);
  if(direction < 0.0){
    finalTexture = mix(s360, sPlanet, mixed);
  }
  gl_FragColor = finalTexture;
}
