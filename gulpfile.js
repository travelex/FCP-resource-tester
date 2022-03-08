var gulp = require('gulp');
var reporter = require('cucumber-html-reporter');
var options = {
    theme: 'bootstrap',
    jsonFile: './adapter-test/reports/cucumber-reports/cucumber-json-report.json',
    output: './adapter-test/reports/cucumber-reports/cucumber-html-report.html',
    reportSuiteAsScenarios: true,
    launchReport: false,
    metadata: {
        'App Version': '1.0.0',
        'Test Environment': 'STAGING',
        'Browser': 'NA',
        'Platform': 'NA',
        'Parallel': 'Scenarios',
        'Executed': 'Local'
    }
};

gulp.task('cucumberReports', function () {
    reporter.generate(options);
});