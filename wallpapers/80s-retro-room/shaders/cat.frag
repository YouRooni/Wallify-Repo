/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    shaders/cat.frag
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

float sdCatEar(vec2 p, float angle) {
  float c = cos(angle), s = sin(angle);
  vec2 q = mat2(c, -s, s, c) * p;
  float side = abs(q.x) * 1.35 + q.y;
  return max(side - 0.025, -q.y) - 0.003;
}

vec4 renderCat(vec2 uv, float time, float dither, float catTwitch, vec3 colBg, vec3 colSurf, vec3 colSec, vec3 colPrim) {
  vec2 catPos = vec2(-0.15, 0.245);
  vec2 p = uv - catPos;

  // AABB-отсечение
  if (p.x < -0.18 || p.x > 0.17 || p.y < -0.14 || p.y > 0.14) {
    return vec4(0.0);
  }

  // дыхание
  float breath = sin(time * 2.2) * 0.003;

  // тень на корпусе ТВ
  float catShadow = sdRoundBox(p - vec2(-0.01, -0.008), vec2(0.10, 0.012), 0.008);
  if (catShadow < 0.0 && p.y < 0.006) {
    return vec4(colBg * 0.35, 0.55);
  }

  // хвост с ленивым вздрагиванием
  float sTwitch = max(0.0, sin(time * 0.9));
  float twitch = sTwitch * sTwitch * sTwitch * sTwitch * sin(time * 12.0) * 0.015;
  vec2 tailRoot = vec2(-0.075, 0.015);
  vec2 tailMid  = vec2(-0.105, -0.040);
  vec2 tailTip  = vec2(-0.095 + twitch, -0.105);

  float tailSeg1 = sdSegment(p, tailRoot, tailMid) - 0.011;
  float tailSeg2 = sdSegment(p, tailMid, tailTip) - 0.009;
  float tail = min(tailSeg1, tailSeg2);

  float tailShadow = min(
    sdSegment(p - vec2(0.006, -0.006), tailRoot, tailMid) - 0.012,
    sdSegment(p - vec2(0.006, -0.006), tailMid, tailTip) - 0.010
  );
  if (tailShadow < 0.0 && tail > 0.0) {
    return vec4(colBg * 0.3, 0.45);
  }

  // тело калачиком
  vec2 bodyP = p - vec2(-0.020, 0.028 + breath);
  float body = sdRoundBox(bodyP, vec2(0.068, 0.028 + breath), 0.022);

  // широкая голова кота
  vec2 headP = p - vec2(0.056, 0.016 + breath * 0.4);
  float head = sdRoundBox(headP, vec2(0.026, 0.015), 0.016);

  // пухлые щечки
  float muzzleL = length(headP - vec2(-0.007, -0.010)) - 0.011;
  float muzzleR = length(headP - vec2( 0.008, -0.010)) - 0.011;
  float cheeks  = min(muzzleL, muzzleR);

  // поджатая лапка
  vec2 pawP = headP - vec2(-0.014, -0.022);
  float paw = sdRoundBox(pawP, vec2(0.012, 0.006), 0.004);

  // ушки кота (мягкая физика наклона без резких вибраций)
  vec2 earLP = headP - vec2(-0.016, 0.016);
  float earL = sdCatEar(earLP, 0.42);
  float earL_Inner = sdCatEar(earLP - vec2(0.001, -0.003), 0.42);

  // плавный синусоидальный взмах ушка при тапе
  float earFlick = sin((1.0 - catTwitch) * 12.5) * catTwitch * catTwitch * 0.28;
  vec2 earRP = headP - vec2(0.018, 0.016);
  float earR = sdCatEar(earRP, -0.42 + earFlick);
  float earR_Inner = sdCatEar(earRP - vec2(-0.001, -0.003), -0.42 + earFlick);

  float ears = min(earL, earR);
  float earsInner = min(earL_Inner, earR_Inner);

  // рендеринг хвоста
  if (tail < 0.0) {
    vec3 tailCol = mix(colSurf * 0.95, colBg * 0.9, smoothstep(-0.105, -0.07, p.x));
    if (p.y < -0.085) {
      tailCol = mix(colSurf * 1.3, colPrim, 0.8);
    } else {
      float tStripe = step(0.5, fract(p.y * 55.0));
      tailCol = mix(tailCol, colBg * 0.55, tStripe * 0.35);
    }
    return vec4(tailCol, 1.0);
  }

  // лапка
  if (paw < 0.0 && head > 0.0) {
    vec3 pawCol = mix(colSurf * 1.2, colPrim, 0.7);
    if (pawP.x < -0.002) pawCol = colSurf * 0.95;
    return vec4(pawCol, 1.0);
  }

  // мордочка, щеки и уши (затемненный контрастный тон)
  if (min(min(head, cheeks), ears) < 0.0) {
    // базовый цвет головы сделан глубже, чтобы не сливаться со светлыми антеннами
    vec3 headCol = mix(colSurf * 0.92, colBg * 0.85, 0.25);

    // внутренняя раковина ушек
    if (earsInner < -0.004) {
      headCol = mix(colSurf * 1.05, colSec * 0.8, 0.5);
    } else if (ears < 0.0) {
      headCol = mix(colSurf * 0.85, colBg, 0.2);
    }

    // спящие глаза
    vec2 eyeLP = headP - vec2(-0.012, 0.002);
    vec2 eyeRP = headP - vec2( 0.014, 0.002);
    float eyeL = abs(length(eyeLP - vec2(0.0, -0.006)) - 0.008);
    float eyeR = abs(length(eyeRP - vec2(0.0, -0.006)) - 0.008);

    if ((eyeL < 0.0022 && eyeLP.y > -0.002 && eyeLP.y < 0.005 && abs(eyeLP.x) < 0.0075) ||
        (eyeR < 0.0022 && eyeRP.y > -0.002 && eyeRP.y < 0.005 && abs(eyeRP.x) < 0.0075)) {
      headCol = colBg * 0.25;
    }

    // подушечки усов (аккуратный теневой контраст)
    if (cheeks < 0.0 && headP.y < -0.004) {
      headCol = mix(colSurf * 1.05, colSec * 0.7, 0.4);
    }

    // носик
    vec2 noseP = headP - vec2(0.0005, -0.005);
    if (abs(noseP.x) * 1.2 - noseP.y < 0.0045 && noseP.y > -0.003) {
      headCol = mix(colSec, colPrim, 0.6);
    }

    // полоски на лбу
    if (headP.y > 0.008 && abs(headP.x) < 0.018 && ears > 0.0) {
      float forehead = step(0.5, fract(headP.x * 65.0));
      headCol = mix(headCol, colBg * 0.5, forehead * 0.35);
    }

    // усы
    vec2 wP = headP - vec2(0.0, -0.010);
    if (abs(wP.y) < 0.012 && abs(wP.x) > 0.016 && abs(wP.x) < 0.042) {
      float wLine1 = abs(wP.y - (wP.x > 0.0 ? -0.15 : 0.15) * (abs(wP.x) - 0.016));
      float wLine2 = abs(wP.y + 0.004 - (wP.x > 0.0 ? -0.32 : 0.32) * (abs(wP.x) - 0.016));
      if (min(wLine1, wLine2) < 0.0016) {
        headCol = colPrim * 0.85;
      }
    }

    return vec4(headCol, 1.0);
  }

  // тело
  if (body < 0.0) {
    float shade = smoothstep(-0.068, 0.068, bodyP.x);
    vec3 bodyCol = mix(colSurf * 1.05, colSurf * 0.82, shade);

    float stripes = step(0.48, sin(bodyP.x * 45.0 + bodyP.y * 14.0));
    bodyCol = mix(bodyCol, colBg * 0.55, stripes * 0.35);

    if (bodyP.y > 0.025 && dither > 0.05) {
      bodyCol = mix(bodyCol, colSec * 0.8, 0.4);
    }

    return vec4(bodyCol, 1.0);
  }

  return vec4(0.0);
}
