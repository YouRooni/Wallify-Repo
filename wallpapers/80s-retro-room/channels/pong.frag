/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    channels/pong.frag
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

uniform vec3 u_col_bg;
uniform vec3 u_col_primary;

float pingpong(float t, float len) {
  float m = mod(t, 2.0 * len);
  return m > len ? 2.0 * len - m : m;
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

// 7-сегментные цифры без конфликтов типов и ранних return
float drawDigit(vec2 p, float n) {
  p *= 22.0;
  float res = 1.0;

  bool sA = (n != 1.0 && n != 4.0);
  bool sB = (n != 5.0 && n != 6.0);
  bool sC = (n != 2.0);
  bool sD = (n != 1.0 && n != 4.0 && n != 7.0);
  bool sE = (n == 0.0 || n == 2.0 || n == 6.0 || n == 8.0);
  bool sF = (n != 1.0 && n != 2.0 && n != 3.0 && n != 7.0);
  bool sG = (n != 0.0 && n != 1.0 && n != 7.0);

  if (sA) res = min(res, sdBox(p - vec2( 0.0,  1.6), vec2(0.65, 0.16)));
  if (sB) res = min(res, sdBox(p - vec2( 0.75, 0.8), vec2(0.16, 0.65)));
  if (sC) res = min(res, sdBox(p - vec2( 0.75,-0.8), vec2(0.16, 0.65)));
  if (sD) res = min(res, sdBox(p - vec2( 0.0, -1.6), vec2(0.65, 0.16)));
  if (sE) res = min(res, sdBox(p - vec2(-0.75,-0.8), vec2(0.16, 0.65)));
  if (sF) res = min(res, sdBox(p - vec2(-0.75, 0.8), vec2(0.16, 0.65)));
  if (sG) res = min(res, sdBox(p - vec2( 0.0,  0.0), vec2(0.65, 0.16)));

  return res;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

  // границы игрового поля и отскока
  float boundX = 0.45;
  float boundY = 0.35;

  // динамика шарика
  float ballX = pingpong(u_time * 0.72 + 0.3, 2.0 * boundX) - boundX;
  float ballY = pingpong(u_time * 0.54 + 0.6, 2.0 * boundY) - boundY;
  vec2 ballPos = vec2(ballX, ballY);

  // координаты платформ (расположены строго на точке отскока шарика)
  float padLX = -0.48;
  float padLY = clamp(ballY * 0.94 + sin(u_time * 2.2) * 0.03, -0.28, 0.28);

  float padRX = 0.48;
  float padRY = clamp(ballY * 0.96 - cos(u_time * 1.8) * 0.03, -0.28, 0.28);

  vec2 padHalf = vec2(0.014, 0.075);
  float padL = sdBox(uv - vec2(padLX, padLY), padHalf);
  float padR = sdBox(uv - vec2(padRX, padRY), padHalf);
  float ball = sdBox(uv - ballPos, vec2(0.015, 0.015));

  // центральная разделительная пунктирная сетка
  float net = 1.0;
  if (abs(uv.x) < 0.005 && abs(uv.y) < 0.42) {
    if (mod(uv.y + 0.42, 0.05) < 0.025) net = 0.0;
  }

  // счет на табло (08 : 03)
  float score = 1.0;
  score = min(score, drawDigit(uv - vec2(-0.16, 0.32), 0.0));
  score = min(score, drawDigit(uv - vec2(-0.07, 0.32), 8.0));
  score = min(score, drawDigit(uv - vec2( 0.07, 0.32), 0.0));
  score = min(score, drawDigit(uv - vec2( 0.16, 0.32), 3.0));

  float scene = min(min(min(padL, padR), ball), score);
  scene = min(scene, net);

  vec3 col = mix(u_col_bg, u_col_primary, step(scene, 0.003));
  gl_FragColor = vec4(col, 1.0);
}
