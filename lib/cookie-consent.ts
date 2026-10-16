export const cookieChoiceKey='itinpro-cookie-choice';
export type CookieChoice={necessary:true;analytics:boolean;date:string};
type StorageReader=Pick<Storage,'getItem'>;
export function readCookieChoice(storage:StorageReader):CookieChoice|null{
  try{
    const raw=storage.getItem(cookieChoiceKey);
    if(!raw)return null;
    const choice=JSON.parse(raw);
    return choice?.necessary===true&&typeof choice.analytics==='boolean'&&typeof choice.date==='string'?choice:null;
  }catch{return null;}
}
export function saveCookieChoice(storage:Pick<Storage,'setItem'>,analytics:boolean){
  try{storage.setItem(cookieChoiceKey,JSON.stringify({necessary:true,analytics,date:new Date().toISOString()}));return true;}
  catch{return false;}
}
export function analyticsAllowed(storage:StorageReader,privatePortal:boolean){
  return !privatePortal&&readCookieChoice(storage)?.analytics===true;
}
