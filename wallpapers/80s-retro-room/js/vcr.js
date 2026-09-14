/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    js/vcr.js
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

window.VCRManager = {
  pos: { x: 0.0, y: -0.365 },
  size: { w: 0.38, h: 0.045 },
  isPowerOn: 1.0,

  checkHit(uvX, uvY) {
    const dx = uvX - this.pos.x;
    const dy = uvY - this.pos.y;

    if (Math.abs(dx) <= this.size.w && Math.abs(dy) <= this.size.h) {
      // кнопка питания слева
      if (dx < -0.28) {
        this.isPowerOn = this.isPowerOn > 0.5 ? 0.0 : 1.0;
        if (navigator.vibrate) navigator.vibrate(22);
        return true;
      }
      // слот кассеты
      if (dx > -0.26 && dx < -0.02) {
        if (navigator.vibrate) navigator.vibrate([15, 30]);
        return true;
      }
      // кнопки управления справа
      if (dx > 0.24) {
        if (navigator.vibrate) navigator.vibrate(12);
        return true;
      }
    }
    return false;
  },

  update(dt) {},

  getTimeVec() {
    const now = new Date();
    return [
      now.getHours(),
      now.getMinutes(),
      now.getSeconds() + now.getMilliseconds() / 1000.0,
      this.isPowerOn
    ];
  }
};
