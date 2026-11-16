package expo.modules.stepcounter

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/** On-change hardware listener. Records only observed deltas; never extrapolates missing hours. */
object StepMonitor : SensorEventListener {
  private var context: Context? = null
  private var registered = false
  fun start(ctx: Context): Boolean {
    context = ctx.applicationContext
    if (registered) return true
    val manager = ctx.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    val sensor = manager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) ?: return false
    // A process restart creates a new observation window. Do not import unobserved steps.
    ctx.getSharedPreferences("fitcoach.steps", Context.MODE_PRIVATE).edit().remove("absolute").apply()
    registered = runCatching { manager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL, 5_000_000) }.getOrDefault(false)
    return registered
  }
  fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
  override fun onSensorChanged(event: SensorEvent) {
    val ctx = context ?: return
    val absolute = event.values[0].toLong()
    val prefs = ctx.getSharedPreferences("fitcoach.steps", Context.MODE_PRIVATE)
    val day = today()
    val sameDay = prefs.getString("day", "") == day
    val last = prefs.getLong("absolute", absolute)
    val motion = ctx.getSharedPreferences("fitcoach.motion", Context.MODE_PRIVATE)
    val recognizedVehicle = motion.getString("kind", "") == "vehicle" && motion.getInt("confidence", 0) >= 75 &&
      System.currentTimeMillis() - motion.getLong("at", 0) < 45_000
    val gpsVehicle = motion.getBoolean("gpsVehicle", false) && System.currentTimeMillis() - motion.getLong("gpsAt", 0) < 60_000
    val vehicle = recognizedVehicle || gpsVehicle
    val delta = if (sameDay && !vehicle && absolute >= last) absolute - last else 0
    val count = (if (sameDay) prefs.getLong("count", 0) else 0) + delta
    prefs.edit().putString("day", day).putLong("count", count).putLong("absolute", absolute)
      .putLong("observedTotal", prefs.getLong("observedTotal", 0) + delta)
      .putLong("updatedAt", System.currentTimeMillis()).apply()
  }
  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
}
