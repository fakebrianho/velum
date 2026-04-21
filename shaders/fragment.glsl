uniform sampler2D uTexture;
uniform float uExposure;
uniform float uSaturation;
varying vec2 vUv;

void main() {
  gl_FragColor = texture2D(uTexture, vUv);
  gl_FragColor.rgb *= uExposure;
  float luma = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  gl_FragColor.rgb = mix(vec3(luma), gl_FragColor.rgb, uSaturation);
  #include <colorspace_fragment>
}