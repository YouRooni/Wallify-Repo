/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    shaders/main.frag
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform sampler2D u_tv_texture;
uniform float u_knob_angle;
uniform float u_is_noise;
uniform float u_interference;
uniform float u_cat_twitch;
uniform vec4 u_vcr_time;
uniform vec2 u_tapes_wiggle;
uniform vec2 u_ant_angles;
uniform int u_wall_pattern;
uniform float u_wall_density;

uniform vec3 u_col_bg;
uniform vec3 u_col_surface;
uniform vec3 u_col_secondary;
uniform vec3 u_col_primary;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float bayer4(vec2 p) {
  vec2 b = mod(floor(p), 4.0);
  vec4 r0 = vec4(0.0, 8.0, 2.0, 10.0);
  vec4 r1 = vec4(12.0, 4.0, 14.0, 6.0);
  vec4 r2 = vec4(3.0, 11.0, 1.0, 9.0);
  vec4 r3 = vec4(15.0, 7.0, 13.0, 5.0);
  vec4 row = (b.y < 2.0) ? ((b.y < 1.0) ? r0 : r1) : ((b.y < 3.0) ? r2 : r3);
  float val = (b.x < 2.0) ? ((b.x < 1.0) ? row.x : row.y) : ((b.x < 3.0) ? row.z : row.w);
  return val * 0.0625;
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

vec2 crtCurve(vec2 uv) {
  uv = uv * 2.0 - 1.0;
  vec2 offset = abs(uv.yx) / vec2(5.5, 4.2);
  uv = uv + uv * offset * offset;
  return uv * 0.5 + 0.5;
}

// [PROPS_HOOK]

void main() {
  vec2 pCoord = floor(gl_FragCoord.xy);
  vec2 uv = (pCoord - 0.5 * u_resolution.xy) / u_resolution.x;

  float dither = bayer4(pCoord) - 0.5;

  // обои на стене
  float pattern = 0.0;
  if (u_wall_pattern == 0) {
    pattern = step(0.5, sin(uv.x * u_wall_density) * 0.5 + 0.5);
  } else {
    vec2 rotP = mat2(0.707, -0.707, 0.707, 0.707) * uv * u_wall_density * 0.6;
    pattern = step(0.85, sin(rotP.x) * sin(rotP.y));
  }
  vec3 wallColor = mix(u_col_bg, u_col_surface, pattern * 0.16);

  // анимированные лучи света от окна с мерцанием листвы
  float windowLight = getWindowLightMask(uv, u_time, dither);
  wallColor += u_col_primary * windowLight;

  // декорации стены (Постер и живое Окно)
  vec4 poster = renderPoster(uv, dither, u_col_bg, u_col_surface, u_col_secondary, u_col_primary);
  if (poster.a > 0.0) {
    wallColor = mix(wallColor, poster.rgb, poster.a);
  }

  vec4 windowProp = renderWindow(uv, u_time, dither, u_col_bg, u_col_surface, u_col_secondary, u_col_primary);
  if (windowProp.a > 0.0) {
    wallColor = mix(wallColor, windowProp.rgb, windowProp.a);
  }

  // стол под техникой
  float tableY = -0.32;
  float isTable = step(uv.y, tableY);
  vec3 tableBase = mix(u_col_surface * 0.7, u_col_bg * 0.55, abs(uv.y - tableY) * 2.0);
  tableBase += u_col_primary * windowLight * 0.65;

  // отражение экрана на столе
  vec2 tvCenter = vec2(0.0, -0.04);
  vec2 tvP = uv - tvCenter;
  vec3 reflectionColor = vec3(0.0);

  if (isTable > 0.5) {
    float depth = tableY - uv.y;
    vec2 refScreenP = vec2(tvP.x - (-0.075), -0.22 + depth * 1.45);
    vec2 refUV = (refScreenP / vec2(0.54, 0.44)) + 0.5;

    float edgeFadeX = smoothstep(0.02, 0.22, refUV.x) * smoothstep(0.98, 0.78, refUV.x);
    float edgeFadeY = smoothstep(0.98, 0.65, refUV.y) * exp(-depth * 8.0);
    float falloff = edgeFadeX * edgeFadeY;

    if (falloff > 0.005 && refUV.x >= -0.05 && refUV.x <= 1.05 && refUV.y >= -0.05 && refUV.y <= 1.05) {
      float blur = depth * 0.12;
      vec3 s0 = texture2D(u_tv_texture, clamp(refUV, 0.0, 1.0)).rgb;
      vec3 s1 = texture2D(u_tv_texture, clamp(refUV + vec2(blur, 0.0), 0.0, 1.0)).rgb;
      vec3 s2 = texture2D(u_tv_texture, clamp(refUV - vec2(blur, 0.0), 0.0, 1.0)).rgb;

      float refLum = dot(s0 * 0.5 + (s1 + s2) * 0.25, vec3(0.299, 0.587, 0.114));
      float dithered = step(0.32, (refLum * falloff) + dither * 0.38);

      vec3 lightTint = (u_is_noise > 0.5 || u_interference > 0.4) 
        ? mix(u_col_primary, vec3(0.92), max(u_is_noise, u_interference * 0.8)) 
        : u_col_primary;
        
      reflectionColor = lightTint * dithered * 0.42 * falloff;
    }
  }
  vec3 color = mix(wallColor, tableBase + reflectionColor, isTable);

  // тень телевизора
  float shadow = sdRoundBox(tvP - vec2(0.02, -0.03), vec2(0.40, 0.28), 0.06);
  color = mix(color, color * 0.45, step(shadow, 0.02));

  // антенны
  if (tvP.y > 0.22 && tvP.y < 0.48 && abs(tvP.x) < 0.26) {
    vec2 antBase = vec2(0.0, 0.24);
    float mount = sdRoundBox(tvP - antBase, vec2(0.032, 0.008), 0.004);

    const float rodLen = 0.24;
    vec2 baseL = antBase + vec2(-0.015, 0.0);
    vec2 tipPosL = baseL + vec2(cos(u_ant_angles.x), sin(u_ant_angles.x)) * rodLen;

    vec2 baseR = antBase + vec2(0.015, 0.0);
    vec2 tipPosR = baseR + vec2(cos(u_ant_angles.y), sin(u_ant_angles.y)) * rodLen;

    float rodL = sdSegment(tvP, baseL, tipPosL);
    float rodR = sdSegment(tvP, baseR, tipPosR);
    float rods = min(rodL, rodR) - 0.005;

    float tipL = length(tvP - tipPosL) - 0.014;
    float tipR = length(tvP - tipPosR) - 0.014;
    float antenna = min(mount, min(rods, min(tipL, tipR)));

    if (antenna < 0.0) {
      color = mix(u_col_secondary, u_col_primary, step(0.0, min(tipL, tipR)));
    }
  }

  // корпус телевизора
  float tvBody = sdRoundBox(tvP, vec2(0.40, 0.28), 0.045);
  if (tvBody < 0.0) {
    color = mix(u_col_surface * 0.95, u_col_bg * 0.85, length(tvP) * 1.2);

    if (tvBody > -0.015) {
      color = u_col_surface * 1.15;
    }

    // кинескоп
    vec2 screenP = tvP - vec2(-0.075, 0.0);
    float screenBevel = sdRoundBox(screenP, vec2(0.27, 0.22), 0.04);

    if (screenBevel < 0.0) {
      vec2 sUV = (screenP / vec2(0.54, 0.44)) + 0.5;
      sUV = crtCurve(sUV);

      if (sUV.x >= 0.0 && sUV.x <= 1.0 && sUV.y >= 0.0 && sUV.y <= 1.0) {
        if (u_interference > 0.02) {
          float lineBand = floor(pCoord.y * 0.3);
          float glitchProb = step(1.0 - u_interference * 0.42, hash(vec2(floor(u_time * 16.0), lineBand)));
          float lineOffset = (hash(vec2(u_time * 35.0, lineBand)) - 0.5) * 0.16 * u_interference;
          sUV.x += glitchProb * lineOffset;
        }

        vec3 tvPix = texture2D(u_tv_texture, clamp(sUV, 0.0, 1.0)).rgb;

        if (u_interference > 0.02) {
          float snow = hash(pCoord + fract(u_time * 47.0));
          float humBar = sin(sUV.y * 7.0 - u_time * 4.0);
          float barAdd = smoothstep(0.82, 1.0, humBar) * 0.3 * u_interference;
          tvPix = mix(tvPix, vec3(snow + barAdd), u_interference * 0.78);
        }

        float rawLum = dot(tvPix, vec3(0.299, 0.587, 0.114));
        float lum = clamp(rawLum + dither * 0.333, 0.0, 1.0);
        float level = floor(lum * 3.0 + 0.5);

        vec3 ditheredCol = u_col_bg;
        if (u_is_noise > 0.5) {
          if (level == 1.0) ditheredCol = vec3(0.22);
          else if (level == 2.0) ditheredCol = vec3(0.65);
          else if (level >= 3.0) ditheredCol = vec3(0.97);
          else ditheredCol = vec3(0.04);
        } else {
          if (level == 1.0) ditheredCol = u_col_surface;
          else if (level == 2.0) ditheredCol = u_col_secondary;
          else if (level >= 3.0) ditheredCol = u_col_primary;
        }

        float scanline = step(0.5, fract(pCoord.y * 0.5)) * 0.12;
        float vig = clamp(16.0 * sUV.x * sUV.y * (1.0 - sUV.x) * (1.0 - sUV.y), 0.0, 1.0);
        vig = pow(vig, 0.2);

        color = (ditheredCol - scanline) * vig;
      } else {
        color = u_col_bg * 0.35;
      }
    }

    // тумблер
    vec2 knobP = tvP - vec2(0.29, 0.08);
    float knobDist = length(knobP) - 0.052;
    if (knobDist < 0.0) {
      color = u_col_surface * 1.25;
      vec2 rK = vec2(
        cos(u_knob_angle) * knobP.x - sin(u_knob_angle) * knobP.y,
        sin(u_knob_angle) * knobP.x + cos(u_knob_angle) * knobP.y
      );
      if (abs(rK.x) < 0.006 && rK.y > 0.01 && rK.y < 0.045) {
        color = u_col_primary;
      }
    }

    // динамик
    vec2 spkP = tvP - vec2(0.29, -0.12);
    if (abs(spkP.x) < 0.065 && abs(spkP.y) < 0.07) {
      float slots = step(0.5, fract(pCoord.y * 0.25));
      color = mix(color, u_col_bg * 0.3, slots * 0.7);
    }
  }

  // видеомагнитофон под ТВ
  vec4 vcr = renderVCR(uv, u_time, dither, u_vcr_time, u_col_bg, u_col_surface, u_col_secondary, u_col_primary);
  if (vcr.a > 0.0) {
    color = mix(color, vcr.rgb, vcr.a);
  }

  // видеокассеты VHS
  vec4 tapes = renderTapes(uv, u_time, dither, u_tapes_wiggle, u_col_bg, u_col_surface, u_col_secondary, u_col_primary);
  if (tapes.a > 0.0) {
    color = mix(color, tapes.rgb, tapes.a);
  }

  // декорации на столе и крышке ТВ
  vec4 plant = renderPlant(uv, u_time, dither, u_col_bg, u_col_surface, u_col_secondary, u_col_primary);
  if (plant.a > 0.0) {
    color = mix(color, plant.rgb, plant.a);
  }

  vec4 mug = renderMug(uv, u_time, dither, u_col_bg, u_col_surface, u_col_secondary, u_col_primary);
  if (mug.a > 0.0) {
    color = mix(color, mug.rgb, mug.a);
  }

  vec4 cat = renderCat(uv, u_time, dither, u_cat_twitch, u_col_bg, u_col_surface, u_col_secondary, u_col_primary);
  if (cat.a > 0.0) {
    color = mix(color, cat.rgb, cat.a);
  }

  gl_FragColor = vec4(color, 1.0);
}
