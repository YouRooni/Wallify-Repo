/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    channels/sphere.frag
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_col_bg;
uniform vec3 u_col_primary;

mat2 rot(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

float map(vec3 p) {
  float s = length(p) - 1.1;
  float g = sin(atan(p.x, p.z) * 8.0 + p.y * 4.0) * 0.04;
  float ring = abs(length(p.xz) - 1.5) - 0.025;
  ring = max(ring, abs(p.y) - 0.02);
  return min(s + g, ring);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec3 ro = vec3(0.0, 0.0, 3.2);
  vec3 rd = normalize(vec3(uv, -1.3));

  mat2 r = rot(u_time * 0.5);
  ro.xz *= r; rd.xz *= r;

  float t = 0.0;
  float hit = -1.0;
  for (int i = 0; i < 24; i++) {
    vec3 p = ro + rd * t;
    float d = map(p);
    if (d < 0.005) { hit = t; break; }
    if (t > 5.0) break;
    t += d;
  }

  float lum = 0.05;
  if (hit > 0.0) {
    vec3 p = ro + rd * hit;
    vec3 n = normalize(p);
    lum = 0.2 + max(dot(n, normalize(vec3(1.0, 1.2, 1.4))), 0.0) * 0.8;
  }

  gl_FragColor = vec4(mix(u_col_bg, u_col_primary, lum), 1.0);
}
