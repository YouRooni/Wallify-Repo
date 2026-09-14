/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    shaders/window.frag
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

float getWindowLightMask(vec2 uv, float time, float dither) {
  // точка привязки светового пучка смещена выше
  vec2 winPos = vec2(0.33, 0.48);
  vec2 p = uv - winPos;

  // спокойное маятниковое покачивание
  float windSway = sin(time * 1.1) * 0.006 + sin(time * 2.3) * 0.002;

  // более пологий угол лучей (-0.56) поднимает свет выше по всей сцене
  vec2 rayDir = normalize(vec2(-1.15, -0.56 + windSway * 0.25));
  vec2 rayNormal = vec2(-rayDir.y, rayDir.x);

  float dist = dot(p, rayDir);
  float lateral = dot(p, rayNormal);

  // коническое расширение пучка
  float halfWidth = mix(0.16, 0.46, clamp(dist / 0.90, 0.0, 1.0));

  if (dist > -0.06 && dist < 0.95 && abs(lateral) < halfWidth) {
    float raySlope = rayDir.y / rayDir.x;
    float yOrigin = uv.y - raySlope * (uv.x - winPos.x);
    float topShadow = smoothstep(winPos.y + 0.05, winPos.y - 0.04, yOrigin);

    float lateralFade = smoothstep(halfWidth, halfWidth * 0.35, abs(lateral));
    float distFade = smoothstep(-0.06, 0.05, dist) * smoothstep(0.92, 0.22, dist) * exp(-dist * 1.85);
    float distT = clamp(dist / 0.80, 0.0, 1.0);

    // полосы жалюзи согласованы с новым приподнятым углом
    float slatCoord = (uv.y - uv.x * 0.48 + windSway * 0.45) * 32.0;
    float blur = mix(0.14, 1.90, distT);
    float slatWave = sin(slatCoord);
    float slatMask = smoothstep(-blur, blur, slatWave);
    slatMask = mix(slatMask, 0.5, distT * 0.85);

    // полутени листвы
    float l1 = sin(time * 2.8 + uv.x * 20.0 + uv.y * 14.0);
    float l2 = cos(time * 4.1 - uv.x * 24.0 + uv.y * 18.0);
    float leafDapple = smoothstep(-0.75, 0.75, l1 * 0.60 + l2 * 0.40);
    float leafShadow = mix(0.72, 1.25, leafDapple);

    float windGust = 1.0 + sin(time * 1.2) * 0.08;
    float beam = mix(0.12, 1.0, slatMask) * leafShadow * windGust * lateralFade * distFade * topShadow;

    return clamp(beam + dither * 0.09, 0.0, 1.0) * 0.34;
  }

  return 0.0;
}

