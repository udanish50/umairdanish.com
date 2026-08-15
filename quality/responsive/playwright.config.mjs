import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const siteRoot=path.resolve(here,'../..');
export default defineConfig({
  testDir:'./tests',
  timeout:45_000,
  expect:{timeout:5_000},
  fullyParallel:true,
  workers:process.env.CI?6:4,
  retries:process.env.CI?1:0,
  reporter:process.env.CI?[['list'],['html',{outputFolder:'playwright-report',open:'never'}]]:'list',
  use:{
    baseURL:'http://127.0.0.1:4173',
    browserName:'chromium',
    channel:process.env.PW_CHANNEL||undefined,
    headless:true,
    launchOptions:process.env.PW_EXECUTABLE_PATH?{executablePath:process.env.PW_EXECUTABLE_PATH}:{},
    actionTimeout:8_000,
    navigationTimeout:12_000,
  },
  webServer:{
    command:'python3 quality/responsive/quiet_server.py 4173',
    cwd:siteRoot,
    url:'http://127.0.0.1:4173/',
    reuseExistingServer:!process.env.CI,
    timeout:30_000,
    stdout:'ignore',stderr:'pipe'
  },
  outputDir:'test-results',
});
