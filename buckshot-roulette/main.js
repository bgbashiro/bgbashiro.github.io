import { freshGame } from './js/state.js';
import { bindUI, makeLogger, syncUI } from './js/ui.js';
import { createRenderer } from './js/canvas.js';
import { startNewRound, shoot, peekNextShell, injectBlankIntoRemaining } from './js/game.js';
import { clamp } from './js/utils.js';

let state = freshGame();
const el = bindUI();
const logEvt = makeLogger(el);
const renderer = createRenderer(el.canvas);

function dealerTurn(){
  if(state.phase !== 'dealer') return;

  if(state.knownNext === 'live'){
    shoot(state,'dealer','player',logEvt, ()=>syncUI(state,el), dealerTurn);
    return;
  }
  if(state.knownNext === 'blank'){
    shoot(state,'dealer','dealer',logEvt, ()=>syncUI(state,el), dealerTurn);
    return;
  }

  const remaining = state.rack.slice(state.rackIndex);
  const live = remaining.filter(s=>s==='live').length;
  const pLive = remaining.length ? (live/remaining.length) : 0;

  let bias = 0.5;
  if(state.dealerHP > state.playerHP) bias += 0.15;
  if(state.dealerHP < state.playerHP) bias -= 0.10;
  if(state.dealerHP === 1) bias += 0.20;

  bias += (pLive - 0.5) * 0.35;
  bias = clamp(bias, 0.15, 0.85);

  const shootPlayer = Math.random() < bias;
  shoot(state,'dealer', shootPlayer ? 'player' : 'dealer', logEvt, ()=>syncUI(state,el), dealerTurn);
}

function useMagnify(){
  if(state.phase !== 'player') return;
  if(state.items.magnify<=0) return;
  if((state.rack.length - state.rackIndex)<=0) return;

  state.items.magnify--;
  state.knownNext = peekNextShell(state);
  logEvt(`You used Magnify. Next shell is: ${state.knownNext.toUpperCase()}.`, 'warn');
  syncUI(state,el);
}

function useBeer(){
  if(state.phase !== 'player') return;
  if(state.items.beer<=0) return;
  if((state.rack.length - state.rackIndex)<=0) return;

  state.items.beer--;
  injectBlankIntoRemaining(state);
  logEvt('You used Beer. Added +1 BLANK into the remaining rack.', 'good');
  syncUI(state,el);
}

function useCigs(){
  if(state.phase !== 'player') return;
  if(state.items.cigs<=0) return;

  if(state.playerHP >= 3){
    logEvt('Cigarettes had no effect (HP already full).', 'warn');
    return;
  }

  state.items.cigs--;
  state.playerHP = clamp(state.playerHP+1, 0, 3);
  logEvt('You used Cigarettes. +1 HP.', 'good');
  syncUI(state,el);
}

// bind events
el.shootDealer.addEventListener('click', ()=> shoot(state,'player','dealer',logEvt, ()=>syncUI(state,el), dealerTurn));
el.shootSelf.addEventListener('click', ()=> shoot(state,'player','player',logEvt, ()=>syncUI(state,el), dealerTurn));

el.useMagnify.addEventListener('click', useMagnify);
el.useBeer.addEventListener('click', useBeer);
el.useCigs.addEventListener('click', useCigs);

el.newRound.addEventListener('click', ()=> startNewRound(state, logEvt, ()=>syncUI(state,el), dealerTurn));
el.reset.addEventListener('click', ()=>{
  state = freshGame();
  el.log.innerHTML='';
  logEvt('Game reset.', 'warn');
  syncUI(state,el);
});

window.addEventListener('resize', ()=> renderer.resizeCanvasToCSS());

// render loop
let last = performance.now();
function loop(now){
  const dt = Math.min(0.05, (now-last)/1000);
  last = now;
  renderer.drawScene(dt, state);
  requestAnimationFrame(loop);
}

// boot
renderer.resizeCanvasToCSS();
syncUI(state,el);
logEvt('Press New Round to load shells.', 'warn');
requestAnimationFrame(loop);
