const { AndroidConfig, withStringsXml } = require("expo/config-plugins");

// Keep the native project name ASCII so EAS and SDK 58 resolve the same target.
// The iOS display name is set in ios.infoPlist; preserve the Norwegian Android label here.
module.exports = function withAppDisplayName(config) {
  return withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: "app_name", translatable: "false" }, _: "KjørNesodden" }],
      config.modResults
    );
    return config;
  });
};
