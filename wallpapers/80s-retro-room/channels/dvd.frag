/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    channels/dvd.frag
    DVD Logo is a registered trademark of DVD Format/Logo Licensing Corporation (DVD FLLC).
*/

precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

uniform vec3 u_col_bg;
uniform vec3 u_col_surface;
uniform vec3 u_col_secondary;
uniform vec3 u_col_primary;

float pingpong(float t, float len) {
  float m = mod(t, 2.0 * len);
  return m > len ? 2.0 * len - m : m;
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

// процедурный глиф "D"
float letterD(vec2 p) {
  float outer = length(vec2(max(0.0, p.x), p.y)) - 0.035;
  outer = max(outer, -p.x - 0.03);
  outer = max(outer, abs(p.y) - 0.035);

  float inner = length(vec2(max(0.0, p.x), p.y)) - 0.018;
  inner = max(inner, -p.x - 0.012);
  inner = max(inner, abs(p.y) - 0.018);

  float bar = sdBox(p - vec2(-0.022, 0.0), vec2(0.007, 0.035));
  return min(bar, max(outer, -inner));
}

// процедурный глиф "V"
float letterV(vec2 p) {
  p.x = abs(p.x);
  vec2 a = vec2(0.025, 0.035);
  vec2 b = vec2(0.0, -0.035);
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - 0.007;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

  // границы кинескопа (соотношение 256x192)
  vec2 halfBox = vec2(0.14, 0.065);
  vec2 limit = vec2(0.666 - halfBox.x - 0.03, 0.500 - halfBox.y - 0.03);

  // траектория отскоков по осям X и Y
  float tX = u_time * 0.28 + 0.15;
  float tY = u_time * 0.21 + 0.40;

  vec2 pos = vec2(
    pingpong(tX, 2.0 * limit.x) - limit.x,
    pingpong(tY, 2.0 * limit.y) - limit.y
  );

  // смена цвета при ударах о границы
  float hitCount = floor(tX / (2.0 * limit.x)) + floor(tY / (2.0 * limit.y));
  float colorIdx = mod(hitCount, 3.0);

  vec3 logoCol = u_col_primary;
  if (colorIdx > 1.5) logoCol = u_col_secondary;
  else if (colorIdx > 0.5) logoCol = mix(u_col_primary, u_col_secondary, 0.5);

  vec2 p = uv - pos;

  // овальный диск под надписью
  vec2 discP = p - vec2(0.0, -0.038);
  float disc = length(discP * vec2(1.0, 3.2)) - 0.105;
  float discHole = length(discP * vec2(1.0, 3.2)) - 0.035;
  float discShape = max(abs(disc) - 0.006, -discHole);

  // надпись "D V D"
  float d1 = letterD(p - vec2(-0.068, 0.01));
  float v  = letterV(p - vec2( 0.000, 0.01));
  float d2 = letterD(p - vec2( 0.068, 0.01));

  float textShape = min(min(d1, v), d2);
  float fullLogo = min(textShape, discShape);

  vec3 col = mix(u_col_bg, logoCol, step(fullLogo, 0.002));
  gl_FragColor = vec4(col, 1.0);
}
