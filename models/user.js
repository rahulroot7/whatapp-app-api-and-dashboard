'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: DataTypes.STRING,
    role: {
      type: DataTypes.ENUM('user', 'business_user', 'admin', 'super_admin'),
      defaultValue: 'user',
    },
    status: {
      type: DataTypes.ENUM('0', '1', '2'),
      defaultValue: '0',
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    paranoid: true,
    timestamps: true,
  });

  return User;
};
