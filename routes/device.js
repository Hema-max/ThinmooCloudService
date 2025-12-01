const express = require("express");
const router = express.Router();
const axios = require("axios");
require("dotenv").config();


const BASE_URL = "https://api-cloud.thinmoo.com";

/**
 * 1️⃣ Add Device
 */
router.post("/add", async (req, res) => {
  try {
    const { accessToken, extCommunityId, extCommunityUuid, devSn, name, positionId } = req.body;

    if (!accessToken || !devSn || !extCommunityUuid) {
      return res.status(400).json({ error: "accessToken, extCommunityUuid, and devSn are required" });
    }

    const payload = new URLSearchParams({
      accessToken,
      extCommunityId,
      extCommunityUuid,
      devSn,
      name: name || "",
      positionType: "1",
      positionId: positionId || "",
    });

    const response = await axios.post(`${BASE_URL}/devDevice/extapi/add`, payload.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error adding device:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to add device", details: error.response?.data || error.message });
  }
});

/**
 * 2️⃣ Update Device
 */
router.post("/update", async (req, res) => {
  try {
    const { accessToken, extCommunityId, extCommunityUuid, id, name, positionId } = req.body;

    if (!accessToken || !id) {
      return res.status(400).json({ error: "accessToken and id are required" });
    }

    const payload = new URLSearchParams({
      accessToken,
      extCommunityId,
      extCommunityUuid,
      id,
      name: name || "",
      positionType: "1",
      positionId: positionId || "",
    });

    const response = await axios.post(`${BASE_URL}/devDevice/extapi/update`, payload.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error updating device:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to update device", details: error.response?.data || error.message });
  }
});

/**
 * 3️⃣ Replace Device
 */
router.post("/replace", async (req, res) => {
  try {
    const { accessToken, extCommunityId, extCommunityUuid, oldDevSn, newDevSn } = req.body;

    if (!accessToken || !oldDevSn || !newDevSn) {
      return res.status(400).json({ error: "accessToken, oldDevSn, and newDevSn are required" });
    }

    // Check if new device is already in use
    const checkPayload = new URLSearchParams({ accessToken, devSn: newDevSn });
    const checkResponse = await axios.post(`${BASE_URL}/devDevice/extapi/checkDev`, checkPayload.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (checkResponse.data?.isUsed) {
      return res.status(400).json({ error: "New device is already in use" });
    }

    // Proceed to replace
    const payload = new URLSearchParams({ accessToken, extCommunityId, extCommunityUuid, oldDevSn, newDevSn });
    const response = await axios.post(`${BASE_URL}/devDevice/extapi/replaceDev`, payload.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error replacing device:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to replace device", details: error.response?.data || error.message });
  }
});

router.post("/check", async (req, res) => {
  try {
    const { accessToken, devSn } = req.body;

    if (!accessToken || !devSn) {
      return res.status(400).json({ error: "accessToken and devSn are required" });
    }

    const payload = new URLSearchParams({ accessToken, devSn });

    const response = await axios.post(
      "https://api-cloud.thinmoo.com/devDevice/extapiAdmin/checkDeviceIsExistOrBind",
      payload.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    res.json(response.data); // returns status, communityuuid, communityId
  } catch (err) {
    console.error("Check device error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to check device",
      details: err.response?.data || err.message,
    });
  }
});



/**
 * 4️⃣ Delete Device
 */
router.post("/delete", async (req, res) => {
  try {
    const { accessToken, extCommunityId, extCommunityUuid, devSns, ids, uuids } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: "accessToken is required" });
    }

    const payload = new URLSearchParams({
      accessToken,
      extCommunityId,
      extCommunityUuid,
    });

    if (devSns) payload.append("devSns", devSns);
    if (ids) payload.append("ids", ids);
    if (uuids) payload.append("uuids", uuids);

    const response = await axios.post(`${BASE_URL}/devDevice/extapi/delete`, payload.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error deleting device:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to delete device", details: error.response?.data || error.message });
  }
});

/**
 * 5️⃣ Get Device Details
 */
router.post("/get", async (req, res) => {
  try {
    const { accessToken, extCommunityId, extCommunityUuid, id, uuid, devSn } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: "accessToken is required" });
    }

    const payload = new URLSearchParams({
      accessToken,
      extCommunityId,
      extCommunityUuid,
    });

    if (id) payload.append("id", id);
    if (uuid) payload.append("uuid", uuid);
    if (devSn) payload.append("devSn", devSn);

    const response = await axios.post(`${BASE_URL}/devDevice/extapi/get`, payload.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error getting device details:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch device details", details: error.response?.data || error.message });
  }
});

/**
 * 6️⃣ Get Device List
 */
router.post("/list", async (req, res) => {
  try {
    const {
      accessToken,
      extCommunityId,
      extCommunityUuid,
      name,
      devSn,
      status, // 0 = offline, 1 = online
      currPage = 1,
      pageSize = 10,
    } = req.query;

    if (!accessToken) {
      return res.status(400).json({ code: 400, msg: "accessToken required" });
    }

    // Step 1: Fetch full list from cloud API
    const params = {
      accessToken,
      extCommunityId,
      extCommunityUuid,
      name,
      devSn,
      currPage: 1, // get all pages for filtering
      pageSize: 1000, // assume max per page
    };

    const response = await axios.get(`${BASE_URL}/devDevice/extapi/list`, { params });

    if (response.data.code !== 0) {
      return res.status(500).json({
        code: 500,
        msg: "Cloud API error",
        error: response.data.msg,
      });
    }

    let devices = response.data.data.list || [];

    // Step 2: Local filtering for online/offline
    if (status !== undefined && status !== "") {
      devices = devices.filter(
        (d) => String(d.connectionStatus) === String(status)
      );
    }

    // Step 3: Local pagination
    const totalCount = devices.length;
    const start = (currPage - 1) * pageSize;
    const end = start + Number(pageSize);
    const pagedList = devices.slice(start, end);

    // Step 4: Return formatted response
    res.json({
      code: 0,
      msg: "ok",
      data: {
        totalCount,
        totalPage: Math.ceil(totalCount / pageSize),
        currPage: Number(currPage),
        pageSize: Number(pageSize),
        list: pagedList,
      },
    });
  } catch (err) {
    console.error("Device list error:", err.message);
    res.status(500).json({
      code: 500,
      msg: "Error fetching device list",
      error: err.message,
    });
  }
});



// GET / POST /api/devices/building-units
router.get("/building-units", async (req, res) => {
  try {
    const { accessToken, extCommunityId, extCommunityUuid, currPage = 1, pageSize = 100 } =
      req.query;

    if (!accessToken) {
      return res.status(400).json({ code: 10001, msg: "accessToken is required" });
    }

    if (!extCommunityId && !extCommunityUuid) {
      return res.status(400).json({
        code: 10000,
        msg: "extCommunityId和extCommunityUuid不能同时为空",
      });
    }

    const params = { accessToken, currPage, pageSize };
    if (extCommunityId) params.extCommunityId = extCommunityId;
    if (extCommunityUuid) params.extCommunityUuid = extCommunityUuid;

    const response = await axios.get("https://api-cloud.thinmoo.com/sqBuilding/extapi/list", {
      params,
    });

    return res.json(response.data);
  } catch (error) {
    console.error("Error fetching building units:", error.message);
    return res.status(500).json({ code: 10001, msg: "System error", error: error.message });
  }
});



module.exports = router;
