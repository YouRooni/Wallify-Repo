/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    js/cat.js
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

window.CatManager = {
  // центр кота на крышке ТВ и радиус зоны нажатия
  pos: { x: -0.15, y: 0.25 },
  hitRadius: 0.12,
  twitchTimer: 0.0,

  checkHit(uvX, uvY) {
    const dist = Math.hypot(uvX - this.pos.x, uvY - this.pos.y);
    if (dist < this.hitRadius) {
      this.triggerTwitch();
      return true;
    }
    return false;
  },

  triggerTwitch() {
    this.twitchTimer = 1.0;
    if (navigator.vibrate) {
      navigator.vibrate(18);
    }
  },

  update(dt) {
    if (this.twitchTimer > 0.0) {
      // плавный спад без рывков
      this.twitchTimer = Math.max(0.0, this.twitchTimer - dt * 1.6);
    }
  },

  getTwitch() {
    return this.twitchTimer;
  }
};
