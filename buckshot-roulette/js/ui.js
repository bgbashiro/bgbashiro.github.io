import { MAX_HP } from './state.js';
import { escapeHTML } from './utils.js';
import { shellsLeft } from './game.js';

export function bindUI(){
  const el = {
    phase: document.getElementById('phase'),
    shellsLeft: document.getElementById('shellsLeft'),
    knownNext: document.getElementById('knownNext'),
    turn: document.getElementById('turn'),

    php: document.getElementById('php'),
    dhp: document.getElementById('dhp'),
    phpBar: document.getElementById('phpBar'),
    dhpBar: document.getElementById('dhpBar'),

    liveCount: document.getElementById('liveCount'),
    blankCount: document.getElementById('blankCount'),
    totalCount: document.getElementById('totalCount'),

    shootDealer: document.getElementById('shootDealer'),
    shootSelf: document.getElementById('shootSelf'),
    useMagnify: document.getElementById('useMagnify'),
    useBeer: document.getElementById('useBeer'),
    useCigs: document.getElementById('useCigs'),
    newRound: document.getElementById('newRound'),
    reset: document.getElementById('reset'),

    log: document.getElementById('log'),

    canvas: document.getElementById('c')
  };

  return el;
}

export function makeLogger(el){
  return function logEvt(msg, kind=''){
    const t = new Date();
    const ts = t.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    const div = document.createElement('div');
    div.className = `e ${kind}`;
    div.innerHTML = `<div class="t">${ts}</div><div>${escapeHTML(msg)}</div>`;
    el.log.prepend(div);
  };
}

export function syncUI(state, el){
  el.phase.textContent = state.phase.toUpperCase();
  el.shellsLeft.textContent = shellsLeft(state);
  el.knownNext.textContent = state.knownNext ? state.knownNext.toUpperCase() : '?';
  el.turn.textContent = state.turn.toUpperCase();

  el.php.textContent = state.playerHP;
  el.dhp.textContent = state.dealerHP;
  el.phpBar.style.width = `${(state.playerHP/MAX_HP)*100}%`;
  el.dhpBar.style.width = `${(state.dealerHP/MAX_HP)*100}%`;

  const remaining = state.rack.slice(state.rackIndex);
  const live = remaining.filter(s=>s==='live').length;
  const blank = remaining.length - live;
  el.liveCount.textContent = live;
  el.blankCount.textContent = blank;
  el.totalCount.textContent = remaining.length;

  const playerCanAct = state.phase === 'player';

  el.shootDealer.disabled = !playerCanAct;
  el.shootSelf.disabled = !playerCanAct;

  el.useMagnify.disabled = !playerCanAct || state.items.magnify<=0 || shellsLeft(state)<=0;
  el.useBeer.disabled = !playerCanAct || state.items.beer<=0 || shellsLeft(state)<=0;
  el.useCigs.disabled = !playerCanAct || state.items.cigs<=0;

  el.useMagnify.textContent = `🔍 (${state.items.magnify})`;
  el.useBeer.textContent = `🍺 (${state.items.beer})`;
  el.useCigs.textContent = `🚬 (${state.items.cigs})`;

  el.newRound.disabled = !(state.phase==='idle' || state.phase==='over');
}