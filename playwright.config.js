const {defineConfig,devices}=require('@playwright/test');
const external=process.env.PLAYWRIGHT_BASE_URL;
const launchOptions=process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{};
module.exports=defineConfig({
 testDir:'./tests/browser',fullyParallel:true,forbidOnly:!!process.env.CI,
 retries:0,workers:4,timeout:180000,globalTimeout:20*60*1000,
 expect:{timeout:10000},outputDir:'test-results',
 reporter:[['list'],['html',{open:'never',outputFolder:'playwright-report'}],['json',{outputFile:'test-results/results.json'}]],
 use:{actionTimeout:10000,navigationTimeout:15000,baseURL:external||'http://127.0.0.1:4180',trace:'retain-on-failure',screenshot:'only-on-failure',video:'retain-on-failure',launchOptions},
 projects:[
  {name:'desktop',testMatch:/.*\.spec\.js/,use:{...devices['Desktop Chrome']}},
  {name:'mobile',testMatch:/(flows|paid-final)\.spec\.js/,use:{...devices['Pixel 7']}},
 ],
 webServer:external?undefined:{command:'node tools/esol/preview.js --port 4180',url:'http://127.0.0.1:4180/esol/',reuseExistingServer:false,timeout:30000},
});
