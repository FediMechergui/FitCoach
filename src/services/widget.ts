import { nativeTools } from '../../modules/fitcoach-tools';
import { getDailySteps } from '@/repositories/activityRepo';
import { kvGet, kvSetStrict } from '@/repositories/kvRepo';
import { weeklyReview } from '@/repositories/calendarRepo';
export function widgetEnabled():boolean { return kvGet('widget.enabled')===true; }
export function updateHomeWidget():void {
  if(!widgetEnabled())return;
  try {nativeTools().updateWidget(`${getDailySteps()?.stepCount??0} steps today · ${weeklyReview().workouts.length} workouts / 7 days`,`Updated ${new Date().toLocaleString()}`);}catch{/* Widget is optional; an unavailable launcher never blocks the app. */}
}
export function setWidgetEnabled(enabled:boolean):void {
  kvSetStrict('widget.enabled',enabled);
  if(enabled)updateHomeWidget();else nativeTools().updateWidget('Open FitCoach to train','Statistics hidden');
}
