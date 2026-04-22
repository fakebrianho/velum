uniform sampler2D uTexture;
uniform float uExposure;
uniform float uSaturation;
uniform float uAlpha;
varying vec2 vUv;
varying float vWave;


void main() {
  gl_FragColor = texture2D(uTexture, vUv);
  gl_FragColor.rgb *= uExposure;
  float luma = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  float wave = vWave * 0.2;
  float r = texture2D(uTexture, vUv - wave * 0.2).r;
  float g = texture2D(uTexture, vUv + wave * 0.1).g;
  float b = texture2D(uTexture, vUv - wave * 0.05).b;
  vec3 texture = vec3(r, g, b);

  gl_FragColor.rgb = mix(vec3(luma), texture.rgb, uSaturation);
  gl_FragColor = vec4(texture.rgb, 1);
  gl_FragColor.a *= uAlpha;
  #include <colorspace_fragment>
}