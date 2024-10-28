const { defineConfig } = require("cypress");
const merge = require('mochawesome-merge');
const generator = require('mochawesome-report-generator');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8001', // Adjust this to your actual API base URL
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
      on('after:run', async (results) => {
        console.log('All tests have completed running.');
        if (results.totalFailed > 0) {
          console.log(`Total failed tests: ${results.totalFailed}`);
        }

        try {
          // Merge all Mochawesome JSON reports into a single report
          const report = await merge({
            files: ['cypress/results/*.json'] // Make sure the path is correct
          });

          // Generate the final HTML report from the merged JSON
          await generator.create(report, {
            reportDir: 'cypress/results', // Directory to save the report
            saveHtml: true, // Save the report as an HTML file
            saveJson: true, // Save the report as a JSON file
            overwrite: true // Overwrite previous reports
          });

          console.log('Test report successfully generated!');
        } catch (err) {
          console.error('Error generating the report: ', err);
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
    },
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/results', // Directory where reports will be saved
      overwrite: false, // Do not overwrite existing reports
      html: true, // Generate HTML reports
      json: true, // Generate JSON reports
      timestamp: 'mmddyyyy_HHMMss' // Add timestamps to report filenames
    }
  }
});
