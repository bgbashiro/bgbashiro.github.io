export const MAX_HP = 3;

export function freshGame(){
  return {
    round: 0,
    playerHP: MAX_HP,
    dealerHP: MAX_HP,
    turn: 'player', // 'player' | 'dealer'
    phase: 'idle',  // 'idle' | 'player' | 'dealer' | 'anim' | 'over'

    rack: [],         // array of 'live'|'blank'
    rackIndex: 0,     // next shell pointer

    knownNext: null,  // null | 'live'|'blank'

    items: {
      magnify: 1,
      beer: 1,
      cigs: 1,
    },

    anim: {
      t: 0,
      kind: null,
      shooter: null,
      target: null,
      shell: null,
      flash: 0,
    }
  };
}