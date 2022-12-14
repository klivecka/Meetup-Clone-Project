"use strict";
const { Model, Validator } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Group extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Group.belongsTo(models.User, {
                foreignKey: "organizerId",
            });
            Group.hasMany(models.Membership, {
                foreignKey: "groupId",
            });
            Group.hasMany(models.GroupImage, {
                foreignKey: "groupId",
            });
            Group.hasMany(models.Venue, {
                foreignKey: "groupId",
            });
            Group.hasMany(models.Event, {
                foreignKey: "groupId",
            });
        }
    }
    Group.init(
        {
            name: {
                type: DataTypes.STRING,
                validate: {
                    len: {
                        args: [0, 60],
                        msg: "Name must be 60 characters or less",
                    },
                },
            },
            organizerId: {
                type: DataTypes.INTEGER,
            },
            about: {
                type: DataTypes.STRING,
                validate: {
                    len: [50, 5000],
                },
            },
            type: {
                type: DataTypes.STRING,
                validate: {
                    validType() {
                        if (
                            this.type !== "Online" &&
                            this.type !== "In person"
                        ) {
                            throw new Error(
                                "Type must be 'Online' or 'In person'"
                            );
                        }
                    },
                },
            },
            private: {
                type: DataTypes.BOOLEAN,
            },
            city: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            state: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            numMembers: {
                type: DataTypes.INTEGER,
            },
        },
        {
            sequelize,
            modelName: "Group",
            scopes: {
                editGroup: {
                    attributes: {
                        exclude: ["numMembers"],
                    },
                },
            },
        }
    );
    return Group;
};
