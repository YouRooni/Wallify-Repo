/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    shaders/mug.frag
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

vec4 renderMug(vec2 uv, float time, float dither, vec3 colBg, vec3 colSurf, vec3 colSec, vec3 colPrim) {
  // bounding box: отсекаем 98% пикселей экрана сразу
  if (abs(uv.x - 0.28) > 0.09 || uv.y < -0.52 || uv.y > -0.28) {
    return vec4(0.0);
  }

  vec2 mugPos = vec2(0.28, -0.45);
  vec2 p = uv - mugPos;

  // тень
  float shadow = sdRoundBox(p - vec2(0.012, -0.038), vec2(0.042, 0.010), 0.008);
  if (shadow < 0.0 && p.y < -0.02) {
    return vec4(colBg * 0.4, 0.65);
  }

  // ручка
  vec2 handleP = p - vec2(0.042, 0.002);
  float handleOuter = length(handleP * vec2(1.0, 1.25)) - 0.022;
  float handleInner = length(handleP * vec2(1.0, 1.25)) - 0.011;
  float handle = max(handleOuter, -handleInner);
  handle = max(handle, -p.x + 0.028);

  float cupBody = sdRoundBox(p, vec2(0.036, 0.034), 0.006);

  vec2 rimP = p - vec2(0.0, 0.034);
  float rim = sdRoundBox(rimP, vec2(0.034, 0.005), 0.003);
  float coffee = sdRoundBox(rimP - vec2(0.0, -0.002), vec2(0.028, 0.003), 0.002);

  // пар
  if (p.y > 0.042 && p.y < 0.16 && abs(p.x) < 0.045) {
    float wave1 = sin(p.y * 38.0 - time * 3.5 + p.x * 20.0) * 0.008;
    float wave2 = cos(p.y * 45.0 - time * 4.0 - p.x * 15.0) * 0.007;

    float dWisp1 = abs(p.x - wave1 - 0.008) - 0.0025;
    float dWisp2 = abs(p.x - wave2 + 0.010) - 0.0025;
    float wisp = min(dWisp1, dWisp2);

    if (wisp < 0.0) {
      float fade = smoothstep(0.042, 0.065, p.y) * smoothstep(0.16, 0.09, p.y);
      if (fade + dither * 0.35 > 0.4) {
        return vec4(mix(colSurf, colPrim, 0.6), 0.55 * fade);
      }
    }
  }

  if (handle < 0.0 && cupBody > 0.0) {
    vec3 hCol = (p.x > 0.052) ? colPrim : colSurf * 1.1;
    return vec4(hCol, 1.0);
  }

  if (cupBody < 0.0) {
    if (coffee < 0.0) return vec4(colBg * 0.45, 1.0);
    if (rim < 0.0) return vec4(colPrim, 1.0);

    float shade = smoothstep(-0.036, 0.036, p.x);
    vec3 mugCol = mix(colSurf * 1.3, colSurf * 0.85, shade);

    if (abs(p.x - (-0.016)) < 0.006) mugCol = colPrim;
    if (p.x > 0.01 && shade + dither * 0.25 > 0.7) mugCol = colSec * 0.85;

    return vec4(mugCol, 1.0);
  }

  return vec4(0.0);
}
