// Simulate clean browser environment
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://quran-app-hazel-three.vercel.app/' });
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
global.CustomEvent = dom.window.CustomEvent;
global.Event = dom.window.Event;

try {
  const store = require('./lib/unified-plan-store');
  console.log('Unified plan store loaded.');
  const rec = store.loadUnifiedRecord();
  console.log('loadUnifiedRecord returned successfully:', rec.planId);
  const days = store.getAllPlanDays(rec);
  console.log('getAllPlanDays returned:', days.length);
  const q = store.selectDailyQuota(rec, '2026-11-01', days);
  console.log('selectDailyQuota returned:', q);
} catch (e) {
  console.error('ERROR in unified-plan-store:', e);
}

