const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8001',
    supportFile: false,
    env: {
      validateServiceTestCases: [
        { name: 'test1', tags: ['tag1'] },
        { name: 'test2', tags: ['tag2', 'tag3'] },
        { name: 'test3', tags: ['tag4'] }
      ],
      createServiceTestCases: [
        { name: 'service1', tags: ['service1'] },
        { name: 'service2', tags: ['service2'] }
      ],
      createRouteTestCases: [
        { name: "route1", tags: ["route"], paths: ["/path1"] },
        { name: "route2", tags: ["route2"], paths: ["/path2"] }
      ]
    },
    setupNodeEvents(on, config) {
      // Capture events after running tests
      on('after:run', (results) => {
        console.log('All tests have completed running.');
        if (results.totalFailed > 0) {
          console.log(`Total failed tests: ${results.totalFailed}`);
        }
      });

      // Capture event when a screenshot is taken
      on('after:screenshot', (details) => {
        console.log('Screenshot taken:', details.path);
      });

      // Capture event before browser launch
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'chrome' && browser.isHeadless) {
          launchOptions.args.push('--disable-gpu'); // Add extra browser options if necessary
        }
        return launchOptions;
      });

      return config; // Return the updated configuration object
    }
  }
});
