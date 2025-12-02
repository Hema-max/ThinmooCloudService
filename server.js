

// const express = require('express');
// const cors = require('cors');
// const dotenv = require('dotenv');
// dotenv.config();

// const { sequelize, User } = require('./models');

// // ✅ Import route modules
// const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/user');
// const employeeRoutes = require('./routes/employee');
// const departmentRoutes = require('./routes/department');
// const deviceRoutes = require('./routes/device');

// const app = express();
// app.use(cors());
// app.use(express.json());

// const PORT = process.env.PORT || 5000;

// // ✅ Register routes
// app.use('/api/auth', authRoutes);
// app.use('/api/user', userRoutes);
// app.use('/api/employees', employeeRoutes);
// app.use('/api/departments', departmentRoutes);
// app.use('/api/devices', deviceRoutes);

// // ✅ Load models once
// const models = require('./models');


// // ✅ Global token holder
// let cloudAccessToken = null;

// // ✅ API route: frontend sends token after login
// app.post("/api/set-cloud-token", (req, res) => {
//     const { token } = req.body;
//     if (!token) {
//         return res.status(400).json({ error: "Token missing" });
//     }
//     cloudAccessToken = token;
//     // console.log("✅ Cloud token updated from frontend:", token.slice(0, 8) + "...");
//     res.json({ success: true });
// });

// // ✅ Import and initialize LastSeen service
// const lastSeenServiceFactory = require('./services/lastSeenSync');
// const syncService = lastSeenServiceFactory(models, {
//     cloudBase: process.env.CLOUD_BASE || 'http://localhost:5000',
//     accessTokenGetter: () => cloudAccessToken,
// });



// // --- Place this after syncService is imported ---
// const COMMUNITIES = [
//     { id: process.env.COMMUNITY1_ID, uuid: process.env.COMMUNITY1_UUID },
//     { id: process.env.COMMUNITY2_ID, uuid: process.env.COMMUNITY2_UUID },
//     { id: process.env.COMMUNITY3_ID, uuid: process.env.COMMUNITY3_UUID },
//     { id: process.env.COMMUNITY4_ID, uuid: process.env.COMMUNITY4_UUID },
//     { id: process.env.COMMUNITY5_ID, uuid: process.env.COMMUNITY5_UUID },
// ];
// COMMUNITIES.forEach(c =>
//     syncService.startScheduledJobs({
//         communityId: c.id,
//         communityUuid: c.uuid,
//     })
// );



// // ✅ Mount lastSeen route after syncService initialization
// const lastSeenRoutes = require('./routes/lastseen')(models, syncService);
// app.use('/api/local/lastseen', lastSeenRoutes);

// // ✅ Start server with DB connection
// async function start() {
//     try {
//         await sequelize.authenticate();
//         console.log('✅ Database connected successfully.');

//         await sequelize.sync(); // Creates tables if not exists

//         // 🧩 Create demo user if missing
//         const email = 'demo@example.com';
//         const existing = await User.findOne({ where: { email } });
//         if (!existing) {
//             await User.create({
//                 email,
//                 password: 'Password@123',
//                 name: 'Suresh',
//             });
//             console.log('👤 Demo user created ->', email, 'password: Password@123');
//         }

//         app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
//     } catch (err) {
//         console.error('❌ Failed to start server:', err);
//     }
// }

// start();




const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const db = require('./models');
const { sequelize } = db;

// Route modules
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee');
const departmentRoutes = require('./routes/department');
const deviceRoutes = require('./routes/device');
const lastSeenRoutesFactory = require('./routes/lastseen');
const lastSeenServiceFactory = require('./services/lastSeenSync');

const app = express();

// ----------------------------------------------
// ✅ CORS CONFIGURATION (Netlify + Localhost)
// ----------------------------------------------
app.use(cors({ origin: '*' })); // temporarily allow all
app.set('trust proxy', 1); // if using cookies behind proxies
app.options('*', cors());

// JSON parsing
app.use(express.json());

// Debug
console.log("🚀 Railway PORT =", process.env.PORT);

// ----------------------------------------------
// HEALTH CHECK
// ----------------------------------------------
app.get('/', (req, res) => res.json({ status: 'ok' }));

// ----------------------------------------------
// ROUTES
// ----------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/devices', deviceRoutes);

// ----------------------------------------------
// GLOBAL CLOUD TOKEN STORAGE
// ----------------------------------------------
let cloudAccessToken = null;

app.post("/api/set-cloud-token", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token missing" });

  cloudAccessToken = token;
  res.json({ success: true });
});

// ----------------------------------------------
// LAST SEEN SERVICE SETUP
// ----------------------------------------------
const syncService = lastSeenServiceFactory(db, {
  cloudBase: process.env.BASE_URL,
  accessTokenGetter: () => cloudAccessToken,
});

// Community list
const COMMUNITIES = [
  { id: process.env.COMMUNITY1_ID, uuid: process.env.COMMUNITY1_UUID },
  { id: process.env.COMMUNITY2_ID, uuid: process.env.COMMUNITY2_UUID },
  { id: process.env.COMMUNITY3_ID, uuid: process.env.COMMUNITY3_UUID },
  { id: process.env.COMMUNITY4_ID, uuid: process.env.COMMUNITY4_UUID },
  { id: process.env.COMMUNITY5_ID, uuid: process.env.COMMUNITY5_UUID },
];

// ----------------------------------------------
// ✅ ENABLE LAST SEEN SCHEDULER (IMPORTANT)
// ----------------------------------------------
COMMUNITIES.forEach(c => {
  if (c.id && c.uuid) {
    console.log(`⏳ Starting scheduler for Community ${c.id}`);
    syncService.startScheduledJobs({
      communityId: c.id,
      communityUuid: c.uuid
    });
  }
});

// ----------------------------------------------
// LASTSEEN ROUTES
// ----------------------------------------------
const lastSeenRoutes = lastSeenRoutesFactory(db, syncService);
app.use('/api/local/lastseen', lastSeenRoutes);

// ----------------------------------------------
// START SERVER
// ----------------------------------------------
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');

    await sequelize.sync({ alter: true });
    console.log('✅ Tables synced');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 Backend running on port ${PORT}`)
    );

  } catch (err) {
    console.error('❌ Server start failed:', err);
  }
}

start();
