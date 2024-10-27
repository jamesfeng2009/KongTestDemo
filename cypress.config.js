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
            ]
        },
        setupNodeEvents(on, config) {
            // 使用有效的事件名称注册事件处理

            // 1. 捕获每次测试运行后事件
            on('after:run', (results) => {
                console.log('All tests have completed running.');
                if (results.totalFailed > 0) {
                    console.log(`Total failed tests: ${results.totalFailed}`);
                }
            });

            // 2. 捕获每次测试截图事件
            on('after:screenshot', (details) => {
                console.log('Screenshot taken:', details.path);
            });

            // 3. 捕获浏览器启动事件，添加额外的浏览器选项
            on('before:browser:launch', (browser = {}, launchOptions) => {
                if (browser.name === 'chrome' && browser.isHeadless) {
                    launchOptions.args.push('--disable-gpu');
                }
                return launchOptions;
            });

            return config; // 必须返回修改后的配置对象
        },
    },
});
