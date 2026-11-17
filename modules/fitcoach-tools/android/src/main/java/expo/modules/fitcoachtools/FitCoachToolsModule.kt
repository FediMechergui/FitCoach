package expo.modules.fitcoachtools

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.os.Build
import expo.modules.interfaces.permissions.PermissionsResponseListener
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.speech.RecognizerIntent
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.util.concurrent.Executors

class FitCoachToolsModule : Module() {
  private val context get() = requireNotNull(appContext.reactContext)
  private var pending: Promise? = null
  private val executor = Executors.newSingleThreadExecutor()
  private val speechRequest = 6291
  private val pdfRequest = 6292
  override fun definition() = ModuleDefinition {
    Name("FitCoachTools")
    Function("healthAvailable") { Build.VERSION.SDK_INT >= 34 }
    AsyncFunction("requestHealthPermissions") { promise: Promise ->
      if (Build.VERSION.SDK_INT < 34) { promise.resolve(false); return@AsyncFunction }
      val permissions = appContext.permissions
      if (permissions == null) { promise.reject("PERMISSIONS", "Permission manager unavailable", null); return@AsyncFunction }
      permissions.askForPermissions(PermissionsResponseListener { promise.resolve(true) },
        "android.permission.health.READ_STEPS", "android.permission.health.READ_SLEEP", "android.permission.health.WRITE_EXERCISE")
    }
    AsyncFunction("healthSummary") { start: Double, end: Double, promise: Promise ->
      if (Build.VERSION.SDK_INT < 34) { promise.reject("HEALTH_VERSION", "Health Connect integration requires Android 14 or later.", null); return@AsyncFunction }
      try { HealthBridge.summary(context, start.toLong(), end.toLong(), promise) }
      catch (e: Exception) { promise.reject("HEALTH_READ", e.message, e) }
    }
    AsyncFunction("exportWorkout") { id: String, start: Double, end: Double, title: String, promise: Promise ->
      if (Build.VERSION.SDK_INT < 34) { promise.reject("HEALTH_VERSION", "Health Connect integration requires Android 14 or later.", null); return@AsyncFunction }
      try { HealthBridge.exportWorkout(context, id, start.toLong(), end.toLong(), title.take(120), promise) }
      catch (e: Exception) { promise.reject("HEALTH_EXPORT", e.message, e) }
    }
    Function("updateWidget") { summary: String, updated: String ->
      context.getSharedPreferences("fitcoach.widget", Context.MODE_PRIVATE).edit().putString("summary", summary.take(160)).putString("updated", updated.take(80)).apply()
      FitCoachWidget.refresh(context)
    }
    Function("pinWidget") {
      if (Build.VERSION.SDK_INT < 26) false else {
        val manager = AppWidgetManager.getInstance(context)
        if (!manager.isRequestPinAppWidgetSupported) false else manager.requestPinAppWidget(ComponentName(context, FitCoachWidget::class.java), null, null)
      }
    }
    Function("isWifi") {
      val manager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
      val caps = manager.getNetworkCapabilities(manager.activeNetwork)
      caps?.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) == true && caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
    }
    AsyncFunction("prepareOcr") { promise: Promise ->
      val client = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
      val sample = Bitmap.createBitmap(128, 128, Bitmap.Config.ARGB_8888)
      sample.eraseColor(Color.WHITE)
      client.process(InputImage.fromBitmap(sample, 0))
        .addOnSuccessListener { client.close(); sample.recycle(); promise.resolve(true) }
        .addOnFailureListener { client.close(); sample.recycle(); promise.reject("OCR_MODEL", "Text recognition could not start. Reopen FitCoach and try again.", it) }
    }
    AsyncFunction("readText") { uri: String, promise: Promise ->
      val client = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)
      try {
        val image = InputImage.fromFilePath(context, Uri.parse(uri))
        client.process(image).addOnSuccessListener { text ->
          client.close()
          promise.resolve(mapOf("text" to text.text, "blocks" to text.textBlocks.map { block -> mapOf("text" to block.text, "lines" to block.lines.map { it.text }) }))
        }.addOnFailureListener { client.close(); promise.reject("OCR", "Could not read this image. Try a sharp close-up of the label or enter its text manually.", it) }
      } catch (e: Exception) { client.close(); promise.reject("OCR_IMAGE", e.message, e) }
    }
    AsyncFunction("speech") { promise: Promise ->
      val activity = appContext.currentActivity
      if (pending != null || activity == null) { promise.reject("BUSY", "Another picker is open.", null); return@AsyncFunction }
      val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
        .putExtra(RecognizerIntent.EXTRA_PROMPT, "Describe your exercise, reps and weight")
      try { pending = promise; activity.startActivityForResult(intent, speechRequest) }
      catch (e: Exception) { pending = null; promise.reject("SPEECH_UNAVAILABLE", "Install or enable a speech recognition service, or type your log.", e) }
    }
    AsyncFunction("pickPdf") { promise: Promise ->
      val activity = appContext.currentActivity
      if (pending != null || activity == null) { promise.reject("BUSY", "Another picker is open.", null); return@AsyncFunction }
      val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).setType("application/pdf").addCategory(Intent.CATEGORY_OPENABLE)
      try { pending = promise; activity.startActivityForResult(intent, pdfRequest) }
      catch (e: Exception) { pending = null; promise.reject("PDF_PICKER", e.message, e) }
    }
    OnActivityResult { _, result ->
      if (result.requestCode == speechRequest || result.requestCode == pdfRequest) {
        val promise = pending
        pending = null
        val data = result.data
        if (result.resultCode != Activity.RESULT_OK || data == null) promise?.resolve(null)
        else if (result.requestCode == speechRequest) promise?.resolve(data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.firstOrNull())
        else {
          val uri = data.data
          executor.execute {
            try {
              requireNotNull(uri)
              val descriptor = requireNotNull(context.contentResolver.openFileDescriptor(uri, "r"))
              descriptor.use { fd -> PdfRenderer(fd).use { renderer ->
                require(renderer.pageCount <= 12) { "Use a PDF with at most 12 pages, or split it first." }
                val directory = File(context.cacheDir, "fitcoach-import")
                directory.mkdirs()
                val files = (0 until renderer.pageCount).map { index ->
                  renderer.openPage(index).use { page ->
                    val scale = minOf(1400.0 / page.width, 2400.0 / page.height)
                    val width = (page.width * scale).toInt().coerceAtLeast(1)
                    val height = (page.height * scale).toInt().coerceAtLeast(1)
                    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                    val file = File(directory, "page-$index.jpg")
                    try {
                      bitmap.eraseColor(Color.WHITE)
                      page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                      file.outputStream().use { bitmap.compress(Bitmap.CompressFormat.JPEG, 85, it) }
                    } finally { bitmap.recycle() }
                    Uri.fromFile(file).toString()
                  }
                }
                promise?.resolve(files)
              } }
            } catch (e: Exception) { promise?.reject("PDF_READ", e.message ?: "Unable to read this PDF.", e) }
          }
        }
      }
    }
    OnDestroy { pending?.resolve(null); pending = null; executor.shutdown() }
  }
}
