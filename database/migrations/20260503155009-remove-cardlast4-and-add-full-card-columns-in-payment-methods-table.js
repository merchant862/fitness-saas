'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    
    await queryInterface.removeColumn('payment_methods', 'card_last4');

    await queryInterface.addColumn('payment_methods', 'card_no', {
      allowNull: false,
      type: Sequelize.STRING(255),
    });

    await queryInterface.addColumn('payment_methods', 'expiry_month', {
      allowNull: false,
      type: Sequelize.STRING(255),
    });

    await queryInterface.addColumn('payment_methods', 'expiry_year', {
      allowNull: false,
      type: Sequelize.STRING(255),
    });

    await queryInterface.addColumn('payment_methods', 'cvv', {
      allowNull: false,
      type: Sequelize.STRING(255),
    });
  },

  async down (queryInterface, Sequelize) {
    
    await queryInterface.addColumn('payment_methods', 'card_last4', {
      allowNull: false,
      type: Sequelize.STRING(4),
    });

    await queryInterface.removeColumn('payment_methods', 'card_no');
    await queryInterface.removeColumn('payment_methods', 'expiry_month');
    await queryInterface.removeColumn('payment_methods', 'expiry_year');
    await queryInterface.removeColumn('payment_methods', 'cvv');
  }
};
