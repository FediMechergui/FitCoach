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

/** Keeps the low-power counter registered during an explicit step-only walk/run. */
class StepTrackingService : Service() {
  override fun onCreate() {
    super.onCreate()
    val manager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(NotificationChannel("fitcoach.steps", "Activity tracking", NotificationManager.IMPORTANCE_LOW))
    val launch = packageManager.getLaunchIntentForPackage(packageName)
    val content = launch?.let { PendingIntent.getActivity(this, 4106, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE) }
    val builder = if (Build.VERSION.SDK_INT >= 26) Notification.Builder(this, "fitcoach.steps") else Notification.Builder(this)
    val notification = builder
      .setSmallIcon(android.R.drawable.ic_menu_mylocation).setContentTitle("FitCoach activity in progress")
      .setContentText("Counting steps. Open FitCoach to finish.").setContentIntent(content).setOngoing(true).build()
    if (Build.VERSION.SDK_INT >= 34) startForeground(4106, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH)
    else startForeground(4106, notification)
    StepMonitor.start(this)
  }
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = START_NOT_STICKY
  override fun onBind(intent: Intent?): IBinder? = null
}
