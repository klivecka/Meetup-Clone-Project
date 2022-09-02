"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Event extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Event.belongsTo(models.Venue, {
                foreignKey: "venueId",
            });
            Event.belongsTo(models.Group, {
                foreignKey: "groupId",
            });
            Event.hasMany(models.EventImage, {
                foreignKey: "eventId",
            });
            Event.hasMany(models.Attendance, {
                foreignKey: "eventId",
            });
        }
    }
    Event.init(
        {
            venueId: {
                type: DataTypes.INTEGER,
            },
            groupId: {
                type: DataTypes.INTEGER,
            },
            name: {
                type: DataTypes.STRING,
            },
            description: {
                type: DataTypes.STRING,
            },
            type: {
                type: DataTypes.STRING,
            },
            capacity: {
                type: DataTypes.INTEGER,
            },
            price: {
                type: DataTypes.INTEGER,
            },
            startDate: {
                type: DataTypes.DATE,
            },
            endDate: {
                type: DataTypes.DATE,
            },
        },
        {
            sequelize,
            modelName: "Event",
        }
    );
    return Event;
};
