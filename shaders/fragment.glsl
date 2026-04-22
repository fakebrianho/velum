uniform sampler2D uTexture;
uniform float uExposure;
uniform float uSaturation;
uniform float uAlpha;
varying vec2 vUv;


void main() {
  gl_FragColor = texture2D(uTexture, vUv);
  gl_FragColor.rgb *= uExposure;
  float luma = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  gl_FragColor.rgb = mix(vec3(luma), gl_FragColor.rgb, uSaturation);
  gl_FragColor.a *= uAlpha;
  #include <colorspace_fragment>
}