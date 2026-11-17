import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { strToU8, zipSync } from 'fflate';
import { fromByteArray } from 'base64-js';
import { captureSnapshot } from '@/repositories/backupRepo';
import { parseRoute, routeForDrawing, type LatLng } from '@/lib/geo';
import { getWalkSession } from '@/repositories/activityRepo';
export function csvCell(value: unknown): string {
  let text=value==null?'':String(value);
  // Prevent spreadsheet formula execution from user-entered names/notes.
  if(typeof value==='string' && /^[\s]*[=+@-]/.test(text))text="'"+text;
  return `"${text.replace(/"/g,'""')}"`;
}
export function csvRows(rows:Array<Record<string,unknown>>): string {
  const columns=[...new Set(rows.flatMap(Object.keys))];
  return [columns.map(csvCell).join(','),...rows.map(r=>columns.map(c=>csvCell(r[c])).join(','))].join('\r\n');
}
const xml=(text:string)=>text.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
export function routeGpx(name:string,route:LatLng[]): string {
  const segments:LatLng[][]=[];
  for(const point of routeForDrawing(route)){
    if(!segments.length||point[2])segments.push([]);
    segments[segments.length-1].push(point);
  }
  return `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="FitCoach" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${xml(name)}</name>${segments.map(segment=>`<trkseg>${segment.map(p=>`<trkpt lat="${p[0]}" lon="${p[1]}"/>`).join('')}</trkseg>`).join('')}</trk></gpx>`;
}
export async function exportLogsCsv(): Promise<void> {
  const snapshot=captureSnapshot();
  const files:Record<string,Uint8Array>={};
  for(const [name,rows] of Object.entries(snapshot.tables))if(rows.length)files[`${name}.csv`]=strToU8(csvRows(rows));
  files['ABOUT.txt']=strToU8('FitCoach personal data export. Timestamps are Unix milliseconds; duration_s is seconds; weights are kg. Includes sensitive health/activity logs. Does not include passwords, API keys, authentication tokens or photo files. Calculated calories and 1RM are estimates. workout_timing is wall-clock timing, not muscle tension.');
  const uri=`${FileSystem.cacheDirectory}FitCoach-logs.zip`;
  await FileSystem.writeAsStringAsync(uri,fromByteArray(zipSync(files)),{encoding:FileSystem.EncodingType.Base64});
  if(!await Sharing.isAvailableAsync())throw new Error('Sharing is unavailable on this device.');
  await Sharing.shareAsync(uri,{mimeType:'application/zip',dialogTitle:'Export private FitCoach logs'});
}
export async function exportWalkGpx(walkId:number): Promise<void> {
  const walk=getWalkSession(walkId);if(!walk)throw new Error('Walk not found.');
  const route=parseRoute(walk.routeJson);if(routeForDrawing(route).length<2)throw new Error('No recorded GPS route to export.');
  const uri=`${FileSystem.cacheDirectory}FitCoach-route-${walkId}.gpx`;
  await FileSystem.writeAsStringAsync(uri,routeGpx(`FitCoach ${walk.activity??walk.mode}`,route));
  await Sharing.shareAsync(uri,{mimeType:'application/gpx+xml',dialogTitle:'Export private GPS route'});
}
