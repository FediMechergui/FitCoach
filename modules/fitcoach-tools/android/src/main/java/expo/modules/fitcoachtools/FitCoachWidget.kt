package expo.modules.fitcoachtools
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
class FitCoachWidget : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) { for (id in ids) render(context, manager, id) }
  companion object {
    fun refresh(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      for (id in manager.getAppWidgetIds(ComponentName(context, FitCoachWidget::class.java))) render(context, manager, id)
    }
    private fun render(context: Context, manager: AppWidgetManager, id: Int) {
      val prefs = context.getSharedPreferences("fitcoach.widget", Context.MODE_PRIVATE)
      val views = RemoteViews(context.packageName, R.layout.fitcoach_widget)
      views.setTextViewText(R.id.widget_summary, prefs.getString("summary", "Open FitCoach to refresh"))
      views.setTextViewText(R.id.widget_updated, prefs.getString("updated", ""))
      val train = Intent(Intent.ACTION_VIEW, Uri.parse("fitcoach://train")).setPackage(context.packageName)
      val walk = Intent(Intent.ACTION_VIEW, Uri.parse("fitcoach://walk")).setPackage(context.packageName)
      views.setOnClickPendingIntent(R.id.widget_train, PendingIntent.getActivity(context, 711, train, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
      views.setOnClickPendingIntent(R.id.widget_walk, PendingIntent.getActivity(context, 712, walk, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE))
      manager.updateAppWidget(id, views)
    }
  }
}
