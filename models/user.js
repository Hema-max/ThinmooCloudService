const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id:{ type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:{ type: DataTypes.STRING },
    email:{ type: DataTypes.STRING, unique: true },
    password:{ type: DataTypes.STRING }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if(user.password){
          const hash = await bcrypt.hash(user.password, 10);
          user.password = hash;
        }
      }
    }
  });

  User.prototype.comparePassword = function(plain){
    return bcrypt.compare(plain, this.password);
  };

  return User;
};
