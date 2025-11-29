// module.exports = (sequelize, DataTypes) => {
//   const DeviceLastSeen = sequelize.define('DeviceLastSeen', {
//     devSn: { type: DataTypes.STRING, allowNull: false },
//     lastStatus: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
//     lastSeen: { type: DataTypes.DATE, allowNull: true },
//     communityId: { type: DataTypes.STRING, allowNull: true },
//     communityUuid: { type: DataTypes.STRING, allowNull: true },
//   }, {
//     tableName: 'DeviceLastSeens',
//     timestamps: true,
//     indexes: [
//       {
//         unique: true,
//         fields: ['devSn', 'communityId'],
//       },
//     ],
//   });

//   return DeviceLastSeen;
// };





module.exports = (sequelize, DataTypes) => {
  return sequelize.define('DeviceLastSeen', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    devSn: { type: DataTypes.STRING, allowNull: false },
    lastStatus: { type: DataTypes.INTEGER, defaultValue: 1 },
    lastSeen: { type: DataTypes.DATE, allowNull: true },
    communityId: { type: DataTypes.STRING, allowNull: true },
    communityUuid: { type: DataTypes.STRING, allowNull: true },
  }, {
    tableName: 'DeviceLastSeens',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['devSn', 'communityId'],
      },
    ],
  });
};
