/*
         |\      _,,,---,,_
  ZZZzz /, `.-'`'    -.  ;-;;,_
       |,4-  ) )-,_. ,` (  `'-'
      '---''(_/--'  `-'\_)

    js/main.js
    This code is part of Retro CRT Wallpaper
    rich_beluga, 2026
*/

(async function() {
  const canvas = document.getElementById('glcanvas');
  const gl = canvas.getContext('webgl', { 
    antialias: false, 
    depth: false, 
    alpha: false, 
    powerPreference: 'low-power' 
  });
  if (!gl) return console.error('WebGL не поддерживается');

  async function loadShaderText(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Ошибка загрузки: ${url} (код: ${res.status})`);
    return await res.text();
  }

  const vsSrc = `attribute vec2 a_p; void main(){ gl_Position = vec4(a_p, 0.0, 1.0); }`;

  function createProgram(fsSrc) {
    function compile(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const err = gl.getShaderInfoLog(sh);
        console.error('Shader compile error:', err);
        throw new Error(err);
      }
      return sh;
    }
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(p);

    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const err = gl.getProgramInfoLog(p);
      console.error('Program link error:', err);
      throw new Error(err);
    }

    const aPos = gl.getAttribLocation(p, 'a_p');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    return {
      prog: p,
      locs: {
        res: gl.getUniformLocation(p, 'u_resolution'),
        time: gl.getUniformLocation(p, 'u_time'),
        knob: gl.getUniformLocation(p, 'u_knob_angle'),
        isNoise: gl.getUniformLocation(p, 'u_is_noise'),
        interference: gl.getUniformLocation(p, 'u_interference'),
        catTwitch: gl.getUniformLocation(p, 'u_cat_twitch'),
        vcrTime: gl.getUniformLocation(p, 'u_vcr_time'),
        tapesWiggle: gl.getUniformLocation(p, 'u_tapes_wiggle'),
        antAngles: gl.getUniformLocation(p, 'u_ant_angles'),
        tex: gl.getUniformLocation(p, 'u_tv_texture'),
        wallPat: gl.getUniformLocation(p, 'u_wall_pattern'),
        wallDen: gl.getUniformLocation(p, 'u_wall_density'),
        cBg: gl.getUniformLocation(p, 'u_col_bg'),
        cSurf: gl.getUniformLocation(p, 'u_col_surface'),
        cSec: gl.getUniformLocation(p, 'u_col_secondary'),
        cPrim: gl.getUniformLocation(p, 'u_col_primary')
      }
    };
  }

  const quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

  // загрузка сцены, фона, декораций и каналов
  const [
    mainFs, mugFs, plantFs, catFs, vcrFs, tapesFs, windowFs, posterFs,
    noiseFs, landFs, sphereFs, dvdFs, pongFs, pacmanFs
  ] = await Promise.all([
    loadShaderText('shaders/main.frag'),
    loadShaderText('shaders/mug.frag'),
    loadShaderText('shaders/plant.frag'),
    loadShaderText('shaders/cat.frag'),
    loadShaderText('shaders/vcr.frag'),
    loadShaderText('shaders/tapes.frag'),
    loadShaderText('shaders/window.frag'),
    loadShaderText('shaders/poster.frag'),
    loadShaderText('channels/noise.frag'),
    loadShaderText('channels/landscape.frag'),
    loadShaderText('channels/sphere.frag'),
    loadShaderText('channels/dvd.frag'),
    loadShaderText('channels/pong.frag'),
    loadShaderText('channels/pacman.frag')
  ]);

  // сборка всех модулей в единый шейдер комнаты
  const assembledMainFs = mainFs.replace(
    '// [PROPS_HOOK]', 
    `${windowFs}\n${posterFs}\n${vcrFs}\n${tapesFs}\n${mugFs}\n${plantFs}\n${catFs}`
  );

  const roomProg = createProgram(assembledMainFs);
  const noiseProg = createProgram(noiseFs);
  const channels = [
    createProgram(landFs),
    createProgram(sphereFs),
    createProgram(dvdFs),
    createProgram(pongFs),
    createProgram(pacmanFs)
  ];

  const FBO_W = 256, FBO_H = 192;
  const fboTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, fboTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, FBO_W, FBO_H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  let colors = {
    bg: [0.08, 0.07, 0.1],
    surf: [0.15, 0.14, 0.18],
    sec: [0.55, 0.52, 0.62],
    prim: [0.82, 0.74, 1.0]
  };

  function applyColors(locs) {
    if (locs.cBg) gl.uniform3fv(locs.cBg, colors.bg);
    if (locs.cSurf) gl.uniform3fv(locs.cSurf, colors.surf);
    if (locs.cSec) gl.uniform3fv(locs.cSec, colors.sec);
    if (locs.cPrim) gl.uniform3fv(locs.cPrim, colors.prim);
  }

  let activeChannel = 0;
  let noiseTimer = 0.0;
  let knobAngle = 0.0;
  let targetKnobAngle = 0.0;

  function switchChannel() {
    activeChannel = (activeChannel + 1) % channels.length;
    noiseTimer = 0.18;
    targetKnobAngle += Math.PI / 3.0;
    if (navigator.vibrate) navigator.vibrate(25);
  }

  const ROD_LEN = 0.24;
  const antBaseL = { x: -0.015, y: 0.24 };
  const antBaseR = { x: 0.015, y: 0.24 };

  let antAngleL = 2.20;
  let targetAntAngleL = 2.20;
  let antAngleR = 0.94;
  let targetAntAngleR = 0.94;

  const MIN_ANGLE_L = 1.65, MAX_ANGLE_L = 2.82;
  const MIN_ANGLE_R = 0.31, MAX_ANGLE_R = 1.48;

  let interference = 0.0;
  let prevInterference = 0.0;

  const activePointers = new Map();

  function distToSegment(px, py, ax, ay, bx, by) {
    const pax = px - ax, pay = py - ay;
    const bax = bx - ax, bay = by - ay;
    const h = Math.max(0, Math.min(1, (pax * bax + pay * bay) / (bax * bax + bay * bay)));
    return Math.hypot(pax - bax * h, pay - bay * h);
  }

  window.addEventListener('pointerdown', (e) => {
    const uvX = (e.clientX - window.innerWidth * 0.5) / window.innerWidth;
    const uvY = (window.innerHeight * 0.5 - e.clientY) / window.innerWidth;

    const tvP_X = uvX;
    const tvP_Y = uvY - (-0.04);

    // тумблер каналов
    const dKnob = Math.hypot(tvP_X - 0.29, tvP_Y - 0.08);
    if (dKnob <= 0.055) {
      activePointers.set(e.pointerId, 'knob');
      switchChannel();
      return;
    }

    // кот
    if (window.CatManager && window.CatManager.checkHit(uvX, uvY)) {
      return;
    }

    // VCR
    if (window.VCRManager && window.VCRManager.checkHit(uvX, uvY)) {
      return;
    }

    // кассеты
    if (window.TapesManager && window.TapesManager.checkHit(uvX, uvY)) {
      return;
    }

    // антенны
    const tipLx = antBaseL.x + Math.cos(targetAntAngleL) * ROD_LEN;
    const tipLy = antBaseL.y + Math.sin(targetAntAngleL) * ROD_LEN;
    const tipRx = antBaseR.x + Math.cos(targetAntAngleR) * ROD_LEN;
    const tipRy = antBaseR.y + Math.sin(targetAntAngleR) * ROD_LEN;

    const dTipL = Math.hypot(tvP_X - tipLx, tvP_Y - tipLy);
    const dRodL = distToSegment(tvP_X, tvP_Y, antBaseL.x, antBaseL.y, tipLx, tipLy);

    const dTipR = Math.hypot(tvP_X - tipRx, tvP_Y - tipRy);
    const dRodR = distToSegment(tvP_X, tvP_Y, antBaseR.x, antBaseR.y, tipRx, tipRy);

    const HIT_RADIUS = 0.065;

    if (dTipL < HIT_RADIUS || dRodL < 0.04) {
      activePointers.set(e.pointerId, 'ant_l');
      if (navigator.vibrate) navigator.vibrate(10);
    } else if (dTipR < HIT_RADIUS || dRodR < 0.04) {
      activePointers.set(e.pointerId, 'ant_r');
      if (navigator.vibrate) navigator.vibrate(10);
    }
  });

  window.addEventListener('pointermove', (e) => {
    const mode = activePointers.get(e.pointerId);
    if (!mode) return;

    const uvX = (e.clientX - window.innerWidth * 0.5) / window.innerWidth;
    const uvY = (window.innerHeight * 0.5 - e.clientY) / window.innerWidth;
    const tvP_X = uvX;
    const tvP_Y = uvY - (-0.04);

    if (mode === 'ant_l') {
      const angle = Math.atan2(tvP_Y - antBaseL.y, tvP_X - antBaseL.x);
      targetAntAngleL = Math.max(MIN_ANGLE_L, Math.min(MAX_ANGLE_L, angle));
    } else if (mode === 'ant_r') {
      const angle = Math.atan2(tvP_Y - antBaseR.y, tvP_X - antBaseR.x);
      targetAntAngleR = Math.max(MIN_ANGLE_R, Math.min(MAX_ANGLE_R, angle));
    }
  });

  function releasePointer(e) {
    activePointers.delete(e.pointerId);
  }
  window.addEventListener('pointerup', releasePointer);
  window.addEventListener('pointercancel', releasePointer);

  const PIXEL_SCALE = 3.5;
  function resize() {
    const w = Math.max(1, Math.floor(window.innerWidth / PIXEL_SCALE));
    const h = Math.max(1, Math.floor(window.innerHeight / PIXEL_SCALE));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }
  window.addEventListener('resize', resize);
  resize();

  let isPaused = false;
  let lastTime = performance.now();
  let simTime = 0;

  function render(now) {
    if (isPaused) return;

    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    simTime += dt;

    const isNoiseActive = noiseTimer > 0.0;
    if (isNoiseActive) noiseTimer -= dt;

    if (window.CatManager) window.CatManager.update(dt);
    if (window.VCRManager) window.VCRManager.update(dt);
    if (window.TapesManager) window.TapesManager.update(dt);

    knobAngle += (targetKnobAngle - knobAngle) * 0.25;
    antAngleL += (targetAntAngleL - antAngleL) * 0.22;
    antAngleR += (targetAntAngleR - antAngleR) * 0.22;

    const devL_wide = Math.max(0.0, (antAngleL - 2.40) / (MAX_ANGLE_L - 2.40));
    const devL_fold = Math.max(0.0, (1.95 - antAngleL) / (1.95 - MIN_ANGLE_L));
    const devL = Math.max(devL_wide, devL_fold);

    const devR_wide = Math.max(0.0, (0.70 - antAngleR) / (0.70 - MIN_ANGLE_R));
    const devR_fold = Math.max(0.0, (antAngleR - 1.15) / (MAX_ANGLE_R - 1.15));
    const devR = Math.max(devR_wide, devR_fold);

    const targetInterference = Math.min(1.0, Math.pow(Math.max(devL, devR), 1.4) * 1.15);
    interference += (targetInterference - interference) * 0.18;

    if (interference > 0.55 && prevInterference <= 0.55) {
      if (navigator.vibrate) navigator.vibrate(8);
    }
    prevInterference = interference;

    // пасс 1: FBO канала
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, FBO_W, FBO_H);

    const activeProg = isNoiseActive ? noiseProg : channels[activeChannel];
    gl.useProgram(activeProg.prog);
    gl.uniform2f(activeProg.locs.res, FBO_W, FBO_H);
    gl.uniform1f(activeProg.locs.time, simTime);
    applyColors(activeProg.locs);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // пасс 2: Главный экран
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.useProgram(roomProg.prog);
    gl.uniform2f(roomProg.locs.res, canvas.width, canvas.height);
    gl.uniform1f(roomProg.locs.time, simTime);
    gl.uniform1f(roomProg.locs.knob, knobAngle);
    gl.uniform1f(roomProg.locs.isNoise, isNoiseActive ? 1.0 : 0.0);
    gl.uniform1f(roomProg.locs.interference, interference);
    gl.uniform1f(roomProg.locs.catTwitch, window.CatManager ? window.CatManager.getTwitch() : 0.0);

    const vcrTimeVec = window.VCRManager ? window.VCRManager.getTimeVec() : [12.0, 0.0, 0.0, 1.0];
    gl.uniform4fv(roomProg.locs.vcrTime, vcrTimeVec);

    const tapesWiggleVec = window.TapesManager ? window.TapesManager.getWiggleVec() : [0.0, 0.0];
    gl.uniform2fv(roomProg.locs.tapesWiggle, tapesWiggleVec);

    gl.uniform2f(roomProg.locs.antAngles, antAngleL, antAngleR);

    if (window.WallManager) {
      window.WallManager.applyUniforms(gl, roomProg.locs.wallPat, roomProg.locs.wallDen);
    }
    applyColors(roomProg.locs);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fboTex);
    gl.uniform1i(roomProg.locs.tex, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  window.addEventListener('wallpaperPause', () => { isPaused = true; });
  window.addEventListener('wallpaperResume', () => {
    if (isPaused) {
      isPaused = false;
      lastTime = performance.now();
      requestAnimationFrame(render);
    }
  });

  function hexToRgb(hex, fallback) {
    if (!hex || typeof hex !== 'string') return fallback;
    const c = hex.replace('#', '');
    if (c.length !== 6) return fallback;
    const n = parseInt(c, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function updateMonet(meta) {
    if (!meta || !meta.accentColors) return;
    const c = meta.accentColors;
    colors.bg = hexToRgb(c.background, colors.bg);
    colors.surf = hexToRgb(c.surfaceContainer, colors.surf);
    colors.sec = hexToRgb(c.secondary, colors.sec);
    colors.prim = hexToRgb(c.primary, colors.prim);
  }

  window.addEventListener('wallpaperEngineReady', (e) => updateMonet(e.detail));
  window.addEventListener('wallpaperUpdate', (e) => updateMonet(e.detail));
})();
