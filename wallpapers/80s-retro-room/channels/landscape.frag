/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    channels/landscape.frag
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_col_bg;
uniform vec3 u_col_primary;
uniform vec3 u_col_secondary;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  vec3 col = u_col_bg;

  float horizon = -0.05;

  if (uv.y > horizon) {
    // небо и солнце
    vec2 sunUV = uv - vec2(0.0, 0.13);
    float sunDist = length(sunUV);
    float sunRadius = 0.23;

    if (sunDist < sunRadius) {
      float cut = sin(sunUV.y * 65.0 - u_time * 1.5);
      float barWidth = smoothstep(-0.2, 0.2, sunUV.y / sunRadius);
      if (cut > -0.25 * barWidth || sunUV.y < -0.1) {
        float sunGrad = clamp((sunUV.y + sunRadius) / (2.0 * sunRadius), 0.0, 1.0);
        col = mix(u_col_secondary, u_col_primary, sunGrad);
      }
    }
    col += u_col_secondary * max(0.0, 0.1 - abs(uv.y - horizon)) * 1.5;
  } else {
    // 3D-сетка
    float depth = horizon - uv.y;
    float z = 0.35 / depth;
    float x = uv.x * z * 1.8;

    vec2 gridUV = vec2(x, z + u_time * 1.5);

    // холмы по бокам
    float hills = sin(gridUV.x * 0.8) * cos(gridUV.y * 0.4) * 0.2;
    float valley = smoothstep(0.0, 1.2, abs(x));
    gridUV.y += hills * valley;

    // сетка без fwidth (совместимо с WebGL 1.0)
    vec2 lines = abs(sin(gridUV * 3.14159));
    float gridMask = step(0.88, max(lines.x, lines.y));

    float fog = clamp(depth * 4.5, 0.0, 1.0);
    vec3 gridCol = mix(u_col_secondary, u_col_primary, clamp(gridUV.y * 0.04, 0.0, 1.0));

    col = mix(u_col_bg, gridCol, gridMask * fog);
  }

  gl_FragColor = vec4(col, 1.0);
}
