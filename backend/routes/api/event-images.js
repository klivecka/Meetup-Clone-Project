const express = require("express");
const router = express.Router();
const { requireAuth, restoreUser, validGroup } = require("../../utils/auth");
const { Op } = require("sequelize");
const {
    Group,
    User,
    Membership,
    GroupImage,
    Venue,
    Event,
    EventImage,
    Attendance,
} = require("../../db/models");

//DELETE AN IMAGE FROM AN EVENT

router.delete(
    "/:eventImageId",
    [restoreUser, requireAuth],
    async (req, res, next) => {
        const { user } = req;
        const userId = user.toSafeObject().id;
        const eventImageId = req.params.eventImageId

        const image = await EventImage.scope("delete").findByPk(eventImageId)
        const eventId = image.eventId
        const event = await Event.findByPk(eventId)
        const groupId = event.groupId

        const group = await Group.findByPk(groupId)

        //check if user is co-host
        const groupMembers = await Membership.findAll({
            where: {
                groupId: groupId,
            },
        });

        let isCoHost = false;
        for (member of groupMembers) {
            if (userId === member.userId && member.status === "co-host") {
                isCoHost = true;
            }
        }

        if (userId !== group.organizerId && !isCoHost) {
            res.status(403);
            res.json({
                message:
                    "Forbidden. User must be organizer or co-host of the group",
                statusCode: 403,
            });
        }

        

        await image.destroy()

        res.json({
            "message": "Successfully deleted",
            "statusCode": 200
          })
    }
);


//DELETE A GROUP
router.delete(
    "/:groupId",
    [restoreUser, requireAuth, validGroup],
    async (req, res, next) => {
        const { user } = req;
        const userId = user.toSafeObject().id;
        const groupId = req.params.groupId;
        const group = res.group
        
        if (userId !== group.organizerId) {
            res.status(403);
            res.json({
                message:
                    "Forbidden. User must be organizer of the group",
                statusCode: 403,
            });
        }

        await group.destroy();

        res.json({
            message: "Successfully deleted",
        });
    }
);









module.exports = router;