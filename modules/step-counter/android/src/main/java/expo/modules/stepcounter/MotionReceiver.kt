package expo.modules.stepcounter

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import com.google.android.gms.location.ActivityRecognitionResult
import com.google.android.gms.location.DetectedActivity

class MotionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val result = ActivityRecognitionResult.extractResult(intent) ?: return
    val activity = result.mostProbableActivity
    val kind = when (activity.type) {
      DetectedActivity.IN_VEHICLE -> "vehicle"
      DetectedActivity.WALKING -> "walking"
      DetectedActivity.RUNNING -> "running"
      DetectedActivity.ON_FOOT -> "on_foot"
      DetectedActivity.ON_BICYCLE -> "cycling"
      DetectedActivity.STILL -> "stationary"
      else -> "unknown"
    }
    context.getSharedPreferences("fitcoach.motion", Context.MODE_PRIVATE).edit()
      .putString("kind", kind).putInt("confidence", activity.confidence)
      .putLong("at", result.time).apply()
  }
  companion object {
    fun pending(context: Context): PendingIntent {
      val flags = PendingIntent.FLAG_UPDATE_CURRENT or
        (if (Build.VERSION.SDK_INT >= 31) PendingIntent.FLAG_MUTABLE else 0)
      return PendingIntent.getBroadcast(context, 4105, Intent(context, MotionReceiver::class.java), flags)
    }
  }
}
