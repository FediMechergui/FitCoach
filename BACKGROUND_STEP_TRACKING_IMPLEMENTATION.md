# Android Background Step Tracking Implementation

## Overview

This implementation adds true background step counting for Android devices using the hardware `TYPE_STEP_COUNTER` sensor. The system continues tracking steps even when the app is killed or the screen is off, with checkpoints every 10 seconds.

## Architecture

### Key Components

1. **walkBackgroundTask.ts** - Background task using TaskManager + Location updates
2. **walkTracking.ts** - Enhanced with Android baseline tracking and reconciliation
3. **Database Schema** - New columns for Android step tracking
4. **Permissions** - Android-specific permissions for background operation

## How It Works

### 1. Session Start (startWalkTracking)
```
1. Request motion + location permissions
2. Capture device's cumulative step count as "baseline" (androidBaselineSteps)
3. Store baseline in database
4. Start foreground sensors (Pedometer.watchStepCount)
5. Register background task (location updates every 10 seconds)
6. Show sticky notification with progress bar
```

### 2. Background Operation (walkBackgroundTask)
```
Every 10 seconds (via location update trigger):
1. Read current cumulative hardware step count
2. Calculate session steps = current - baseline
3. Store checkpoint in database (steps, androidCurrentCumulative)
4. Continue even when app is killed
```

### 3. App Resume (resumeWalkTracking)
```
When app returns to foreground:
1. Read last checkpoint from database
2. Get current cumulative hardware step count
3. Calculate: sessionSteps = current - baseline
4. Reconcile: use max(calculated, checkpoint)
5. Re-register background task
6. Continue tracking
```

### 4. Session Stop (stopWalkTracking)
```
1. Get final step count
2. Unregister background task
3. Clean up sensors and notifications
4. Reset baseline
5. Return final WalkResult
```

## Database Schema Changes

### live_walks table - New Columns
```sql
android_baseline_steps INTEGER      -- Cumulative count at session start
android_current_cumulative INTEGER  -- Latest cumulative count (for debugging)
```

## Android Permissions

Required permissions in `app.config.ts`:
- `ACTIVITY_RECOGNITION` - Access hardware step counter
- `ACCESS_BACKGROUND_LOCATION` - Run background location task
- `FOREGROUND_SERVICE_LOCATION` - Foreground service for background task
- `WAKE_LOCK` - Keep CPU awake for checkpoints
- `RECEIVE_BOOT_COMPLETED` - Restart after device reboot

## Testing Scenarios

### Test 1: App Backgrounded (Screen Off)
**Steps:**
1. Start a walk session
2. Lock the screen for 5 minutes
3. Unlock and check the app
4. Walk around for 2 minutes with screen on

**Expected Result:**
- Steps counted during screen-off period are reconciled when screen turns on
- No gap in step count
- Console shows: "Android reconciliation: baseline=X, current=Y, final=Z"

### Test 2: App Killed
**Steps:**
1. Start a walk session
2. Walk for 2 minutes (ensure steps are counting)
3. Kill the app from recent apps (swipe away)
4. Walk for 5 minutes with app killed
5. Reopen the app

**Expected Result:**
- Session resumes automatically
- Steps from the 5-minute gap are recovered
- Background task checkpoints visible in logs
- Total step count includes all steps

### Test 3: Mixed Walking (Foreground + Background + Killed)
**Steps:**
1. Start walk, walk 100 steps (foreground) - note count
2. Lock screen, walk 100 steps (background)
3. Unlock, verify ~200 steps
4. Kill app, walk 100 steps
5. Reopen app, verify ~300 steps
6. Walk 100 steps (foreground)
7. Stop session, verify ~400 steps total

**Expected Result:**
- All four periods are counted
- Final count is approximately 400 steps
- No double-counting
- No lost steps

### Test 4: GPS Run (Parallel Tracking)
**Steps:**
1. Start a run (GPS enabled)
2. Lock screen immediately
3. Run for 10 minutes with screen off
4. Unlock and check

**Expected Result:**
- GPS route continues tracking
- Steps counted via background task
- Both GPS notification and step notification visible
- Distance and steps both accurate

### Test 5: Long Session with Multiple Interruptions
**Steps:**
1. Start walk
2. Walk 5 minutes (foreground)
3. Lock screen 5 minutes
4. Unlock, walk 2 minutes
5. Kill app
6. Wait 3 minutes walking
7. Reopen app
8. Walk 5 minutes
9. Lock screen 5 minutes
10. Unlock and stop session

**Expected Result:**
- All periods counted correctly
- Checkpoints every 10 seconds in database
- Final count is cumulative of all periods
- No duplicate counts

