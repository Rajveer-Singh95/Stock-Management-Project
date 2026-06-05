const cron = require('node-cron');
const { checkAndGenerateAlerts } = require('./alertService');
const { cacheDelPattern } = require('./cacheService');

function startCronJobs() {
  // Check stock alerts every hour
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Running scheduled alert check...');
    const alertCount = await checkAndGenerateAlerts();
    console.log(`✅ Alert check complete — ${alertCount} low stock items found`);
    await cacheDelPattern('dashboard:*');
  });

  // Clear forecast cache daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Clearing forecast cache...');
    await cacheDelPattern('forecast:*');
    console.log('✅ Forecast cache cleared');
  });

  // Run once on startup
  setTimeout(async () => {
    console.log('🔄 Running initial alert check...');
    await checkAndGenerateAlerts();
  }, 3000);

  console.log('⏰ Cron jobs started');
}

module.exports = { startCronJobs };
