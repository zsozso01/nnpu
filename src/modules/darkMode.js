// Master dark mode module - collects and imports both login and dashboard dark mode
const loginDarkMode = require("./loginDarkMode");
const dashboardDarkMode = require("./dashboardDarkMode");

module.exports = {
  shouldActivate: () => {
    // Activate if either login or dashboard should be active
    return loginDarkMode.shouldActivate() || dashboardDarkMode.shouldActivate();
  },
  runOutsideNeptun: true,
  initialize: () => {
    // Initialize login dark mode
    if (loginDarkMode.shouldActivate()) {
      loginDarkMode.initialize();
    }

    // Initialize dashboard dark mode
    if (dashboardDarkMode.shouldActivate()) {
      dashboardDarkMode.initialize();
    }
  },
};
