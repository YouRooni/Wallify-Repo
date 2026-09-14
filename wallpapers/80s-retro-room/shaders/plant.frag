/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    shaders/plant.frag
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

vec4 renderPlant(vec2 uv, float time, float dither, vec3 colBg, vec3 colSurf, vec3 colSec, vec3 colPrim) {
  // bounding box
  if (abs(uv.x - (-0.29)) > 0.10 || uv.y < -0.52 || uv.y > -0.28) {
    return vec4(0.0);
  }

  vec2 plantPos = vec2(-0.29, -0.42);
  vec2 p = uv - plantPos;

  // тень
  float shadow = sdRoundBox(p - vec2(0.015, -0.058), vec2(0.046, 0.010), 0.008);
  if (shadow < 0.0 && p.y < -0.04) {
    return vec4(colBg * 0.4, 0.65);
  }

  vec2 rimP = p - vec2(0.0, 0.005);
  float rim = sdRoundBox(rimP, vec2(0.044, 0.007), 0.003);

  float potT = clamp((p.y - (-0.05)) / 0.055, 0.0, 1.0);
  float halfW = mix(0.028, 0.040, potT);
  float body = sdRoundBox(p - vec2(0.0, -0.024), vec2(halfW, 0.026), 0.004);
  float soil = sdRoundBox(rimP - vec2(0.0, -0.002), vec2(0.038, 0.003), 0.002);

  // листья с покачиванием
  float sway = sin(time * 1.8) * 0.05;

  vec2 l1P = p - vec2(-0.038, 0.028);
  l1P = mat2(cos(-0.7 + sway), -sin(-0.7 + sway), sin(-0.7 + sway), cos(-0.7 + sway)) * l1P;
  float leaf1 = sdRoundBox(l1P, vec2(0.028, 0.010), 0.006);

  vec2 l2P = p - vec2(0.038, 0.032);
  l2P = mat2(cos(0.65 - sway), -sin(0.65 - sway), sin(0.65 - sway), cos(0.65 - sway)) * l2P;
  float leaf2 = sdRoundBox(l2P, vec2(0.026, 0.009), 0.006);

  vec2 l3P = p - vec2(0.002, 0.065);
  l3P = mat2(cos(sway * 0.7), -sin(sway * 0.7), sin(sway * 0.7), cos(sway * 0.7)) * l3P;
  float leaf3 = sdRoundBox(l3P, vec2(0.012, 0.032), 0.007);

  vec2 l4P = p - vec2(-0.025, 0.052);
  l4P = mat2(cos(-0.35 + sway * 1.2), -sin(-0.35 + sway * 1.2), sin(-0.35 + sway * 1.2), cos(-0.35 + sway * 1.2)) * l4P;
  float leaf4 = sdRoundBox(l4P, vec2(0.022, 0.009), 0.006);

  vec2 l5P = p - vec2(0.026, 0.054);
  l5P = mat2(cos(0.40 - sway * 1.1), -sin(0.40 - sway * 1.1), sin(0.40 - sway * 1.1), cos(0.40 - sway * 1.1)) * l5P;
  float leaf5 = sdRoundBox(l5P, vec2(0.024, 0.009), 0.006);

  float leaves = min(min(min(leaf1, leaf2), leaf3), min(leaf4, leaf5));

  float stem1 = sdSegment(p, vec2(0.0, 0.01), vec2(-0.038, 0.028)) - 0.003;
  float stem2 = sdSegment(p, vec2(0.0, 0.01), vec2(0.038, 0.032)) - 0.003;
  float stem3 = sdSegment(p, vec2(0.0, 0.01), vec2(0.002, 0.065)) - 0.003;
  float stems = min(min(stem1, stem2), stem3);

  if (min(leaves, stems) < 0.0) {
    vec3 leafCol = colSec;
    if (leaf3 < 0.0 || leaf5 < 0.0) {
      if (dither > 0.0) leafCol = mix(colSec, colPrim, 0.7);
    }
    if (leaf1 < 0.0 && p.x < -0.04) leafCol = mix(colSec, colBg, 0.4);
    if (stems < 0.0) leafCol = colPrim;
    return vec4(leafCol, 1.0);
  }

  if (min(rim, body) < 0.0) {
    if (soil < 0.0) return vec4(colBg * 0.35, 1.0);
    if (rim < 0.0) return vec4(colSurf * 1.25, 1.0);

    float shade = smoothstep(-halfW, halfW, p.x);
    vec3 potCol = mix(colSurf * 1.15, colSurf * 0.8, shade);
    if (shade + dither * 0.3 > 0.65) potCol = colSec * 0.7;

    return vec4(potCol, 1.0);
  }

  return vec4(0.0);
}
