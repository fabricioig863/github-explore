const fs = require('fs');
const path = require('path');

let withDangerousMod;
try {
  ({ withDangerousMod } = require('expo/config-plugins'));
} catch {
  ({ withDangerousMod } = require('@expo/config-plugins'));
}

const MARKER = '# withIosDeploymentTargetFloor';
const DEFAULT_TARGET = '15.1';

// CocoaPods assigns resource bundle targets the deployment target declared by
// each pod's own podspec instead of the Podfile platform, and
// react_native_post_install does not normalize them. Xcode 15+ rejects any
// target below its supported floor, so raise the stragglers after install.
const buildSnippet = (deploymentTarget) => `
    ${MARKER}
    min_target = '${deploymentTarget}'
    projects = [installer.pods_project]
    projects += installer.generated_projects if installer.respond_to?(:generated_projects)
    projects.compact.uniq.each do |project|
      project.targets.each do |target|
        target.build_configurations.each do |build_config|
          current = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
          if current.nil? || current.to_f < min_target.to_f
            build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = min_target
          end
        end
      end
    end
`;

module.exports = function withIosDeploymentTargetFloor(config, props = {}) {
  const deploymentTarget = props.deploymentTarget || DEFAULT_TARGET;

  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      const podfile = fs.readFileSync(podfilePath, 'utf8');

      if (podfile.includes(MARKER)) {
        return config;
      }

      // Anchor on the closing paren of the react_native_post_install call so the
      // floor is applied after React Native has finished rewriting build settings.
      const anchor = /react_native_post_install\([\s\S]*?\n\s*\)\n/;
      const match = podfile.match(anchor);

      if (!match) {
        throw new Error(
          '[withIosDeploymentTargetFloor] Could not find the react_native_post_install call in ios/Podfile. ' +
            'The Expo template changed — update the anchor in plugins/withIosDeploymentTargetFloor.js.'
        );
      }

      const insertAt = match.index + match[0].length;
      fs.writeFileSync(
        podfilePath,
        podfile.slice(0, insertAt) + buildSnippet(deploymentTarget) + podfile.slice(insertAt),
        'utf8'
      );

      return config;
    },
  ]);
};
