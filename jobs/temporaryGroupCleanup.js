// jobs/temporaryCleanup.js
const cron = require("node-cron");
const Chat = require("../models/Chat");

let isRunning = false;

function startTemporaryGroupCleanupCron() {
    // cron.schedule("*/1 * * * *", async () => { ... });
    //cron.schedule("0 0 * * *", async () => { ... });
  cron.schedule(
    "0 0 * * *", // runs daily at midnight
    async () => {
      if (isRunning) return;
      isRunning = true;

      try {
        const now = new Date();
        const delResult = await Chat.updateMany(
          {
            isTemporary: true,
            expiresAt: { $lte: now },
            deletedAt: null,
          },
          { $set: { deletedAt: now } }
        );

        console.log(`Soft-deleted ${delResult.modifiedCount} expired temporary groups`);

        // Find chats with expired temporary members (but not deleted chats)
        const chats = await Chat.find({
          deletedAt: null,
          "temporaryMembers.expiresAt": { $lte: now },
        }).select("_id temporaryMembers users");

        console.log(`Found ${chats.length} chats with expired temporary members`);

        let totalMembersRemoved = 0;
        let chatsProcessed = 0;

        for (const chat of chats) {
          try {
            const expiredMembers = chat.temporaryMembers.filter(
              (m) => m.expiresAt && m.expiresAt <= now
            );

            if (expiredMembers.length === 0) continue;

            const expiredUserIds = expiredMembers
              .map((m) => m.user?.toString())
              .filter(Boolean);

            await Chat.updateOne(
              { _id: chat._id },
              {
                $pull: {
                  temporaryMembers: { expiresAt: { $lte: now } },
                  users: { $in: expiredUserIds },
                },
              }
            );

            totalMembersRemoved += expiredUserIds.length;
            chatsProcessed++;
          } catch (chatError) {
            console.error(`Error processing chat ${chat._id}:`, chatError);
          }
        }

        console.log(
          `Cleanup completed: Soft-deleted ${delResult.modifiedCount} groups, ` +
          `removed ${totalMembersRemoved} expired members from ${chatsProcessed} chats | ` +
          `at ${now.toISOString()}`
        );

      } catch (err) {
        console.error("Cleanup error:", err);
      } finally {
        isRunning = false;
      }
    },
    {
      timezone: "Asia/Kolkata",
      scheduled: true,
      runOnInit: false,
    }
  );
}

module.exports = { startTemporaryGroupCleanupCron };
