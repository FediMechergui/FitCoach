package expo.modules.stepcounter

import android.content.Context
import android.content.Intent
import android.os.Build
import com.google.android.gms.location.ActivityRecognition
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** Low-power motion observations. Hardware counts cover periods when the sensor
 * was activated; Android force-stop or process loss can leave unmeasured gaps.
 */
class StepCounterModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React context is unavailable" }

  private val sensorManager: SensorManager?
    get() = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager

  private fun stepSensor(): Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)

  override fun definition() = ModuleDefinition {
    Name("StepCounter")

    Function("startMonitoring") { StepMonitor.start(context) }
    Function("dailySteps") {
      val prefs = context.getSharedPreferences("fitcoach.steps", Context.MODE_PRIVATE)
      mapOf("date" to StepMonitor.today(), "steps" to
        (if (prefs.getString("day", "") == StepMonitor.today()) prefs.getLong("count", 0) else 0),
        "updatedAt" to prefs.getLong("updatedAt", 0), "observedTotal" to prefs.getLong("observedTotal", 0))
    }
    Function("setGpsVehicleFilter") { active: Boolean ->
      context.getSharedPreferences("fitcoach.motion", Context.MODE_PRIVATE).edit()
        .putBoolean("gpsVehicle", active).putLong("gpsAt", System.currentTimeMillis()).apply()
    }
    Function("startStepService") {
      val intent = Intent(context, StepTrackingService::class.java)
      if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent) else context.startService(intent)
      true
    }
    Function("stopStepService") { context.stopService(Intent(context, StepTrackingService::class.java)); true }
    Function("readMotion") {
      val prefs = context.getSharedPreferences("fitcoach.motion", Context.MODE_PRIVATE)
      mapOf("kind" to prefs.getString("kind", "unknown"), "confidence" to prefs.getInt("confidence", 0), "at" to prefs.getLong("at", 0))
    }
    AsyncFunction("startMotionRecognition") { promise: Promise ->
      runCatching {
        ActivityRecognition.getClient(context).requestActivityUpdates(5_000, MotionReceiver.pending(context))
          .addOnSuccessListener { promise.resolve(true) }.addOnFailureListener { promise.resolve(false) }
      }.onFailure { promise.resolve(false) }
    }
    AsyncFunction("stopMotionRecognition") { promise: Promise ->
      runCatching {
        ActivityRecognition.getClient(context).removeActivityUpdates(MotionReceiver.pending(context))
          .addOnSuccessListener { promise.resolve(true) }.addOnFailureListener { promise.resolve(false) }
      }.onFailure { promise.resolve(false) }
    }

    /** Whether this device actually has a hardware step counter. */
    Function("isAvailable") {
      stepSensor() != null
    }

    /**
     * Absolute steps since device boot, or null when unavailable / no reading
     * arrives in time. Never throws — callers treat null as "no hardware truth".
     */
    AsyncFunction("getStepsSinceBoot") { promise: Promise ->
      val manager = sensorManager
      val sensor = stepSensor()
      if (manager == null || sensor == null) {
        promise.resolve(null)
        return@AsyncFunction
      }

      val handler = Handler(Looper.getMainLooper())
      // `settled` guards against the listener and the timeout both firing.
      var settled = false
      var listener: SensorEventListener? = null

      val finish = { value: Double? ->
        if (!settled) {
          settled = true
          listener?.let { runCatching { manager.unregisterListener(it) } }
          promise.resolve(value)
        }
      }

      listener = object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent?) {
          val steps = event?.values?.firstOrNull()
          if (steps != null && !steps.isNaN()) {
            handler.post { finish(steps.toDouble()) }
          }
        }

        override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
      }

      val registered = runCatching {
        manager.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_NORMAL)
      }.getOrDefault(false)

      if (!registered) {
        finish(null)
        return@AsyncFunction
      }

      // On-change sensors report promptly, but never hang the JS caller.
      handler.postDelayed({ finish(null) }, READ_TIMEOUT_MS)
    }
  }

  private companion object {
    const val READ_TIMEOUT_MS = 2500L
  }
}
