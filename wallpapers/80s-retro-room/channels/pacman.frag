/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    channels/pacman.frag
    PAC-MAN™ & © Bandai Namco Entertainment Inc.
    All rights reserved.
*/

precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

uniform vec3 u_col_bg;
uniform vec3 u_col_surface;
uniform vec3 u_col_secondary;
uniform vec3 u_col_primary;

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

// 7-сегментный шрифт для надписи 1UP и счёта
float drawDigit(vec2 p, float n) {
  p *= 22.0;
  float res = 1.0;
  int num = int(floor(n + 0.1));

  bool sA = (num != 1 && num != 4);
  bool sB = (num != 5 && num != 6);
  bool sC = (num != 2);
  bool sD = (num != 1 && num != 4 && num != 7);
  bool sE = (num == 0 || num == 2 || num == 6 || num == 8);
  bool sF = (num != 1 && num != 2 && num != 3 && num != 7);
  bool sG = (num != 0 && num != 1 && num != 7);

  if (sA) res = min(res, sdBox(p - vec2( 0.00,  1.20), vec2(0.45, 0.12)));
  if (sB) res = min(res, sdBox(p - vec2( 0.45,  0.60), vec2(0.12, 0.45)));
  if (sC) res = min(res, sdBox(p - vec2( 0.45, -0.60), vec2(0.12, 0.45)));
  if (sD) res = min(res, sdBox(p - vec2( 0.00, -1.20), vec2(0.45, 0.12)));
  if (sE) res = min(res, sdBox(p - vec2(-0.45, -0.60), vec2(0.12, 0.45)));
  if (sF) res = min(res, sdBox(p - vec2(-0.45,  0.60), vec2(0.12, 0.45)));
  if (sG) res = min(res, sdBox(p - vec2( 0.00,  0.00), vec2(0.45, 0.12)));

  return res;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

  // неоновые границы лабиринта (двойные синие линии)
  float mazeOuter = abs(sdBox(uv, vec2(0.60, 0.44))) - 0.006;
  float mazeInner = abs(sdBox(uv, vec2(0.58, 0.42))) - 0.003;
  float maze = min(mazeOuter, mazeInner);

  // центральные препятствия лабиринта
  float blockT = abs(sdBox(uv - vec2(0.0,  0.22), vec2(0.18, 0.06))) - 0.004;
  float blockB = abs(sdBox(uv - vec2(0.0, -0.22), vec2(0.18, 0.06))) - 0.004;
  maze = min(maze, min(blockT, blockB));

  // циклическое движение персонажей слева направо
  float cycleX = mod(u_time * 0.45, 1.6) - 0.8;
  vec2 pacPos = vec2(cycleX, 0.0);
  vec2 ghostPos = vec2(cycleX - 0.32, 0.0);

  // пакман (Pac-Man)
  vec2 pPac = uv - pacPos;
  float pacDist = length(pPac) - 0.055;

  // анимация открывающегося рта
  float mouthAngle = abs(sin(u_time * 12.0)) * 0.65 + 0.08;
  float angle = atan(pPac.y, pPac.x);
  float inMouth = step(abs(angle), mouthAngle);
  float pacman = max(pacDist, inMouth > 0.5 ? 1.0 : -1.0);

  // привидение Блинки (Blinky Ghost)
  vec2 pGhost = uv - ghostPos;
  float ghostHead = length(pGhost - vec2(0.0, 0.012)) - 0.050;
  float ghostBody = sdBox(pGhost - vec2(0.0, -0.018), vec2(0.050, 0.030));
  float ghost = min(ghostHead, ghostBody);

  // волнистый подол привидения (щупальца)
  float skirtWave = sin((pGhost.x + u_time * 0.1) * 75.0) * 0.008;
  if (pGhost.y < -0.038 + skirtWave && abs(pGhost.x) < 0.052) {
    ghost = 1.0;
  }

  // глазки привидения (смотрят в сторону Пакмана)
  vec2 eyeL = pGhost - vec2(-0.018, 0.015);
  vec2 eyeR = pGhost - vec2( 0.018, 0.015);
  float eyes = min(length(eyeL) - 0.012, length(eyeR) - 0.012);
  float pupils = min(length(eyeL - vec2(0.005, 0.0)) - 0.005, length(eyeR - vec2(0.005, 0.0)) - 0.005);

  // точки (Pellets)
  float pellets = 1.0;
  for (float x = -0.50; x <= 0.50; x += 0.09) {
    // точка съедается, когда Пакман проходит сквозь неё
    if (x > pacPos.x - 0.03) {
      pellets = min(pellets, length(uv - vec2(x, 0.0)) - 0.008);
    }
  }

  // табло 1UP и счёт на экране
  float scoreUI = 1.0;
  scoreUI = min(scoreUI, drawDigit(uv - vec2(-0.25, 0.38), 1.0));
  scoreUI = min(scoreUI, drawDigit(uv - vec2(-0.16, 0.38), 2.0));
  scoreUI = min(scoreUI, drawDigit(uv - vec2(-0.08, 0.38), 4.0));
  scoreUI = min(scoreUI, drawDigit(uv - vec2( 0.00, 0.38), 0.0));

  // сборка цветовой палитры
  vec3 col = u_col_bg;

  if (maze < 0.002) col = mix(u_col_secondary, vec3(0.1, 0.4, 1.0), 0.7); // синий неоновый лабиринт
  if (pellets < 0.0) col = u_col_primary;                                  // золотистые точки
  if (scoreUI < 0.003) col = col = mix(u_col_primary, vec3(1.0), 0.8);

  if (ghost < 0.0) {
    col = mix(u_col_secondary, vec3(1.0, 0.2, 0.2), 0.85); // красный Блинки
    if (eyes < 0.0) col = vec3(0.95);
    if (pupils < 0.0) col = vec3(0.1, 0.2, 0.9);
  }

  if (pacman < 0.0) {
    col = mix(u_col_primary, vec3(1.0, 0.9, 0.1), 0.85); // желтый Пакман
  }

  gl_FragColor = vec4(col, 1.0);
}
