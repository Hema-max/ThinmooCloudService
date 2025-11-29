// const { Sequelize, DataTypes } = require("sequelize");
// require("dotenv").config();

// // ✅ Create Sequelize instance
// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASS,
//   {
//     host: process.env.DB_HOST,
//     port: 1433, // ✅ explicitly define port
//     dialect: "mssql",
//     dialectOptions: {
//       options: {
//         encrypt: false,
//         trustServerCertificate: true,
//       },
//     },
//     logging: false,
//   }
// );


// // ✅ Test the database connection
// sequelize
//   .authenticate()
//   .then(() => console.log("✅ Database connected successfully"))
//   .catch((err) => console.error("❌ Database connection failed:", err));

// // ✅ Export models and sequelize
// const db = {};
// db.Sequelize = Sequelize;
// db.sequelize = sequelize;

// // Import models here (add yours as needed)
// db.User = require("./user")(sequelize, DataTypes);
// db.DeviceLastSeen = require("./DeviceLastSeen")(sequelize, DataTypes);

// module.exports = db;



const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === 'production';
const isRailway = !!process.env.RAILWAY_STATIC_URL;

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: (isProduction || isRailway)
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
    retry: { max: 3 },
  }
);

sequelize.authenticate()
  .then(() => console.log(`✅ PostgreSQL connected (${isRailway ? 'internal' : 'public'} host)`))
  .catch(err => console.error("❌ PostgreSQL connection failed:", err));

const db = {};
db.DeviceLastSeen = require("./DeviceLastSeen")(sequelize, DataTypes);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