vec4 renderWindow(vec2 uv, float time, float dither, vec3 colBg, vec3 colSurf, vec3 colSec, vec3 colPrim) {
  vec2 winPos = vec2(0.33, 0.44);
  vec2 p = uv - winPos;

  // AABB-отсечение
  if (abs(p.x) > 0.18 || abs(p.y) > 0.31) {
    return vec4(0.0);
  }

  // размер 1 виртуального пикселя канваса
  float pix = (u_resolution.x > 0.0) ? (1.0 / u_resolution.x) : 0.0035;
  float cordWidth = max(pix * 0.65, 0.0034);

  vec2 frameHalf = vec2(0.155, 0.280);
  vec2 paneHalf  = frameHalf - vec2(0.012, 0.012);

  float frame = sdRoundBox(p, frameHalf, 0.005);

  if (frame < 0.0) {
    // маятниковое смещение жалюзи при сквозняке
    float bodySwayX = sin(time * 1.4) * 0.0028 + sin(time * 2.6) * 0.0010;
    float bodySwayY = sin(time * 1.1) * 0.0012;
    float angularTilt = sin(time * 1.2) * 0.012;

    vec2 slatHalf = vec2(paneHalf.x + 0.0045, paneHalf.y + 0.002);
    vec2 slatP = p - vec2(bodySwayX, bodySwayY);

    float slatBox = sdRoundBox(slatP, slatHalf, 0.001);
    float pane = sdRoundBox(p, paneHalf, 0.002);

    vec3 resultCol = vec3(0.0);
    bool hasContent = false;

    // полотно жалюзи
    if (slatBox < 0.0) {
      float skyGrad = clamp((p.y + 0.26) / 0.52, 0.0, 1.0);
      vec3 skyCol = mix(colBg * 0.38, colBg * 0.12, skyGrad);

      float slatY = slatP.y + slatP.x * angularTilt;
      float blindSlat = fract((slatY + 0.26) * 22.0);

      float extLeaf = sin(time * 2.6 + p.x * 24.0) * cos(time * 3.4 + p.y * 28.0);
      vec3 lightGlow = mix(colPrim, vec3(0.92, 0.96, 1.0), 0.55) * (0.88 + extLeaf * 0.20);

      // просвет между планками
      if (blindSlat > 0.46) {
        if (pane < 0.0) {
          resultCol = mix(skyCol, lightGlow, 0.65);
        } else {
          resultCol = colSurf * 0.95;
        }

        // 2 соединительные нити строго в просветах
        float cordDistL = abs(slatP.x - (-0.105));
        float cordDistR = abs(slatP.x - 0.105);
        if (min(cordDistL, cordDistR) < cordWidth) {
          resultCol = mix(resultCol, colBg * 0.40, 0.38);
        }
      } 
      // планка жалюзи
      else {
        float slatShade = smoothstep(0.0, 0.46, blindSlat);
        resultCol = mix(colSurf * 0.75, colBg * 0.70, slatShade);

        if (blindSlat < 0.08) {
          resultCol = mix(resultCol, lightGlow, 0.50);
        }
        if (pane > -0.006) {
          resultCol = mix(resultCol, colSurf * 1.05, 0.30);
        }
      }

      // тень козырька сверху
      float exteriorRoofShadow = smoothstep(0.02, 0.22, p.y);
      resultCol = mix(resultCol, colBg * 0.25, exteriorRoofShadow * 0.70);

      hasContent = true;
    }

    // тень кончиков жалюзи на раму
    float overlapShadow = sdRoundBox(slatP - vec2(-0.003, -0.002), slatHalf, 0.003);
    if (!hasContent && overlapShadow < 0.0 && pane > 0.0) {
      resultCol = colBg * 0.45;
      hasContent = true;
    }

    // деревянная рама окна
    if (!hasContent) {
      float fShade = smoothstep(-0.155, 0.155, p.x);
      resultCol = mix(colSurf * 1.12, colSurf * 0.84, fShade);

      if (frame > -0.005) {
        resultCol = colSurf * 1.35;
      }
      if (abs(p.x) < 0.005 && pane > 0.0) {
        resultCol = colSurf * 0.90;
      }
    }

    // боковой шнур управления
    float pullCordX = paneHalf.x - 0.016 + bodySwayX * 1.2;
    float cordDist = abs(p.x - pullCordX);

    if (cordDist < cordWidth && p.y < paneHalf.y && p.y > -0.10) {
      resultCol = mix(colSurf * 1.20, colBg * 0.50, 0.35);
    }

    // грузик-колокольчик
    vec2 bellP = p - vec2(pullCordX, -0.106);
    float bell = sdRoundBox(bellP, vec2(0.0035, 0.0075), 0.002);
    if (bell < 0.0) {
      resultCol = mix(colSurf * 1.35, colBg * 0.45, smoothstep(-0.0035, 0.0035, bellP.x));
    }

    return vec4(resultCol, 1.0);
  }

  // тень всей рамы окна на стене
  float winShadow = sdRoundBox(p - vec2(-0.012, -0.012), frameHalf, 0.012);
  if (winShadow < 0.0) {
    return vec4(colBg * 0.4, 0.48);
  }

  return vec4(0.0);
}
