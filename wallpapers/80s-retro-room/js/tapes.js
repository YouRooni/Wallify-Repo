/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    js/tapes.js
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

window.TapesManager = {
  wiggleTv: 0.0,
  wiggleTable: 0.0,

  checkHit(uvX, uvY) {
    // кассета на ТВ
    const dTvTape = Math.hypot(uvX - 0.20, uvY - 0.248);
    if (dTvTape < 0.055) {
      this.triggerTv();
      return true;
    }

    // стопка кассет на столе
    const dTableTape = Math.hypot(uvX - (-0.21), uvY - (-0.435));
    if (dTableTape < 0.075) {
      this.triggerTable();
      return true;
    }

    return false;
  },

  triggerTv() {
    this.wiggleTv = 1.0;
    if (navigator.vibrate) navigator.vibrate(15);
  },

  triggerTable() {
    this.wiggleTable = 1.0;
    if (navigator.vibrate) navigator.vibrate([14, 25, 14]);
  },

  update(dt) {
    if (this.wiggleTv > 0.0) {
      this.wiggleTv = Math.max(0.0, this.wiggleTv - dt * 2.8);
    }
    if (this.wiggleTable > 0.0) {
      this.wiggleTable = Math.max(0.0, this.wiggleTable - dt * 2.4);
    }
  },

  getWiggleVec() {
    return [this.wiggleTv, this.wiggleTable];
  }
};
