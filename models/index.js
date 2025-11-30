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

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,     // postgres.railway.internal
    port: process.env.DB_PORT,     // 5432
    dialect: "postgres",
    logging: false,

    // ❗ IMPORTANT: Railway internal DB does NOT use SSL
    dialectOptions: {
      ssl: false
    }
  }
);

sequelize.authenticate()
  .then(() => console.log("✅ PostgreSQL connected successfully"))
  .catch(err => console.error("❌ PostgreSQL connection failed:", err));

const db = {};
db.DeviceLastSeen = require("./DeviceLastSeen")(sequelize, DataTypes);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
