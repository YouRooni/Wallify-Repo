(function(){
  if(window.WallifyM3)return;
  function apply(el){
    if(!(el instanceof Element)||el.dataset.wallifyM3Ready)return;
    var type=el.getAttribute('data-wallify-m3');
    if(!type)return;
    el.dataset.wallifyM3Ready='true';
    if(type==='slider'&&el.matches('input[type=range]')){
      var container=document.createElement('div');
      container.className='wallify-m3-slider-container';
      if(el.className)container.className+=' '+el.className;
      if(el.id)container.id=el.id+'-container';
      if(el.style.cssText){
        container.style.cssText=el.style.cssText;
        el.style.cssText='';
      }
      el.parentNode.insertBefore(container,el);
      var trackInactive=document.createElement('div');
      trackInactive.className='wallify-m3-slider-track-inactive';
      var trackActive=document.createElement('div');
      trackActive.className='wallify-m3-slider-track-active';
      var thumb=document.createElement('div');
      thumb.className='wallify-m3-slider-thumb';
      container.appendChild(trackInactive);
      container.appendChild(trackActive);
      container.appendChild(thumb);
      var step=el.getAttribute('step');
      var min=Number(el.min||0),max=Number(el.max||100);
      var ticksContainer=null;
      var numTicks=0;
      if(step&&step!=='any'){
        var stepVal=Number(step);
        numTicks=Math.floor((max-min)/stepVal)+1;
        if(numTicks>1&&numTicks<=30){
          ticksContainer=document.createElement('div');
          ticksContainer.className='wallify-m3-slider-ticks-container';
          for(var i=0;i<numTicks;i++){
            var tick=document.createElement('div');
            tick.className='wallify-m3-slider-tick';
            var tickPct=(i*stepVal*100)/(max-min);
            tick.style.left=tickPct+'%';
            ticksContainer.appendChild(tick);
          }
          container.appendChild(ticksContainer);
        }
      }
      container.appendChild(el);
      function update(){
        var val=Number(el.value||min);
        var pct=(max===min?0:Math.max(0,Math.min(100,(val-min)*100/(max-min))));
        container.style.setProperty('--wallify-m3-progress',pct+'%');
        if(ticksContainer){
          var ticks=ticksContainer.querySelectorAll('.wallify-m3-slider-tick');
          ticks.forEach(function(tick){
            var tickPct=parseFloat(tick.style.left);
            if(tickPct<=pct){
              tick.classList.add('active');
            }else{
              tick.classList.remove('active');
            }
            if(Math.abs(tickPct-pct)<3){
              tick.style.opacity='0';
            }else{
              tick.style.opacity='1';
            }
          });
        }
      }
      el.addEventListener('input',update);
      el.addEventListener('change',update);
      update();
    } else if (el.tagName === 'BUTTON' || type.indexOf('button') !== -1) {
      el.addEventListener('click', function(e) {
        var rect = this.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        if ((e.clientX === 0 && e.clientY === 0) || isNaN(x) || isNaN(y)) {
          x = rect.width / 2;
          y = rect.height / 2;
        }
        var size = Math.max(rect.width, rect.height);
        var ink = document.createElement('span');
        ink.className = 'wallify-m3-ink';
        ink.style.cssText = 'left:' + (x - size / 2) + 'px; top:' + (y - size / 2) + 'px; width:' + size + 'px; height:' + size + 'px;';
        this.appendChild(ink);
        ink.addEventListener('animationend', function() {
          ink.parentNode && ink.parentNode.removeChild(ink);
        }, { once: true });
      });
    }
  }
  function refresh(root){root=root||document;if(root.nodeType===1)apply(root);root.querySelectorAll('[data-wallify-m3]').forEach(apply)}
  function setColors(c){
    if(!c)return;
    var map={
      primary:'primary',onPrimary:'on-primary',primaryContainer:'primary-container',onPrimaryContainer:'on-primary-container',
      secondary:'secondary',onSecondary:'on-secondary',secondaryContainer:'secondary-container',onSecondaryContainer:'on-secondary-container',
      tertiary:'tertiary',onTertiary:'on-tertiary',tertiaryContainer:'tertiary-container',onTertiaryContainer:'on-tertiary-container',
      surface:'surface',onSurface:'on-surface',surfaceVariant:'surface-variant',onSurfaceVariant:'on-surface-variant',
      background:'background',onBackground:'on-background',surfaceContainer:'surface-container',outline:'outline',outlineVariant:'outline-variant'
    };
    Object.keys(map).forEach(function(k){
      if(c[k])document.documentElement.style.setProperty('--wallify-m3-'+map[k],c[k]);
    });
  }
  window.WallifyM3={version:'1.1.0',refresh:function(){refresh(document)},setColors:setColors};
  function start(){
    var m=window.wallpaperMetadata||(window.WallpaperEngine&&window.WallpaperEngine.metadata);
    if(m&&m.accentColors)setColors(m.accentColors);
    refresh(document);
    window.addEventListener('wallpaperEngineReady',function(e){
      if(e.detail&&e.detail.accentColors)setColors(e.detail.accentColors);
    });
    window.addEventListener('wallpaperUpdate',function(e){
      if(e.detail&&e.detail.accentColors)setColors(e.detail.accentColors);
    });
    new MutationObserver(function(changes){
      changes.forEach(function(c){c.addedNodes.forEach(refresh)});
    }).observe(document.documentElement,{childList:true,subtree:true});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
