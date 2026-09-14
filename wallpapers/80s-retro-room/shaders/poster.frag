/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    shaders/poster.frag
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

vec4 renderPoster(vec2 uv, float dither, vec3 colBg, vec3 colSurf, vec3 colSec, vec3 colPrim) {
  vec2 posterPos = vec2(-0.29, 0.38);
  vec2 p = uv - posterPos;

  // AABB-отсечение (~1.6x от исходного)
  if (abs(p.x) > 0.13 || abs(p.y) > 0.18) {
    return vec4(0.0);
  }

  // рамка постера
  vec2 frameHalf = vec2(0.105, 0.155);
  float frame = sdRoundBox(p, frameHalf, 0.004);

  if (frame < 0.0) {
    vec2 artP = p;
    float artBox = sdRoundBox(artP, frameHalf - vec2(0.006, 0.006), 0.002);

    if (artBox < 0.0) {
      // градиент неонового заката
      float skyT = clamp((artP.y + 0.14) / 0.28, 0.0, 1.0);
      vec3 artCol = mix(colSec * 0.65, colBg * 0.20, skyT);

      // неоновое солнце Outrun
      vec2 sunP = artP - vec2(0.0, 0.024);
      float sunDist = length(sunP) - 0.052;

      if (sunDist < 0.0) {
        float stripe = fract((sunP.y + 0.052) * 36.0);
        float cutThreshold = clamp((-sunP.y + 0.016) * 11.0, 0.0, 0.76);

        if (stripe > cutThreshold || sunP.y > 0.012) {
          artCol = mix(colPrim, vec3(1.0, 0.88, 0.25), 0.65);
        }
      }

      // горная гряда на горизонте
      float horizY = -0.040;
      float mtn1 = abs(artP.x - (-0.040)) * 0.80 + horizY;
      float mtn2 = abs(artP.x - 0.045) * 0.65 + horizY + 0.008;
      if (artP.y < min(mtn1, mtn2) + 0.040 && artP.y > horizY) {
        artCol = colBg * 0.50;
      }

      // перспективная неоновая сетка
      if (artP.y <= horizY) {
        artCol = colBg * 0.32;
        float gridY = fract(1.0 / (abs(artP.y - horizY) + 0.11) * 0.55);
        if (gridY < 0.18) artCol = colSec * 0.92;

        float gridX = abs(artP.x / (abs(artP.y - horizY) + 0.07));
        if (fract(gridX * 3.8) < 0.15) artCol = colSec * 0.92;
      }

      // стеклянный блик
      float glare = abs(artP.x + artP.y * 1.35 - 0.016);
      if (glare < 0.016) {
        artCol = mix(artCol, vec3(1.0), 0.24);
      }

      return vec4(artCol, 1.0);
    }

    // черная рамка с тонкой светлой фаской
    vec3 frameCol = colBg * 0.32;
    if (frame > -0.003) frameCol = colSurf * 1.25;
    return vec4(frameCol, 1.0);
  }

  // тень плаката на стене
  float shadow = sdRoundBox(p - vec2(0.008, -0.008), frameHalf, 0.008);
  if (shadow < 0.0) {
    return vec4(colBg * 0.35, 0.46);
  }

  return vec4(0.0);
}
