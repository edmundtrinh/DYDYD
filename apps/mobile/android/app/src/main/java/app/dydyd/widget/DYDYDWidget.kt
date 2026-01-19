// ============================================
// DYDYD - Android Widget Provider
// ============================================
// Glance-based widget for Android home screen

package app.dydyd.widget

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.*
import androidx.glance.action.ActionParameters
import androidx.glance.action.clickable
import androidx.glance.appwidget.*
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

// Data classes
data class QuestData(
    val id: String,
    val name: String,
    val category: String,
    val targetValue: Int,
    val currentValue: Int,
    val isCompleted: Boolean,
    val xpValue: Int
)

data class WidgetData(
    val todayXP: Int = 0,
    val totalXP: Int = 0,
    val level: Int = 1,
    val levelProgress: Float = 0f,
    val completedCount: Int = 0,
    val totalCount: Int = 0,
    val quests: List<QuestData> = emptyList(),
    val lastUpdated: Long = System.currentTimeMillis()
)

// Preferences keys
object WidgetDataKeys {
    val WIDGET_DATA = stringPreferencesKey("widget_data")
}

// Widget colors
object WidgetColors {
    val background = Color(0xFF1A1A2E)
    val surface = Color(0xFF16213E)
    val primary = Color(0xFF4CAF50)
    val secondary = Color(0xFFFFB74D)
    val text = Color.White
    val textSecondary = Color(0xFFB0B0B0)
    
    fun categoryColor(category: String): Color = when (category) {
        "physical_health" -> Color(0xFFE53935)
        "mental_wellness" -> Color(0xFF9C27B0)
        "career" -> Color(0xFF2196F3)
        "relationships" -> Color(0xFFE91E63)
        "home_chores" -> Color(0xFFFF9800)
        else -> Color(0xFF757575)
    }
}

// Widget Receiver
class DYDYDWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = DYDYDWidget()
}

// Main Widget
class DYDYDWidget : GlanceAppWidget() {
    
    override val sizeMode = SizeMode.Responsive(
        setOf(
            DpSize(100.dp, 100.dp),  // Small
            DpSize(250.dp, 100.dp), // Medium
            DpSize(250.dp, 250.dp)  // Large
        )
    )
    
    @Composable
    override fun Content() {
        val prefs = currentState<Preferences>()
        val widgetDataJson = prefs[WidgetDataKeys.WIDGET_DATA] ?: "{}"
        val widgetData = try {
            Gson().fromJson(widgetDataJson, WidgetData::class.java) ?: WidgetData()
        } catch (e: Exception) {
            WidgetData()
        }
        
        val size = LocalSize.current
        
        GlanceTheme {
            Box(
                modifier = GlanceModifier
                    .fillMaxSize()
                    .background(WidgetColors.background)
                    .cornerRadius(16.dp)
                    .clickable(actionRunCallback<OpenAppAction>())
                    .padding(12.dp)
            ) {
                when {
                    size.width < 200.dp -> SmallWidget(widgetData)
                    size.height < 150.dp -> MediumWidget(widgetData)
                    else -> LargeWidget(widgetData)
                }
            }
        }
    }
}

