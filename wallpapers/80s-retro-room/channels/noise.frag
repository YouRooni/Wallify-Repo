/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    channels/noise.frag
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;

  // аналоговые горизонтальные полосы срыва кадра
  float band = floor(uv.y * 24.0);
  float glitch = step(0.94, hash(vec2(floor(u_time * 18.0), band)));
  uv.x += glitch * (hash(vec2(u_time, band)) - 0.5) * 0.15;

  // высококонтрастное зерно шума
  float n = hash(uv * 3.0 + fract(u_time * 53.0));

  // строчная рябь
  float lines = sin(gl_FragCoord.y * 3.1415) * 0.08;
  n = clamp(n - lines, 0.0, 1.0);

  // чистый монохромный шум: глубокий черный и яркий белый
  vec3 color = mix(vec3(0.04), vec3(0.98), n);
  gl_FragColor = vec4(color, 1.0);
}
