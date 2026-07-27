package expo.modules.stepcounter

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Reads Android's hardware step counter (Sensor.TYPE_STEP_COUNTER) *absolute*
 * value — the number of steps the device has counted since it last booted.
 *
 * Why this module exists: expo-sensors' `Pedometer.watchStepCount` normalises
 * the same sensor to "steps since you subscribed", and `getStepCountAsync` (the
 * only API that can read an absolute range) is iOS-only. So from JavaScript
 * there is no way to ask "how many steps since my session started?" after the
 * app has been killed — the subscription is gone and its origin with it.
 *
 * TYPE_STEP_COUNTER is maintained by the sensor hub in hardware and keeps
 * counting while the CPU sleeps and while our process is dead. By storing the
 * absolute value at session start, we can compute exact session steps later as
 * (now − baseline), regardless of what happened to the app in between.
 *
 * This is a low-power on-change sensor: it delivers its current value shortly
 * after a listener is registered, so we register, take the first reading,
 * unregister, and resolve.
 */
class StepCounterModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React context is unavailable" }

  private val sensorManager: SensorManager?
    get() = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager

  private fun stepSensor(): Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)

  override fun definition() = ModuleDefinition {
    Name("StepCounter")

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
        manager.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_FASTEST)
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
