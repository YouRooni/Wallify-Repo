/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    shaders/tapes.frag
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

float sdTapeBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - 0.002;
}

// кассета на столе
vec4 drawFlatTape(vec2 p, float angle, vec3 colBg, vec3 colSurf, vec3 colSec, vec3 colPrim) {
  float c = cos(angle), s = sin(angle);
  vec2 q = mat2(c, -s, s, c) * p;

  float body = sdTapeBox(q, vec2(0.052, 0.027));
  if (body < 0.0) {
    vec3 col = colBg * 0.55;

    vec2 stickerP = q - vec2(0.0, 0.003);
    float sticker = sdTapeBox(stickerP, vec2(0.042, 0.017));

    if (sticker < 0.0) {
      col = mix(colSurf * 1.2, colSec, 0.4); // Матовая наклейка

      vec2 winP = stickerP;
      float win = sdTapeBox(winP, vec2(0.026, 0.008));
      if (win < 0.0) {
        col = colBg * 0.3;

        float spoolL = length(winP - vec2(-0.014, 0.0)) - 0.006;
        float spoolR = length(winP - vec2( 0.014, 0.0)) - 0.006;
        float holeL  = length(winP - vec2(-0.014, 0.0)) - 0.0025;
        float holeR  = length(winP - vec2( 0.014, 0.0)) - 0.0025;

        if (max(min(spoolL, spoolR), -min(holeL, holeR)) < 0.0) {
          col = colSurf * 1.3;
        }
      }
    }

    if (abs(q.x) > 0.046 && abs(q.y) < 0.022) {
      if (fract(q.y * 70.0) > 0.5) col = colBg * 0.3;
    }

    return vec4(col, 1.0);
  }

  return vec4(0.0);
}

// монолитная кассета на крышке телевизора
vec4 drawTvTape(vec2 p, vec3 colBg, vec3 colSurf, vec3 colSec, vec3 colPrim) {
  vec2 tapeHalf = vec2(0.048, 0.013);
  float body = sdRoundBox(p, tapeHalf, 0.002);

  if (body < 0.0) {
    vec3 col = colBg * 0.40; // матовый тёмный пластик

    // корешок с бумажной наклейкой
    if (p.y < -0.002) {
      col = colBg * 0.35;
      if (abs(p.x) < 0.038 && p.y > -0.010 && p.y < -0.003) {
        col = mix(colSurf * 1.15, colSec * 0.8, 0.4); // Спокойный цвет бумаги без свечения
        if (abs(p.x) < 0.026 && abs(p.y - (-0.0065)) < 0.001) {
          col = colBg * 0.55;
        }
      }
    } 
    // верхняя грань
    else {
      col = colBg * 0.50;
      if (abs(p.y - (-0.002)) < 0.001) {
        col = colBg * 0.25;
      }

      vec2 winP = p - vec2(0.0, 0.005);
      float win = sdRoundBox(winP * vec2(1.0, 1.6), vec2(0.026, 0.006), 0.002);
      if (win < 0.0) {
        col = colBg * 0.28;
        float spL = length((winP - vec2(-0.014, 0.0)) * vec2(1.0, 1.4)) - 0.005;
        float spR = length((winP - vec2( 0.014, 0.0)) * vec2(1.0, 1.4)) - 0.005;
        if (min(spL, spR) < 0.0) {
          col = colSurf * 1.25;
        }
      }
    }

    return vec4(col, 1.0);
  }

  return vec4(0.0);
}

vec4 renderTapes(vec2 uv, float time, float dither, vec2 wiggles, vec3 colBg, vec3 colSurf, vec3 colSec, vec3 colPrim) {
  // кассета на ТВ
  vec2 tvTapePos = vec2(0.20, 0.248);
  vec2 pTv = uv - tvTapePos;

  if (abs(pTv.x) < 0.07 && pTv.y > -0.025 && pTv.y < 0.035) {
    float shd = sdRoundBox(pTv - vec2(0.003, -0.015), vec2(0.046, 0.003), 0.002);
    if (shd < 0.0 && pTv.y < -0.013) {
      return vec4(colBg * 0.35, 0.55);
    }

    float tiltAngle = sin(wiggles.x * 20.0) * wiggles.x * 0.06;
    float c = cos(tiltAngle), s = sin(tiltAngle);
    vec2 rotPTv = mat2(c, -s, s, c) * pTv;

    vec4 t1 = drawTvTape(rotPTv, colBg, colSurf, colSec, colPrim);
    if (t1.a > 0.0) return t1;
  }

  // стопка кассет на столе
  vec2 tableTapesPos = vec2(-0.21, -0.435);
  vec2 pTbl = uv - tableTapesPos;

  if (abs(pTbl.x) < 0.09 && abs(pTbl.y) < 0.06) {
    float shdTable = sdRoundBox(pTbl - vec2(0.008, -0.024), vec2(0.056, 0.028), 0.006);
    if (shdTable < 0.0 && pTbl.y < -0.015) {
      return vec4(colBg * 0.4, 0.6);
    }

    vec4 tapeBottom = drawFlatTape(pTbl - vec2(0.0, -0.014), 0.02, colBg, colSurf, colSec, colPrim);

    float tblWiggle = sin(wiggles.y * 18.0) * wiggles.y * 0.006;
    vec4 tapeTop = drawFlatTape(pTbl - vec2(0.004, 0.008 + tblWiggle), -0.09, colBg, colSurf, colSec, colPrim);

    if (tapeTop.a > 0.0) return tapeTop;
    if (tapeBottom.a > 0.0) return tapeBottom;
  }

  return vec4(0.0);
}
