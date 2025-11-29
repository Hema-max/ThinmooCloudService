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




// backend/models/index.js

const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

// 🔹 Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,           // Required for Railway public DB
        rejectUnauthorized: false // Self-signed certificate
      }
    },
    logging: false, // optional: hide SQL logs
  }
);

// 🔹 Test the connection
sequelize.authenticate()
  .then(() => console.log("✅ PostgreSQL connected successfully!"))
  .catch((err) => console.error("❌ PostgreSQL connection failed:", err));

// 🔹 Initialize db object
const db = {};

// 🔹 Import models

db.DeviceLastSeen = require("./DeviceLastSeen")(sequelize, DataTypes);
// Add more models here as needed
// db.OtherModel = require("./OtherModel")(sequelize, DataTypes);

// 🔹 Setup associations if any
// Example:
// db.User.hasMany(db.DeviceLastSeen, { foreignKey: "userId" });
// db.DeviceLastSeen.belongsTo(db.User, { foreignKey: "userId" });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;



