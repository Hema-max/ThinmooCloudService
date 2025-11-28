// models/employee.js
module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define('Employee', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    uuid: { type: DataTypes.STRING(64) },
    empNo: { type: DataTypes.STRING(64), field: 'emp_no' },
    name: { type: DataTypes.STRING(200) },
    cardNo: { type: DataTypes.STRING(200), field: 'card_no' }, // staff pass id
    dept: { type: DataTypes.STRING(200) },
    deptId: { type: DataTypes.INTEGER, field: 'dept_id' },
    job: { type: DataTypes.STRING(200) },
    phone: { type: DataTypes.STRING(50) },
    gender: { type: DataTypes.TINYINT },
    createtime: { type: DataTypes.DATE },
    updatetime: { type: DataTypes.DATE },
    faceImages: { type: DataTypes.TEXT, field: 'face_images' }
  }, {
    tableName: 'employees',
    timestamps: false
  });

  return Employee;
};
