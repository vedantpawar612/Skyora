// Custom Expo Config Plugin: Copy MediaPipe model files into Android assets
// This is needed because react-native-mediapipe's native code loads the
// .task model from Android's AssetManager (setModelAssetPath), which reads
// from the app's `assets/` directory. In a managed Expo project, files in
// our JS `assets/` folder are NOT automatically placed in Android's native
// `assets/` directory. This plugin bridges that gap.

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withMediapipeModels(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot; // android/

      // Source: our JS assets/models directory
      const modelsSourceDir = path.join(projectRoot, 'assets', 'models');
      // Destination: android/app/src/main/assets/
      const assetsDestDir = path.join(platformRoot, 'app', 'src', 'main', 'assets');

      // Create dest directory if it doesn't exist
      if (!fs.existsSync(assetsDestDir)) {
        fs.mkdirSync(assetsDestDir, { recursive: true });
      }

      // Copy all .task files from source to destination
      if (fs.existsSync(modelsSourceDir)) {
        const files = fs.readdirSync(modelsSourceDir);
        for (const file of files) {
          if (file.endsWith('.task')) {
            const src = path.join(modelsSourceDir, file);
            const dest = path.join(assetsDestDir, file);
            console.log(`[withMediapipeModels] Copying ${file} -> ${dest}`);
            fs.copyFileSync(src, dest);
          }
        }
      } else {
        console.warn(`[withMediapipeModels] Models source directory not found: ${modelsSourceDir}`);
      }

      return config;
    },
  ]);
}

module.exports = withMediapipeModels;