### Test 6: Device Reboot During Session
**Steps:**
1. Start walk session
2. Walk for 5 minutes
3. Note the step count
4. Reboot the device (WARNING: This may break the session)
5. Reopen app after reboot

**Expected Result:**
- Session may not survive reboot (this is a known limitation)
- If it does survive, steps should reconcile from baseline
- No crash on app launch

### Test 7: Permission Revocation
**Steps:**
1. Start walk session
2. Go to Android Settings > Apps > FitCoach > Permissions
3. Revoke "Physical activity" permission
4. Return to app
5. Walk around

**Expected Result:**
- Background task stops
- App shows permission denied
- Foreground accelerometer fallback may activate
- No crash

### Test 8: Low Battery / Battery Saver Mode
**Steps:**
1. Enable battery saver mode
2. Start walk session
3. Lock screen for 10 minutes
4. Unlock

**Expected Result:**
- Background task may run less frequently
- Steps still reconciled on resume
- May have larger gaps between checkpoints

## Debugging

### Console Logs to Monitor

**On Session Start:**
```
[Walk] Background task registered
```

**Every 10 Seconds (Background):**
```
[BG Task] Checkpoint: baseline=1000, current=1150, session=150
```

**On App Resume:**
```
[Walk Resume] Android reconciliation: baseline=1000, current=1500, calculated=500, checkpoint=450, final=500
```

**On Session Stop:**
```
[BG Task] Background step tracking unregistered
```

### Database Inspection

Query live walk during active session:
```sql
SELECT * FROM live_walks WHERE id = 1;
```

Check for:
- `android_baseline_steps` is set (not null)
- `android_current_cumulative` updates every 10 seconds
- `steps` increases over time
- `updated_at` timestamp advances

## Troubleshooting

### Issue: Steps not counting in background

**Check:**
1. Permissions granted (Settings > Apps > FitCoach > Permissions)
2. Background location permission = "Allow all the time"
3. Physical activity permission granted
4. Battery optimization disabled for FitCoach

### Issue: Background task not running

**Check:**
1. Foreground notification visible
2. TaskManager registered: `await TaskManager.isTaskRegisteredAsync('WALK_STEP_BACKGROUND')`
3. Android battery saver not blocking background tasks
4. App has WAKE_LOCK permission

### Issue: Double counting steps

**Check:**
1. Only one background task registered
2. `resumeWalkTracking` uses `max()` not addition
3. Baseline not being reset mid-session

### Issue: Steps lost after app kill

**Check:**
1. Database migration ran successfully
2. `androidBaselineSteps` stored in DB
3. Background task had time to write checkpoint before kill
4. Check database for last checkpoint timestamp

## Performance Considerations

**Battery Impact:**
- Background location updates every 10 seconds: ~5-10% battery per hour
- Hardware step counter: negligible (OS-level sensor)
- Total impact similar to other fitness apps

**Data Usage:**
- Background task does not use network
- Only GPS runs may use data for map tiles

**Storage:**
- Each checkpoint writes ~50 bytes
- 360 checkpoints per hour = ~18KB/hour
- Negligible storage impact

## Known Limitations

1. **10-second interval minimum** - Android location updates can't go faster reliably
2. **Doesn't survive device reboot** - Session data persists but task may need restart
3. **Battery saver reduces frequency** - May get checkpoints every 30-60 seconds instead
4. **Doze mode** - Deep sleep may delay checkpoints up to 15 minutes
5. **iOS not supported** - This implementation is Android-only

## Implementation Checklist

- [x] Create background task with TaskManager
- [x] Add Android baseline tracking to schema
- [x] Modify startWalkTracking to capture baseline
- [x] Register background task on session start
- [x] Update resumeWalkTracking to reconcile
- [x] Unregister background task on stop
- [x] Add required Android permissions
- [ ] Test with app backgrounded
- [ ] Test with app killed
- [ ] Test GPS + step counting together
- [ ] Verify battery impact is acceptable
- [ ] Test on multiple Android versions (9+)

## Next Steps for Testing

1. **Build APK**: `npm run build:apk`
2. **Install on device**: Use Expo Go or standalone APK
3. **Run test scenarios** above
4. **Monitor logs**: `adb logcat | grep -E "(BG Task|Walk)"`
5. **Check database**: Use SQLite inspector
6. **Verify battery**: Settings > Battery > App usage

## Migration Path

If users have active sessions before this update:
1. App will resume old sessions without Android baseline
2. Background task won't work for these old sessions
3. Users should stop and restart walk/run to enable new system
4. Consider showing a notice: "Restart your session to enable improved background tracking"
