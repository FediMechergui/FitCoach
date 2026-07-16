const { withProjectBuildGradle } = require('expo/config-plugins');

/**
 * Make Android dependency resolution immune to third-party Maven outages.
 *
 * expo-image-picker depends on com.github.CanHub:Android-Image-Cropper, which
 * is published on JitPack. By default Gradle asks every configured repository
 * in order, and when an unrelated repo answers 5xx — as the retired Sonatype
 * OSSRH snapshots host now regularly does — Gradle fails the whole build:
 *   "Could not GET https://oss.sonatype.org/... Received status code 504"
 *
 * Two defenses, applied at prebuild time:
 *  1. Strip any `oss.sonatype.org/content/repositories/snapshots` repository
 *     from the root build.gradle (it hosts nothing this app needs).
 *  2. Declare `exclusiveContent`: the com.github.CanHub group resolves ONLY
 *     from JitPack, so no other repository is ever consulted for it. Scoped to
 *     the exact group (not com.github.*) because e.g. Glide legitimately lives
 *     on Maven Central under a com.github.* group id.
 */
const MARKER = '@generated withJitpackExclusive';

const SNIPPET = `
// ${MARKER}
allprojects {
    repositories {
        exclusiveContent {
            forRepository {
                maven { url "https://www.jitpack.io" }
            }
            filter {
                includeGroup("com.github.CanHub")
            }
        }
    }
}
`;

module.exports = function withJitpackExclusive(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') return cfg;
    let contents = cfg.modResults.contents;

    // 1. Remove the retired Sonatype snapshots repository if the template has it.
    contents = contents.replace(
      /^.*maven\s*\{[^}]*oss\.sonatype\.org\/content\/repositories\/snapshots[^}]*\}.*$\n?/gm,
      ''
    );

    // 2. Pin CanHub (image cropper) resolution exclusively to JitPack.
    if (!contents.includes(MARKER)) {
      contents += SNIPPET;
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
};
