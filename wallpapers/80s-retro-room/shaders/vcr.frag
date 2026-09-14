/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    shaders/vcr.frag
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

float sdVcrBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return max(d.x, d.y);
}

// 7-сегментная цифра на чистых float с гарантированной толщиной сегментов
float vcrDigit(vec2 p, float val) {
  p *= 42.0;

  bool sA = (val != 1.0 && val != 4.0);
  bool sB = (val != 5.0 && val != 6.0);
  bool sC = (val != 2.0);
  bool sD = (val != 1.0 && val != 4.0 && val != 7.0);
  bool sE = (val == 0.0 || val == 2.0 || val == 6.0 || val == 8.0);
  bool sF = (val != 1.0 && val != 2.0 && val != 3.0 && val != 7.0);
  bool sG = (val != 0.0 && val != 1.0 && val != 7.0);

  vec2 hHalf = vec2(0.24, 0.08);
  vec2 vHalf = vec2(0.08, 0.18);

  float d = 1.0;
  if (sA) d = min(d, sdVcrBox(p - vec2( 0.00,  0.46), hHalf));
  if (sB) d = min(d, sdVcrBox(p - vec2( 0.25,  0.23), vHalf));
  if (sC) d = min(d, sdVcrBox(p - vec2( 0.25, -0.23), vHalf));
  if (sD) d = min(d, sdVcrBox(p - vec2( 0.00, -0.46), hHalf));
  if (sE) d = min(d, sdVcrBox(p - vec2(-0.25, -0.23), vHalf));
  if (sF) d = min(d, sdVcrBox(p - vec2(-0.25,  0.23), vHalf));
  if (sG) d = min(d, sdVcrBox(p - vec2( 0.00,  0.00), hHalf));

  return d;
}

vec4 renderVCR(vec2 uv, float time, float dither, vec4 vcrTime, vec3 colBg, vec3 colSurf, vec3 colSec, vec3 colPrim) {
  vec2 vcrPos = vec2(0.0, -0.365);
  vec2 p = uv - vcrPos;

  // AABB корпуса
  if (abs(p.x) > 0.40 || p.y < -0.06 || p.y > 0.06) {
    return vec4(0.0);
  }

  // ножки
  float footL = sdRoundBox(p - vec2(-0.31, -0.045), vec2(0.022, 0.008), 0.003);
  float footR = sdRoundBox(p - vec2( 0.31, -0.045), vec2(0.022, 0.008), 0.003);
  if (min(footL, footR) < 0.0) {
    return vec4(colBg * 0.45, 1.0);
  }

  // тень на столе
  float shadow = sdRoundBox(p - vec2(0.01, -0.048), vec2(0.36, 0.012), 0.008);
  if (shadow < 0.0 && p.y < -0.038) {
    return vec4(colBg * 0.4, 0.65);
  }

  // корпус VCR
  vec2 bodyHalf = vec2(0.36, 0.038);
  float body = sdRoundBox(p, bodyHalf, 0.006);

  if (body < 0.0) {
    float vShade = smoothstep(-0.038, 0.038, p.y);
    vec3 vcrCol = mix(colSurf * 0.88, colSurf * 1.08, vShade);

    if (p.y > 0.032) vcrCol = colSurf * 1.35;
    if (p.y < -0.032) vcrCol = colBg * 0.7;

    // слот кассетоприёмника
    vec2 slotP = p - vec2(-0.14, 0.004);
    float slotBox = sdRoundBox(slotP, vec2(0.14, 0.016), 0.003);
    if (slotBox < 0.0) {
      vcrCol = colBg * 0.35;
      float flap = sdRoundBox(slotP - vec2(0.0, 0.002), vec2(0.134, 0.011), 0.002);
      if (flap < 0.0) {
        vcrCol = colSurf * 0.75;
        if (abs(slotP.x) < 0.012 && abs(slotP.y) < 0.004) {
          vcrCol = colSec * 0.8;
        }
      }
    }

    // кнопка Power
    vec2 pwrP = p - vec2(-0.315, 0.004);
    float pwrBtn = sdRoundBox(pwrP, vec2(0.014, 0.014), 0.002);
    if (pwrBtn < 0.0) {
      vcrCol = colSurf * 1.25;
      if (length(pwrP - vec2(0.0, 0.020)) < 0.0035) {
        vcrCol = (vcrTime.w > 0.5) ? colPrim : colBg * 0.5;
      }
    }

    // окно VFD-дисплея
    vec2 dspP = p - vec2(0.12, 0.004);
    float dspBox = sdRoundBox(dspP, vec2(0.082, 0.016), 0.002);

    if (dspBox < 0.0) {
      vcrCol = colBg * 0.20; // глубокое затемнённое стекло

      if (vcrTime.w > 0.5) {
        float h = vcrTime.x;
        float m = vcrTime.y;
        float s = vcrTime.z;

        float h10 = floor(h / 10.0);
        float h1  = floor(mod(h, 10.0));
        float m10 = floor(m / 10.0);
        float m1  = floor(mod(m, 10.0));

        // отрисовка 4 цифр времени
        // я не знаю как пофиксить неверный рендер цифр
        float d1 = vcrDigit(dspP - vec2(-0.048, 0.0), h10);
        float d2 = vcrDigit(dspP - vec2(-0.020, 0.0), h1);
        float d3 = vcrDigit(dspP - vec2( 0.020, 0.0), m10);
        float d4 = vcrDigit(dspP - vec2( 0.048, 0.0), m1);
        float digits = min(min(d1, d2), min(d3, d4));

        // мигающее двоеточие
        float colon = 1.0;
        if (fract(s) < 0.5) {
          float dot1 = length(dspP - vec2(0.0,  0.005)) - 0.0022;
          float dot2 = length(dspP - vec2(0.0, -0.005)) - 0.0022;
          colon = min(dot1, dot2);
        }

        if (min(digits, colon) < 0.0) {
          vcrCol = colPrim; // активные люминофорные сегменты
        } else {
          vcrCol += colPrim * 0.05; // легкий фоновый засвет индикатора
        }
      }
    }

    // кнопки управления справа
    vec2 btnGrpP = p - vec2(0.28, 0.004);
    if (abs(btnGrpP.y) < 0.012 && abs(btnGrpP.x) < 0.045) {
      if (fract(btnGrpP.x * 38.0) > 0.22) {
        vcrCol = colSurf * 1.2;
      }
    }

    return vec4(vcrCol, 1.0);
  }

  return vec4(0.0);
}
