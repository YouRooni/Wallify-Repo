/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    js/wall.js
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

window.WallManager = {
  // винтажные вертикальные полосы, ромбовидная сетка (trellis)
  patternType: 0,
  density: 32.0,
  stripesContrast: 0.18,

  setPattern(type) {
    this.patternType = type;
  },

  applyUniforms(gl, locPattern, locDensity) {
    if (locPattern) gl.uniform1i(locPattern, this.patternType);
    if (locDensity) gl.uniform1f(locDensity, this.density);
  }
};
