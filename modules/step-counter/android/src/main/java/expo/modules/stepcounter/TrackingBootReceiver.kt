package expo.modules.stepcounter

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Restarts only an explicitly enabled setting, never an unfinished manual workout. */
class TrackingBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Intent.ACTION_BOOT_COMPLETED && intent.action != Intent.ACTION_MY_PACKAGE_REPLACED) return
    context.getSharedPreferences("fitcoach.tracking", Context.MODE_PRIVATE).edit().putBoolean("sessionMotion", false).apply()
    if (StepTrackingService.enabled(context) && StepTrackingService.motionPermission(context)) {
      runCatching { StepTrackingService.launch(context) }.onFailure {
        context.getSharedPreferences("fitcoach.tracking", Context.MODE_PRIVATE).edit().putString("error", "Open FitCoach to resume walk detection after restarting.").apply()
      }
    }
  }
}
