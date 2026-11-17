import { kvGet, kvSetStrict } from './kvRepo';
export const HOME_SECTIONS=[
  {id:'consistency',label:'Consistency'}, {id:'challenges',label:'Challenges'}, {id:'path',label:'Training path'},
  {id:'readiness',label:'Readiness context'}, {id:'nutrition',label:'Nutrition and energy'}, {id:'selfcare',label:'Self-care'},
  {id:'prayers',label:'Prayers'}, {id:'coach',label:'Coach tips'}, {id:'health',label:'Sleep and health'}, {id:'smoking',label:'Smoking'},
] as const;
export type HomeSectionId=(typeof HOME_SECTIONS)[number]['id'];
export interface HomeLayout {order:HomeSectionId[];hidden:HomeSectionId[];pinned:HomeSectionId[]}
export function homeLayout():HomeLayout {
  const saved=kvGet<Partial<HomeLayout>>('home.sections');
  const ids=HOME_SECTIONS.map(s=>s.id);
  const valid=(values:unknown):HomeSectionId[]=>Array.isArray(values)?[...new Set(values.filter((id):id is HomeSectionId=>ids.includes(id)))]:[];
  const order=valid(saved?.order);
  return {order:[...order,...ids.filter(id=>!order.includes(id))],hidden:valid(saved?.hidden),pinned:valid(saved?.pinned)};
}
export function saveHomeLayout(layout:HomeLayout) {kvSetStrict('home.sections',layout);}
