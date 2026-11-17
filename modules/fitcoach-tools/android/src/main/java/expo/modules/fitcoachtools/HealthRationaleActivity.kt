package expo.modules.fitcoachtools
import android.app.Activity
import android.os.Bundle
import android.widget.TextView
class HealthRationaleActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val text = TextView(this)
    text.text = "FitCoach and Health Connect\n\nWith your permission, FitCoach displays daily aggregate steps and sleep from Health Connect. These totals stay separate from FitCoach logs to avoid counting the same activity twice.\n\nExport is manual: you choose each completed workout to send to Health Connect. Re-export updates the same workout rather than creating a duplicate. Routes, food, notes, photos and account credentials are not exported.\n\nHealth Connect readings are not sent to AI or included in automatic backups. You can revoke permissions and delete exported records in Android Health Connect settings."
    text.textSize = 18f
    text.setPadding(32, 48, 32, 32)
    setContentView(text)
  }
}
