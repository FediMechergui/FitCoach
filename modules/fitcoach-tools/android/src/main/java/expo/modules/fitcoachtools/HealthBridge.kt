package expo.modules.fitcoachtools

import android.content.Context
import android.health.connect.AggregateRecordsRequest
import android.health.connect.AggregateRecordsResponse
import android.health.connect.HealthConnectException
import android.health.connect.HealthConnectManager
import android.health.connect.TimeInstantRangeFilter
import android.health.connect.datatypes.StepsRecord
import android.health.connect.datatypes.SleepSessionRecord
import android.health.connect.datatypes.ExerciseSessionRecord
import android.health.connect.datatypes.ExerciseSessionType
import android.health.connect.datatypes.Metadata
import android.health.connect.InsertRecordsResponse
import android.os.OutcomeReceiver
import androidx.annotation.RequiresApi
import expo.modules.kotlin.Promise
import java.time.Instant
import java.util.concurrent.Executor

/** Android 14+ platform API: no bundled Health Connect client or duplicate step source. */
@RequiresApi(34)
object HealthBridge {
  fun summary(context: Context, start: Long, end: Long, promise: Promise) {
    val manager = context.getSystemService(HealthConnectManager::class.java)
    val filter = TimeInstantRangeFilter.Builder().setStartTime(Instant.ofEpochMilli(start)).setEndTime(Instant.ofEpochMilli(end)).build()
    val request = AggregateRecordsRequest.Builder<Long>(filter).addAggregationType(StepsRecord.STEPS_COUNT_TOTAL).addAggregationType(SleepSessionRecord.SLEEP_DURATION_TOTAL).build()
    manager.aggregate(request, Executor { it.run() }, object : OutcomeReceiver<AggregateRecordsResponse<Long>, HealthConnectException> {
      override fun onResult(result: AggregateRecordsResponse<Long>) {
        promise.resolve(mapOf("steps" to result.get(StepsRecord.STEPS_COUNT_TOTAL), "sleepMs" to result.get(SleepSessionRecord.SLEEP_DURATION_TOTAL), "start" to start, "end" to end))
      }
      override fun onError(error: HealthConnectException) { promise.reject("HEALTH_READ", error.message, error) }
    })
  }
  fun exportWorkout(context: Context, clientId: String, start: Long, end: Long, title: String, promise: Promise) {
    val metadata = Metadata.Builder().setClientRecordId(clientId).setClientRecordVersion(System.currentTimeMillis())
      .setRecordingMethod(Metadata.RECORDING_METHOD_MANUAL_ENTRY).build()
    val record = ExerciseSessionRecord.Builder(metadata, Instant.ofEpochMilli(start), Instant.ofEpochMilli(end), ExerciseSessionType.EXERCISE_SESSION_TYPE_OTHER_WORKOUT).setTitle(title).build()
    context.getSystemService(HealthConnectManager::class.java).insertRecords(listOf(record), Executor { it.run() }, object : OutcomeReceiver<InsertRecordsResponse, HealthConnectException> {
      override fun onResult(result: InsertRecordsResponse) { promise.resolve(true) }
      override fun onError(error: HealthConnectException) { promise.reject("HEALTH_EXPORT", error.message, error) }
    })
  }
}
