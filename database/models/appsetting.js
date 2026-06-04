'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const AppSetting = sequelize.define('AppSetting', {
    settingKey: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      field: 'setting_key'
    },
    settingValue: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'setting_value'
    }
  }, {
    tableName: 'app_settings',
    underscored: true
  });

  return AppSetting;
};
