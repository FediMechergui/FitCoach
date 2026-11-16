const { withGradleProperties, withDangerousMod } = require('@expo/config-plugins');
const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = config => {
  config = withGradleProperties(config, config => {
  const values = { 'android.enableProguardInReleaseBuilds': 'true', 'android.enableShrinkResourcesInReleaseBuilds': 'true' };
  for (const [key,value] of Object.entries(values)) {
    config.modResults = config.modResults.filter(item => item.type !== 'property' || item.key !== key);
    config.modResults.push({type:'property',key,value});
  }
  return config;
  });
  return withDangerousMod(config, ['android', async config => {
    const file = path.join(config.modRequest.platformProjectRoot, 'app', 'proguard-rules.pro');
    const source = await fs.readFile(file, 'utf8');
    const marker = '# FitCoach: preserve Fabric JNI descriptors';
    // RN 0.76's annotations keep FabricUIManager.mBinding, but not its Binding
    // descriptor. Expo's native lookup requires both original class and field names.
    // Required by the native lookup in minified release builds.
    if (!source.includes(marker)) await fs.appendFile(file,
      `\n${marker}\n-keep,includedescriptorclasses class com.facebook.react.fabric.** { *; }\n`);
    // TaskService constructs consumers with getDeclaredConstructor and restores
    // their persisted class names after a restart. R8 cannot infer either use.
    const taskMarker = '# FitCoach: preserve background task consumers';
    if (!source.includes(taskMarker)) await fs.appendFile(file,
      `\n${taskMarker}\n-keep,includedescriptorclasses class * implements expo.modules.interfaces.taskManager.TaskConsumerInterface { *; }\n`);
    return config;
  }]);
};
