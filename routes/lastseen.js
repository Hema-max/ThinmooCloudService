

const express = require("express");
const router = express.Router();

module.exports = (models, syncService) => {

  // 🔹 Get map of devSn -> lastSeen (filtered by community)
  router.get("/map", async (req, res) => {
    try {
      const communityId = req.query.extCommunityId;

      const where = {};
      if (communityId) where.communityId = communityId;

      const records = await models.DeviceLastSeen.findAll({ where });

      const map = {};
      records.forEach((r) => {
        map[r.devSn] = r.lastSeen ? r.lastSeen.toISOString() : null;
      });

      return res.json({ code: 0, data: { map } });
    } catch (err) {
      return res.status(500).json({ code: 1, msg: err.message });
    }
  });

  // 🔹 Manual sync trigger (POST — from frontend)
  router.post("/sync", async (req, res) => {
    try {
      const { communityId, communityUuid } = req.body;
      const token = req.headers.authorization?.replace("Bearer ", ""); // from frontend

      if (!token) {
        return res.status(401).json({ code: 1, msg: "Missing or invalid token" });
      }

      const result = await syncService.runSyncOnce({
        accessToken: token,
        communityId,
        communityUuid,
        pageSize: 1000,
      });

      return res.json({
        code: 0,
        msg: "✅ Sync completed successfully",
        processed: result.processed ?? 0,
      });
    } catch (err) {
      console.error("❌ Manual POST sync error:", err.message);
      return res.status(500).json({ code: 1, msg: err.message });
    }
  });

  // 🔹 Optional — GET version (for Postman or cronjob test)
  router.get("/sync", async (req, res) => {
    try {
      const { accessToken, extCommunityId, extCommunityUuid } = req.query;

      if (!accessToken || !extCommunityId) {
        return res.status(400).json({ code: 1, msg: "Missing accessToken or extCommunityId" });
      }

      const result = await syncService.runSyncOnce({
        accessToken,
        communityId: extCommunityId,
        communityUuid: extCommunityUuid,
        pageSize: 1000,
      });

      return res.json({
        code: 0,
        msg: "✅ Sync completed (GET)",
        processed: result.processed ?? 0,
      });
    } catch (err) {
      console.error("❌ Manual GET sync error:", err.message);
      return res.status(500).json({ code: 1, msg: err.message });
    }
  });

  return router;
};

