const fs = require('fs');
const path = require('path');
const { withDangerousMod, withInfoPlist, withXcodeProject } = require('@expo/config-plugins');
const { addBuildSourceFileToGroup, getApplicationNativeTarget } = require('@expo/config-plugins/build/ios/utils/Xcodeproj');

const SCENE_FILES = ['SceneDelegate.h', 'SceneDelegate.mm'];

function sceneManifest() {
  return {
    UIApplicationSupportsMultipleScenes: false,
    UISceneConfigurations: {
      UIWindowSceneSessionRoleApplication: [
        {
          UISceneConfigurationName: 'Default Configuration',
          UISceneDelegateClassName: 'SceneDelegate',
        },
      ],
    },
  };
}

function copySceneSources(iosRoot) {
  const sourceDir = path.join(__dirname, 'scene');
  const destinationDir = path.join(iosRoot, 'Oslyn');
  fs.mkdirSync(destinationDir, { recursive: true });
  for (const fileName of SCENE_FILES) {
    fs.copyFileSync(path.join(sourceDir, fileName), path.join(destinationDir, fileName));
  }
}

function withSceneLifecycle(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = sceneManifest();
    return config;
  });

  config = withDangerousMod(config, [
    'ios',
    (config) => {
      copySceneSources(config.modRequest.platformProjectRoot);
      return config;
    },
  ]);

  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const target = getApplicationNativeTarget({ project });
    const quoted = project.pbxFileReferenceSection();
    const alreadyLinked = Object.values(quoted).some((entry) => {
      return entry && typeof entry === 'object' && String(entry.path || '').includes('SceneDelegate.mm');
    });
    if (!alreadyLinked) {
      addBuildSourceFileToGroup({
        filepath: 'Oslyn/SceneDelegate.mm',
        groupName: 'Oslyn',
        project,
        targetUuid: target.uuid,
      });
    }
    return config;
  });

  return config;
}

module.exports = withSceneLifecycle;
