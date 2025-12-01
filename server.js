

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

const db = require('./models'); // sequelize and models
const { sequelize } = db;

// Routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee');
const departmentRoutes = require('./routes/department');
const deviceRoutes = require('./routes/device');
const lastSeenRoutesFactory = require('./routes/lastseen');
const lastSeenServiceFactory = require('./services/lastSeenSync');

const app = express();
// app.use(cors());
app.use(cors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE",
    credentials: false,
}));
app.use(express.json());
app.options('*', cors());


console.log("🚀 Using Railway PORT =", process.env.PORT);


const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => res.json({ status: 'ok' }));


// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/devices', deviceRoutes);


sequelize.authenticate()
    .then(() => console.log("Connected to PostgreSQL"))
    .catch(err => {
        console.error("❌ Sequelize Connection Error:", err);
    });


console.log("ENV DEBUG:", {
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASS: process.env.DB_PASS ? "****" : "EMPTY",
    DB_HOST: process.env.DB_HOST,
});


// Global cloud token
let cloudAccessToken = null;
app.post("/api/set-cloud-token", (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token missing" });
    cloudAccessToken = token;
    res.json({ success: true });
});

// Initialize LastSeen service
const syncService = lastSeenServiceFactory(db, {
    cloudBase:  process.env.BASE_URL, 
    accessTokenGetter: () => cloudAccessToken,
});

// Communities
const COMMUNITIES = [
    { id: process.env.COMMUNITY1_ID, uuid: process.env.COMMUNITY1_UUID },
    { id: process.env.COMMUNITY2_ID, uuid: process.env.COMMUNITY2_UUID },
    { id: process.env.COMMUNITY3_ID, uuid: process.env.COMMUNITY3_UUID },
    { id: process.env.COMMUNITY4_ID, uuid: process.env.COMMUNITY4_UUID },
    { id: process.env.COMMUNITY5_ID, uuid: process.env.COMMUNITY5_UUID },
];

// ✅ Start server
async function start() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected successfully.');

        await sequelize.sync({ alter: true });
        console.log('✅ Tables synced');

        // Start scheduled LastSeen jobs
        // COMMUNITIES.forEach(c =>
        //     syncService.startScheduledJobs({ communityId: c.id, communityUuid: c.uuid })
        // );

        // Mount LastSeen routes
        const lastSeenRoutes = lastSeenRoutesFactory(db, syncService);
        app.use('/api/local/lastseen', lastSeenRoutes);

        app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
    } catch (err) {
        console.error('❌ Failed to start server:', err);
    }
}

start();



