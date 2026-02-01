export const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
export const randInt = (a,b)=>Math.floor(Math.random()*(b-a+1))+a;
export const shuffle = (arr)=>{for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;};
export const cap = (s)=>s[0].toUpperCase()+s.slice(1);

export function escapeHTML(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}