@Composable
fun SmallWidget(data: WidgetData) {
    Column(
        modifier = GlanceModifier.fillMaxSize(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Level badge
        Row(verticalAlignment = Alignment.CenterVertically) {
            Image(
                provider = ImageProvider(R.drawable.ic_flame),
                contentDescription = "Level",
                modifier = GlanceModifier.size(16.dp)
            )
            Spacer(GlanceModifier.width(4.dp))
            Text(
                text = "Lv ${data.level}",
                style = TextStyle(
                    color = ColorProvider(WidgetColors.secondary),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            )
        }
        
        Spacer(GlanceModifier.height(8.dp))
        
        // Today's XP
        Text(
            text = "${data.todayXP}",
            style = TextStyle(
                color = ColorProvider(WidgetColors.text),
                fontSize = 32.sp,
                fontWeight = FontWeight.Bold
            )
        )
        Text(
            text = "XP today",
            style = TextStyle(
                color = ColorProvider(WidgetColors.textSecondary),
                fontSize = 12.sp
            )
        )
        
        Spacer(GlanceModifier.height(8.dp))
        
        // Progress
        Text(
            text = "${data.completedCount}/${data.totalCount} quests",
            style = TextStyle(
                color = ColorProvider(WidgetColors.textSecondary),
                fontSize = 11.sp
            )
        )
    }
}

@Composable
fun MediumWidget(data: WidgetData) {
    Row(
        modifier = GlanceModifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Left - Stats
        Column(
            modifier = GlanceModifier.defaultWeight(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Image(
                    provider = ImageProvider(R.drawable.ic_flame),
                    contentDescription = "Level",
                    modifier = GlanceModifier.size(14.dp)
                )
                Spacer(GlanceModifier.width(4.dp))
                Text(
                    text = "Level ${data.level}",
                    style = TextStyle(
                        color = ColorProvider(WidgetColors.secondary),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                )
            }
            
            Spacer(GlanceModifier.height(4.dp))
            
            Text(
                text = "${data.todayXP} XP",
                style = TextStyle(
                    color = ColorProvider(WidgetColors.text),
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )
            )
            
            Spacer(GlanceModifier.height(4.dp))
            
            // Progress bar
            Box(
                modifier = GlanceModifier
                    .fillMaxWidth()
                    .height(4.dp)
                    .padding(horizontal = 8.dp)
            ) {
                Box(
                    modifier = GlanceModifier
                        .fillMaxWidth()
                        .height(4.dp)
                        .background(WidgetColors.surface)
                        .cornerRadius(2.dp)
                )
                Box(
                    modifier = GlanceModifier
                        .fillMaxWidth(data.levelProgress)
                        .height(4.dp)
                        .background(WidgetColors.primary)
                        .cornerRadius(2.dp)
                )
            }
        }
        
        // Divider
        Box(
            modifier = GlanceModifier
                .width(1.dp)
                .fillMaxHeight()
                .padding(vertical = 8.dp)
                .background(WidgetColors.surface)
        )
        
        // Right - Quick quests
        Column(
            modifier = GlanceModifier.defaultWeight().padding(start = 8.dp)
        ) {
            data.quests.take(3).forEach { quest ->
                QuestRow(quest)
                Spacer(GlanceModifier.height(4.dp))
            }
        }
    }
}

@Composable
fun LargeWidget(data: WidgetData) {
    Column(modifier = GlanceModifier.fillMaxSize()) {
        // Header
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Column(modifier = GlanceModifier.defaultWeight()) {
                Text(
                    text = "Did You Do Your Dailies?",
                    style = TextStyle(
                        color = ColorProvider(WidgetColors.text),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Image(
                        provider = ImageProvider(R.drawable.ic_flame),
                        contentDescription = "Level",
                        modifier = GlanceModifier.size(12.dp)
                    )
                    Spacer(GlanceModifier.width(4.dp))
                    Text(
                        text = "Level ${data.level} • ${data.todayXP} XP today",
                        style = TextStyle(
                            color = ColorProvider(WidgetColors.textSecondary),
                            fontSize = 11.sp
                        )
                    )
                }
            }
            
            // Circular progress
            CircularProgress(data.completedCount, data.totalCount)
        }
        
        Spacer(GlanceModifier.height(8.dp))
        
        // Divider
        Box(
            modifier = GlanceModifier
                .fillMaxWidth()
                .height(1.dp)
                .background(WidgetColors.surface)
        )
        
        Spacer(GlanceModifier.height(8.dp))
        
        // Quest list
        Column(modifier = GlanceModifier.defaultWeight()) {
            data.quests.take(5).forEach { quest ->
                QuestRowLarge(quest)
                Spacer(GlanceModifier.height(6.dp))
            }
        }
        
        // Quick action buttons
        Row(
            modifier = GlanceModifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            data.quests.filterNot { it.isCompleted }.take(2).forEach { quest ->
                QuickCompleteButton(quest)
                Spacer(GlanceModifier.width(8.dp))
            }
        }
    }
}

@Composable
fun QuestRow(quest: QuestData) {
    Row(
        modifier = GlanceModifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Image(
            provider = ImageProvider(
                if (quest.isCompleted) R.drawable.ic_check_circle 
                else R.drawable.ic_circle
            ),
            contentDescription = null,
            modifier = GlanceModifier.size(14.dp),
            colorFilter = ColorFilter.tint(
                ColorProvider(
                    if (quest.isCompleted) WidgetColors.primary 
                    else WidgetColors.categoryColor(quest.category)
                )
            )
        )
        Spacer(GlanceModifier.width(6.dp))
        Text(
            text = quest.name,
            style = TextStyle(
                color = ColorProvider(
                    if (quest.isCompleted) WidgetColors.textSecondary 
                    else WidgetColors.text
                ),
                fontSize = 11.sp
            ),
            maxLines = 1
        )
    }
}

@Composable
fun QuestRowLarge(quest: QuestData) {
    Row(
        modifier = GlanceModifier.fillMaxWidth()
            .clickable(actionRunCallback<CompleteQuestAction>(
                actionParametersOf(ActionParameters.Key<String>("questId") to quest.id)
            )),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Image(
            provider = ImageProvider(
                if (quest.isCompleted) R.drawable.ic_check_circle
                else getCategoryIcon(quest.category)
            ),
            contentDescription = null,
            modifier = GlanceModifier.size(18.dp),
            colorFilter = ColorFilter.tint(
                ColorProvider(
                    if (quest.isCompleted) WidgetColors.primary
                    else WidgetColors.categoryColor(quest.category)
                )
            )
        )
        
        Spacer(GlanceModifier.width(8.dp))
        
        Column(modifier = GlanceModifier.defaultWeight()) {
            Text(
                text = quest.name,
                style = TextStyle(
                    color = ColorProvider(
                        if (quest.isCompleted) WidgetColors.textSecondary
                        else WidgetColors.text
                    ),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                ),
                maxLines = 1
            )
            
            if (quest.targetValue > 1 && !quest.isCompleted) {
                Spacer(GlanceModifier.height(2.dp))
                Box(modifier = GlanceModifier.fillMaxWidth().height(3.dp)) {
                    Box(
                        modifier = GlanceModifier
                            .fillMaxWidth()
                            .height(3.dp)
                            .background(WidgetColors.surface)
                            .cornerRadius(2.dp)
                    )
                    Box(
                        modifier = GlanceModifier
                            .fillMaxWidth(quest.currentValue.toFloat() / quest.targetValue)
                            .height(3.dp)
                            .background(WidgetColors.categoryColor(quest.category))
                            .cornerRadius(2.dp)
                    )
                }
            }
        }
        
        Spacer(GlanceModifier.width(8.dp))
        
        Text(
            text = "+${quest.xpValue}",
            style = TextStyle(
                color = ColorProvider(
                    if (quest.isCompleted) WidgetColors.primary
                    else WidgetColors.textSecondary
                ),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold
            )
        )
    }
}

@Composable
fun CircularProgress(completed: Int, total: Int) {
    Box(
        modifier = GlanceModifier.size(40.dp),
        contentAlignment = Alignment.Center
    ) {
        // This is simplified - actual implementation would use Canvas
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "$completed",
                style = TextStyle(
                    color = ColorProvider(WidgetColors.primary),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
            )
            Text(
                text = "/$total",
                style = TextStyle(
                    color = ColorProvider(WidgetColors.textSecondary),
                    fontSize = 10.sp
                )
            )
        }
    }
}

@Composable
fun QuickCompleteButton(quest: QuestData) {
    Box(
        modifier = GlanceModifier
            .background(WidgetColors.surface)
            .cornerRadius(8.dp)
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .clickable(actionRunCallback<CompleteQuestAction>(
                actionParametersOf(ActionParameters.Key<String>("questId") to quest.id)
            ))
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Image(
                provider = ImageProvider(R.drawable.ic_add),
                contentDescription = "Complete",
                modifier = GlanceModifier.size(12.dp),
                colorFilter = ColorFilter.tint(ColorProvider(WidgetColors.primary))
            )
            Spacer(GlanceModifier.width(4.dp))
            Text(
                text = quest.name.take(15) + if (quest.name.length > 15) "..." else "",
                style = TextStyle(
                    color = ColorProvider(WidgetColors.text),
                    fontSize = 10.sp
                )
            )
        }
    }
}

fun getCategoryIcon(category: String): Int = when (category) {
    "physical_health" -> R.drawable.ic_heart
    "mental_wellness" -> R.drawable.ic_brain
    "career" -> R.drawable.ic_briefcase
    "relationships" -> R.drawable.ic_people
    "home_chores" -> R.drawable.ic_home
    else -> R.drawable.ic_star
}

// Actions
class OpenAppAction : ActionCallback {
    override suspend fun onAction(
        context: Context,
        glanceId: GlanceId,
        parameters: ActionParameters
    ) {
        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        intent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }
}

class CompleteQuestAction : ActionCallback {
    override suspend fun onAction(
        context: Context,
        glanceId: GlanceId,
        parameters: ActionParameters
    ) {
        val questId = parameters[ActionParameters.Key<String>("questId")]
        
        // Send intent to main app to complete quest
        val intent = Intent(context, MainActivity::class.java).apply {
            action = "app.dydyd.COMPLETE_QUEST"
            putExtra("questId", questId)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}

class RefreshAction : ActionCallback {
    override suspend fun onAction(
        context: Context,
        glanceId: GlanceId,
        parameters: ActionParameters
    ) {
        DYDYDWidget().update(context, glanceId)
    }
}
