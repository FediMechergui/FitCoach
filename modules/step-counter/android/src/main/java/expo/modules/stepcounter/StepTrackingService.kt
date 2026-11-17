package expo.modules.stepcounter

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import com.google.android.gms.location.ActivityRecognition

/** User-controlled, low-power observation. Does not start GPS or infer missing steps. */
class StepTrackingService : Service() {
  private val settings get() = getSharedPreferences("fitcoach.tracking", Context.MODE_PRIVATE)
  private var manual = false
  override fun onCreate() {
    super.onCreate()
    val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(NotificationChannel("fitcoach.steps", "Activity tracking", NotificationManager.IMPORTANCE_LOW))
  }
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_MANUAL -> manual = true
      ACTION_END_MANUAL -> manual = false
      ACTION_DISABLE -> settings.edit().putBoolean("alwaysOn", false).apply()
    }
    val always = enabled(this)
    if ((!always && !manual) || !motionPermission(this)) { stopSelf(); return START_NOT_STICKY }
    try {
      val notification = notification(always)
      if (Build.VERSION.SDK_INT >= 34) startForeground(4106, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH)
      else startForeground(4106, notification)
      if (!StepMonitor.start(this)) throw IllegalStateException("No working hardware step counter is available.")
      running = true
      settings.edit().remove("error").apply()
      ActivityRecognition.getClient(this).requestActivityUpdates(if (manual) 5_000 else 30_000, MotionReceiver.pending(this))
        .addOnSuccessListener { settings.edit().putBoolean("motionAvailable", true).apply() }
        .addOnFailureListener { settings.edit().putBoolean("motionAvailable", false).apply() }
    } catch (e: Exception) {
      settings.edit().putString("error", e.message ?: "Android stopped activity detection.").apply()
      stopSelf()
      return START_NOT_STICKY
    }
    return if (always) START_STICKY else START_NOT_STICKY
  }
  private fun notification(always: Boolean): Notification {
    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val content = launch?.let { PendingIntent.getActivity(this, 4106, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE) }
    val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, "fitcoach.steps") else Notification.Builder(this)
    builder
      .setSmallIcon(android.R.drawable.ic_menu_mylocation).setContentTitle("FitCoach activity in progress")
      .setContentTitle(if (always) "FitCoach walk detection is on" else "FitCoach activity in progress")
      .setContentText(if (always) "Counting daily steps without GPS. Tap to open." else "Counting steps. Open FitCoach to finish.")
      .setContentIntent(content).setOngoing(true).setOnlyAlertOnce(true)
    if (always) {
      val stop = PendingIntent.getService(this, 4107, Intent(this, StepTrackingService::class.java).setAction(ACTION_DISABLE), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      builder.addAction(android.R.drawable.ic_media_pause, "Turn off always-on", stop)
    }
    return builder.build()
  }
  override fun onDestroy() {
    running = false
    if (!settings.getBoolean("sessionMotion", false)) StepMonitor.stop()
    // A GPS walk can still own motion recognition after the step service stops.
    if (!enabled(this) && !settings.getBoolean("sessionMotion", false)) {
      runCatching { ActivityRecognition.getClient(this).removeActivityUpdates(MotionReceiver.pending(this)) }
    }
    super.onDestroy()
  }
  override fun onBind(intent: Intent?): IBinder? = null
  companion object {
    const val ACTION_MANUAL = "fitcoach.steps.MANUAL"
    const val ACTION_END_MANUAL = "fitcoach.steps.END_MANUAL"
    const val ACTION_DISABLE = "fitcoach.steps.DISABLE_ALWAYS"
    @Volatile var running = false
    fun enabled(context: Context) = context.getSharedPreferences("fitcoach.tracking", Context.MODE_PRIVATE).getBoolean("alwaysOn", false)
    fun motionPermission(context: Context) = Build.VERSION.SDK_INT < 29 || context.checkSelfPermission(Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED
    fun launch(context: Context, action: String? = null) {
      val intent = Intent(context, StepTrackingService::class.java).setAction(action)
      if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent) else context.startService(intent)
    }
  }
}
