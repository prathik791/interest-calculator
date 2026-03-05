const cron = require('node-cron');
const Transaction = require('../models/Transaction');

const startReminderJobs = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('\n⏰ [CRON] Running daily due date reminder check...');
    try {
      const today = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(today.getDate() + 3);

      const upcoming = await Transaction.find({
        dueDate: { $gte: today, $lte: threeDaysFromNow },
        status: { $in: ['active', 'partial'] },
      }).populate('userId', 'name email');

      if (upcoming.length === 0) {
        console.log('✅ [CRON] No upcoming dues in next 3 days.');
        return;
      }

      console.log(`📋 [CRON] Found ${upcoming.length} upcoming due transactions:`);
      upcoming.forEach((t) => {
        const daysLeft = Math.ceil((new Date(t.dueDate) - today) / (1000 * 60 * 60 * 24));
        console.log(`  🔔 REMINDER: ${t.personName} | ₹${t.amount} (${t.type}) | Due in ${daysLeft} day(s) | User: ${t.userId?.email || 'Unknown'}`);
        // TODO: Integrate WhatsApp/SMS API here
        // await sendWhatsApp(t.userId.phone, `Reminder: ₹${t.amount} due from ${t.personName} in ${daysLeft} days`);
      });
    } catch (error) {
      console.error('❌ [CRON] Reminder job error:', error.message);
    }
  });

  // Weekly summary - every Monday at 8 AM
  cron.schedule('0 8 * * 1', async () => {
    console.log('\n📊 [CRON] Running weekly summary report...');
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const weeklyStats = await Transaction.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: '$type', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]);

      console.log('📈 [CRON] Weekly Transaction Summary:');
      weeklyStats.forEach((s) => {
        console.log(`  ${s._id === 'given' ? '💚 Given' : '🔴 Taken'}: ${s.count} transactions | ₹${s.total.toFixed(2)}`);
      });
    } catch (error) {
      console.error('❌ [CRON] Weekly summary error:', error.message);
    }
  });

  console.log('⏰ Cron jobs scheduled: Daily reminders (9 AM) + Weekly summary (Mon 8 AM)');
};

module.exports = { startReminderJobs };
