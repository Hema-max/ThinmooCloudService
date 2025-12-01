
const cron = require("node-cron");
const axios = require("axios");
const { Op } = require("sequelize");

module.exports = (models, options = {}) => {
    const DeviceLastSeen = models.DeviceLastSeen;
    const cloudBase = options.cloudBase || "https://thinmoocloudservice-production.up.railway.app";
    const accessTokenGetter = options.accessTokenGetter || (() => process.env.CLOUD_TOKEN);

    // --- Time window helpers ---
    const insideMorningWindow = (dt = new Date()) => {
        const h = dt.getHours();
        return h >= 9 && h < 10; // 9:00–9:59 AM
    };

    const insideEveningWindow = (dt = new Date()) => {
        const h = dt.getHours();
        const m = dt.getMinutes();
        return (h >= 16 && h < 18) || (h === 18 && m <= 30); // 4:00–6:30 PM
    };

    const shouldProcessNow = () => {
        const now = new Date();
        return insideMorningWindow(now) || insideEveningWindow(now);
    };

    // --- Fetch devices from cloud ---
    // inside services/lastSeenSync.js
    const fetchCloudDevices = async (
        page = 1,
        pageSize = 1000,
        accessToken,
        communityId,
        communityUuid,
        filters = {}
    ) => {
        try {
            console.log('accessToken', accessToken);
            const res = await axios.get(`${cloudBase}/api/devices/list`, {
                params: {
                    accessToken,
                    extCommunityId: communityId,
                    extCommunityUuid: communityUuid,
                    currPage: page,
                    pageSize,
                    ...filters,
                },
            });

            if (res.data?.code === 0 && res.data.data?.list) {
                return {
                    list: res.data.data.list,
                    totalCount: res.data.data.totalCount || 0,
                };
            }
            return { list: [], totalCount: 0 };
        } catch (err) {
            // better logging so we can see server payload and status
            console.error("❌ Error fetching cloud devices:",
                err.message,
                err.response?.status ? `status=${err.response.status}` : "",
                err.response?.data ? `body=${JSON.stringify(err.response.data)}` : "",
            );
            return { list: [], totalCount: 0 };
        }
    };


    const runSyncOnce = async ({ accessToken, communityId, communityUuid, pageSize = 1000 } = {}) => {
        try {
            if (!accessToken) {
                accessToken = accessTokenGetter();
                console.log("🔑 Using latest accessToken:", accessToken ? accessToken.slice(0, 8) + "..." : "null");
            }

            console.log(`🚀 Running LastSeen sync for Community ${communityId}...`);

            // 1️⃣ Fetch ALL devices from Cloud (with pagination)
            const { list, totalCount } = await fetchCloudDevices(
                1,
                pageSize,
                accessToken,
                communityId,
                communityUuid
            );

            let devices = list || [];
            if (totalCount > pageSize) {
                const totalPages = Math.ceil(totalCount / pageSize);
                for (let p = 2; p <= totalPages; p++) {
                    const next = await fetchCloudDevices(p, pageSize, accessToken, communityId, communityUuid);
                    devices.push(...(next.list || []));
                }
            }

            const now = new Date();
            const validDevices = devices.filter(d => d && d.devSn);
            const cloudDevSns = validDevices.map(d => d.devSn);

            console.log(`📡 Cloud returned ${cloudDevSns.length} devices`);

            // 2️⃣ Load ALL local records for this community
            const localRecords = await DeviceLastSeen.findAll({ where: { communityId } });

            // 🚫 SAFETY: Never perform deletion if cloud returned zero devices
            if (cloudDevSns.length === 0) {
                console.log("⚠️ Cloud returned 0 devices. SKIPPING delete to avoid wiping local DB.");
            } else {
                // Convert cloud list to Set for fast lookup
                const cloudDevSet = new Set(cloudDevSns);

                // Identify devices to delete
                const deleteSns = localRecords
                    .map(r => r.devSn)
                    .filter(sn => !cloudDevSet.has(sn));  // safe lookup

                if (deleteSns.length > 0) {
                    console.log(`🗑️ Deleting ${deleteSns.length} stale devices...`);

                    await DeviceLastSeen.destroy({
                        where: {
                            communityId,
                            devSn: deleteSns
                        }
                    });
                }
            }

            // 3️⃣ Reload fresh local records AFTER deletion
            const freshLocalRecords = await DeviceLastSeen.findAll({ where: { communityId } });

            const localMap = {};
            freshLocalRecords.forEach(r => {
                localMap[r.devSn] = r.get({ plain: true });
            });

            // 4️⃣ Process each cloud device
            for (const d of validDevices) {
                const devSn = d.devSn;
                const currentStatus = Number(d.connectionStatus); // 0=offline, 1=online
                const existing = localMap[devSn];

                let newLastSeen = existing?.lastSeen || null;
                let updateNeeded = false;

                // --- Your EXACT stable logic ---
                if (currentStatus === 1) {
                    // Online → clear lastSeen
                    if (existing?.lastSeen) {
                        newLastSeen = null;
                        updateNeeded = true;
                    }
                } else if (currentStatus === 0) {
                    // Offline → set timestamp only ONCE (first time going offline)
                    if (!existing?.lastSeen) {
                        newLastSeen = now;
                        updateNeeded = true;
                    }
                }

                // 5️⃣ Update or Insert into DB
                if (existing) {
                    const updates = {};
                    if (existing.lastStatus !== currentStatus) updates.lastStatus = currentStatus;
                    if (updateNeeded) updates.lastSeen = newLastSeen;

                    if (Object.keys(updates).length > 0) {
                        await DeviceLastSeen.update(updates, { where: { id: existing.id } });
                    }
                } else {
                    // NEW device → create record
                    await DeviceLastSeen.create({
                        devSn,
                        communityId,
                        communityUuid,
                        lastStatus: currentStatus,
                        lastSeen: newLastSeen,
                    });
                }
            }

            console.log(`✅ LastSeen Sync Complete @ ${now.toISOString()} | Processed ${validDevices.length} devices`);
            return { processed: validDevices.length };

        } catch (err) {
            console.error("❌ runSyncOnce error:", err);
            return { processed: 0, error: err.message };
        }
    };



    // const runSyncOnce = async ({ accessToken, communityId, communityUuid, pageSize = 1000 } = {}) => {
    //     try {
    //         //if (!accessToken) accessToken = accessTokenGetter();

    //         if (!accessToken) {
    //             accessToken = accessTokenGetter();
    //             console.log("🔑 Using latest accessToken from getter:", accessToken ? accessToken.slice(0, 8) + "..." : "null");
    //         }


    //         console.log(`🚀 Running LastSeen sync for Community ${communityId}...`);

    //         // 1️⃣ Fetch all devices from cloud
    //         const { list, totalCount } = await fetchCloudDevices(
    //             1,
    //             pageSize,
    //             accessToken,
    //             communityId,
    //             communityUuid
    //         );

    //         let devices = list || [];
    //         if (totalCount > pageSize) {
    //             const totalPages = Math.ceil(totalCount / pageSize);
    //             for (let p = 2; p <= totalPages; p++) {
    //                 const next = await fetchCloudDevices(p, pageSize, accessToken, communityId, communityUuid);
    //                 devices.push(...(next.list || []));
    //             }
    //         }

    //         const now = new Date();
    //         const validDevices = devices.filter(d => d && d.devSn);
    //         const devSns = validDevices.map(d => d.devSn);

    //         // 2️⃣ Load local records
    //         const where = { devSn: { [Op.in]: devSns } };
    //         if (communityId) where.communityId = communityId;
    //         const localRecords = await DeviceLastSeen.findAll({ where });

    //         const localMap = {};
    //         localRecords.forEach(r => localMap[r.devSn] = r.get({ plain: true }));

    //         // 3️⃣ Process each device
    //         for (const d of validDevices) {
    //             const devSn = d.devSn;
    //             const currentStatus = Number(d.connectionStatus); // 0=offline, 1=online
    //             const existing = localMap[devSn];

    //             let newLastSeen = existing?.lastSeen || null;
    //             let updateNeeded = false;
    //             const wasOnline = existing?.lastStatus === 1;
    //             const wasOffline = existing?.lastStatus === 0;

    //             // --- Your exact logic ---
    //             if (currentStatus === 1) {
    //                 // If now online → clear lastSeen
    //                 if (existing?.lastSeen) {
    //                     newLastSeen = null;
    //                     updateNeeded = true;
    //                 }
    //             } else if (currentStatus === 0) {
    //                 // If now offline → set lastSeen only first time it goes offline
    //                 if (!existing?.lastSeen) {
    //                     newLastSeen = now;
    //                     updateNeeded = true;
    //                 }
    //             }

    //             // 4️⃣ Save to DB
    //             if (existing) {
    //                 const updates = {};
    //                 if (existing.lastStatus !== currentStatus) updates.lastStatus = currentStatus;
    //                 if (updateNeeded) updates.lastSeen = newLastSeen;

    //                 if (Object.keys(updates).length > 0) {
    //                     await DeviceLastSeen.update(updates, { where: { id: existing.id } });
    //                 }
    //             } else {
    //                 await DeviceLastSeen.create({
    //                     devSn,
    //                     communityId,
    //                     communityUuid,
    //                     lastStatus: currentStatus,
    //                     lastSeen: newLastSeen,
    //                 });
    //             }
    //         }

    //         console.log(`✅ LastSeen Sync Done @ ${now.toISOString()} | Processed ${devices.length} devices`);
    //         return { processed: devices.length };

    //     } catch (err) {
    //         console.error("❌ runSyncOnce error:", err.message);
    //         return { processed: 0, error: err.message };
    //     }
    // };




    // --- Schedule cron jobs ---



    const startScheduledJobs = ({ communityId, communityUuid, pageSize = 1000 } = {}) => {
        console.log(`⏰ Scheduling LastSeen sync for Community ${communityId}`);

        // morning 9–9:59
        cron.schedule("*/1 9 * * *", async () => {
            try {
                console.log(`🕘 Morning sync triggered for ${communityId}`);
                await runSyncOnce({ communityId, communityUuid, pageSize });
            } catch (err) {
                console.error("❌ Morning sync error:", err.message);
            }
        }, {
            timezone: "Asia/Singapore"
        });

        // evening 4–6:30 PM
        cron.schedule("*/1 16-18 * * *", async () => {
            try {
                const now = new Date();
                if (now.getHours() === 18 && now.getMinutes() > 30) return;
                console.log(`🌇 Evening sync triggered for ${communityId}`);
                await runSyncOnce({ communityId, communityUuid, pageSize });
            } catch (err) {
                console.error("❌ Evening sync error:", err.message);
            }
        }, {
            timezone: "Asia/Singapore"
        });

        console.log("🟢 LastSeen scheduled jobs started (9–10 AM & 4–6:30 PM)");
    };

    return { startScheduledJobs, runSyncOnce, fetchCloudDevices };
};
