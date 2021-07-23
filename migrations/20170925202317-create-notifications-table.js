'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,

      interacted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      type: Sequelize.ENUM('mention', 'thread update', 'reply'),
      UserId: Sequelize.INTEGER
    })
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('notifications');
  }
};
