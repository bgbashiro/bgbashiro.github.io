import { MAX_HP } from './state.js';

export function createRenderer(canvas){
  const ctx = canvas.getContext('2d');

  function resizeCanvasToCSS(){
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function roundRect(ctx,x,y,w,h,r){
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    ctx.closePath();
  }

  function heart(x,y,s){
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x, y-3*s, x-4*s, y-3*s, x-4*s, y);
    ctx.bezierCurveTo(x-4*s, y+3*s, x, y+4*s, x, y+6*s);
    ctx.bezierCurveTo(x, y+4*s, x+4*s, y+3*s, x+4*s, y);
    ctx.bezierCurveTo(x+4*s, y-3*s, x, y-3*s, x, y);
    ctx.fill();
  }

  function drawHearts(x,y,hp,isPlayer){
    ctx.save();
    ctx.translate(x,y);
    for(let i=0;i<MAX_HP;i++){
      const on = i < hp;
      ctx.fillStyle = on ? (isPlayer ? 'rgba(56,217,150,0.9)' : 'rgba(255,77,77,0.9)') : 'rgba(255,255,255,0.12)';
      const px = (i-(MAX_HP-1)/2)*50;
      heart(px, 0, 6);
    }
    ctx.restore();
  }

  function drawPerson(x,y, who, state){
    ctx.save();
    ctx.translate(x,y);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(0,-48, 26, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-48, 10);
    ctx.quadraticCurveTo(0,-10, 48, 10);
    ctx.lineTo(38, 110);
    ctx.quadraticCurveTo(0, 130, -38, 110);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const isTurn = state.phase === who;
    if(isTurn){
      ctx.strokeStyle = 'rgba(255,209,102,0.55)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0,-48, 34, 0, Math.PI*2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawShotgun(x,y,state){
    ctx.save();
    ctx.translate(x,y);

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;

    roundRect(ctx, -180, -26, 360, 52, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, -210, -10, 420, 20, 10);
    ctx.fill();

    const left = -80;
    const top = -12;
    const gap = 8;
    const count = 6;
    for(let i=0;i<count;i++){
      const bx = left + i*(28+gap);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      roundRect(ctx, bx, top, 28, 24, 8);
      ctx.fill();

      if(i===0 && state.knownNext){
        ctx.fillStyle = state.knownNext==='live' ? 'rgba(255,77,77,0.85)' : 'rgba(255,209,102,0.85)';
        ctx.beginPath();
        ctx.arc(bx+14, top+12, 5, 0, Math.PI*2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  function drawRack(x,y,state){
    const remaining = state.rack.slice(state.rackIndex);
    const total = remaining.length;
    const live = remaining.filter(s=>s==='live').length;
    const blank = total - live;

    ctx.save();
    ctx.translate(x,y);
    ctx.textAlign='center';
    ctx.fillStyle='rgba(233,236,241,0.88)';
    ctx.font='800 13px system-ui, -apple-system, Segoe UI, Roboto';
    ctx.fillText(`RACK: ${total} shells (${live} live / ${blank} blank)`, 0, -18);

    const shown = Math.min(total, 10);
    const start = -shown*18;
    for(let i=0;i<shown;i++){
      ctx.fillStyle='rgba(255,255,255,0.08)';
      roundRect(ctx, start + i*36, 0, 30, 12, 999);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawScene(dt, state){
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    ctx.clearRect(0,0,w,h);

    const g = ctx.createRadialGradient(w*0.5,h*0.45, 50, w*0.5,h*0.45, Math.max(w,h)*0.65);
    g.addColorStop(0, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w*1,h*0.9);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, w*0.08, h*0.55, w*0.84, h*0.32, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.stroke();

    drawPerson(w*0.22, h*0.40, 'dealer', state);
    drawPerson(w*0.78, h*0.40, 'player', state);

    drawShotgun(w*0.5, h*0.63, state);
    drawRack(w*0.5, h*0.83, state);

    if(state.phase==='anim' && state.anim.kind==='shot'){
      state.anim.t += dt;
      state.anim.flash = Math.max(0, state.anim.flash - dt*2.5);
      const flash = state.anim.flash;
      if(flash>0){
        ctx.fillStyle = `rgba(255,255,255,${0.25*flash})`;
        ctx.fillRect(0,0,w,h);
      }

      const from = {x:w*0.5, y:h*0.63};
      const to = (state.anim.target==='dealer') ? {x:w*0.22,y:h*0.40} :
                 (state.anim.target==='player') ? {x:w*0.78,y:h*0.40} : {x:w*0.5,y:h*0.5};
      ctx.strokeStyle = state.anim.shell==='live' ? 'rgba(255,77,77,0.85)' : 'rgba(255,209,102,0.65)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      ctx.fillStyle = state.anim.shell==='live' ? 'rgba(255,77,77,0.9)' : 'rgba(255,209,102,0.8)';
      ctx.beginPath();
      ctx.arc(to.x,to.y, 8 + 10*flash, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(233,236,241,0.92)';
    ctx.font = '700 14px system-ui, -apple-system, Segoe UI, Roboto';
    ctx.textAlign = 'center';
    
    ctx.fillText('YOU', w*0.78, h*0.16);
    drawHearts(w*0.78, h*0.20, state.playerHP, true);

    ctx.fillText('DEALER', w*0.22, h*0.16);
    drawHearts(w*0.22, h*0.20, state.dealerHP, false);
    
  }

  return {
    resizeCanvasToCSS,
    drawScene,
  };
}