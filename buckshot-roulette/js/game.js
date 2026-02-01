import { clamp, randInt, shuffle } from './utils.js';
import { MAX_HP } from './state.js';

export function shellsLeft(state){
  return state.rack.length - state.rackIndex;
}

export function peekNextShell(state){
  if(shellsLeft(state)<=0) return null;
  return state.rack[state.rackIndex];
}

export function drawShell(state){
  const s = peekNextShell(state);
  if(!s) return null;
  state.rackIndex++;
  state.knownNext = null;
  return s;
}

export function injectBlankIntoRemaining(state){
  const remaining = state.rack.slice(state.rackIndex);
  remaining.push('blank');
  shuffle(remaining);
  state.rack = state.rack.slice(0, state.rackIndex).concat(remaining);
}

export function startNewRound(state, logEvt, syncUI, dealerTurn){
  if(state.phase === 'anim') return;
  if(state.playerHP<=0 || state.dealerHP<=0){
    logEvt('Game is over. Reset to play again.', 'warn');
    return;
  }

  state.round++;
  state.turn = (state.round % 2 === 1) ? 'player' : 'dealer';
  state.phase = state.turn;
  state.knownNext = null;

  const total = randInt(4, 8);
  const live = randInt(1, total-1);
  const blank = total - live;

  state.rack = [];
  for(let i=0;i<live;i++) state.rack.push('live');
  for(let i=0;i<blank;i++) state.rack.push('blank');
  shuffle(state.rack);
  state.rackIndex = 0;

  logEvt(`— Round ${state.round} — Rack loaded (${live} live, ${blank} blank).`, 'warn');

  syncUI();
  if(state.turn==='dealer') setTimeout(dealerTurn, 700);
}

export function shoot(state, shooter, target, logEvt, syncUI, dealerTurn){
  if(state.phase === 'anim' || state.phase==='over') return;
  if(shellsLeft(state)<=0){
    logEvt('Rack empty. Start a new round.', 'warn');
    state.phase = 'idle';
    syncUI();
    return;
  }

  const shell = drawShell(state);

  state.phase = 'anim';
  state.anim = {
    t: 0,
    kind: 'shot',
    shooter,
    target,
    shell,
    flash: 1,
  };

  setTimeout(()=>{
    if(shell === 'live'){
      if(target === 'player') state.playerHP = clamp(state.playerHP-1, 0, MAX_HP);
      if(target === 'dealer') state.dealerHP = clamp(state.dealerHP-1, 0, MAX_HP);
      logEvt(`${shooter[0].toUpperCase()+shooter.slice(1)} fired a LIVE round at ${target[0].toUpperCase()+target.slice(1)}. (-1 HP)`, 'bad');
    } else {
      logEvt(`${shooter[0].toUpperCase()+shooter.slice(1)} fired a BLANK at ${target[0].toUpperCase()+target.slice(1)}.`, 'good');
    }

    if(state.playerHP<=0 || state.dealerHP<=0){
      state.phase = 'over';
      if(state.playerHP<=0 && state.dealerHP<=0) logEvt('Both collapsed. Draw???', 'warn');
      else if(state.playerHP<=0) logEvt('You lost. Dealer wins.', 'bad');
      else logEvt('Dealer lost. You win!', 'good');
      syncUI();
      return;
    }

    if(shellsLeft(state)<=0){
      logEvt('Rack empty. Press New Round.', 'warn');
      state.phase = 'idle';
      syncUI();
      return;
    }

    state.turn = (state.turn === 'player') ? 'dealer' : 'player';
    state.phase = state.turn;

    syncUI();

    if(state.turn === 'dealer'){
      setTimeout(dealerTurn, 700);
    }
  }, 520);
}