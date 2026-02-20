'use strict';

const cron = require('node-cron');

const DEFAULT_SCHEDULE = '0 9 * * *'; // runs at 00:59 (5 mins from now) — change to '0 9 * * *' for production

function scheduleJob(jobFn) {
  const schedule = process.env.CRON_SCHEDULE || DEFAULT_SCHEDULE;

  if (!cron.validate(schedule)) {
    throw new Error(`[scheduler] Invalid CRON_SCHEDULE: "${schedule}"`);
  }

  console.log(`[scheduler] Agent started. Next run scheduled: "${schedule}" (cron)`);

  cron.schedule(schedule, async () => {
    console.log(`\n[scheduler] ${new Date().toISOString()} — Cron triggered, running agent...`);
    try {
      await jobFn();
    } catch (err) {
      console.error(`[scheduler] Agent run failed: ${err.message}`);
      // Do not rethrow — keep the cron process alive for the next trigger
    }
  });
}

module.exports = { scheduleJob };
