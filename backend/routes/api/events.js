const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const {
    Group,
    User,
    Membership,
    GroupImage,
    Venue,
    Event,
    Attendance,
    EventImage,
} = require("../../db/models");
const { validateLogin } = require("./session");
const { restoreUser, requireAuth, validEvent } = require("../../utils/auth");
// const e = require("express");

//GET ALL EVENTS
router.get("/", async (req, res, next) => {
    const events = await Event.findAll({
        include: [
            {
                model: Group,
                attributes: ["id", "name", "city", "state"],
            },
            {
                model: Venue,
                attributes: ["id", "city", "state"],
            },
        ],
    });
    let resultObj = {};
    let result = [];
    for (let i = 0; i < events.length; i++) {
        let attCount = 0;
        let event = events[i].toJSON();
        let eventId = event.id;
        const attendRows = await Attendance.findAll({
            where: {
                eventId: eventId,
                status: "member",
            },
        });
        attCount = attendRows.length;
        event.numAttending = attCount;
        const eventImg = await EventImage.findOne({
            where: {
                eventId: eventId,
                preview: true,
            },
        });

        if (!eventImg) {
            event.previewImage = null;
        } else event.previewImage = eventImg.url;
        result.push(event);
    }
    resultObj.Events = result;
    res.json(resultObj);
});

//GET DETAILS OF AN EVENT SPECIFIED BY EVENT ID

router.get("/:eventId", async (req, res, next) => {
    const eventId = req.params.eventId;
    const eventDeets = await Event.scope("eventDetails").findOne({
        where: {
            id: eventId,
        },
        include: [
            {
                model: Group,
                attributes: ["id", "name", "private", "city", "state"],
            },
            {
                model: Venue,
                attributes: ["id", "address", "city", "state", "lat", "lng"],
            },
            {
                model: EventImage,
                as: "EventImages",
                attributes: ["id", "url", "preview"],
            },
        ],
    });
    if (!eventDeets) {
        res.status(404);
        res.json({
            message: "Event couldn't be found",
            statusCode: 404,
        });
    }

    let result = [];

    let attCount = 0;
    let event = eventDeets.toJSON();
    const attendRows = await Attendance.findAll({
        where: {
            eventId: eventId,
            status: "member",
        },
    });
    attCount = attendRows.length;
    event.numAttending = attCount;

    res.json(event);
});

//ADD AN IMAGE TO AN EVENT BASED ON EVENT ID
router.post(
    "/:eventId/images",
    [restoreUser, requireAuth],
    async (req, res, next) => {
        const { user } = req;
        const userId = user.toSafeObject().id;
        const eventId = req.params.eventId;
        const { url, preview } = req.body;
        const eventCheck = await Event.findByPk(eventId);
        if (!eventCheck) {
            res.status(404);
            return res.json({
                message: "Event couldn't be found",
                statusCode: 404,
            });
        }
        const attendData = await Attendance.findAll({
            where: {
                eventId: eventId,
            },
        });
        userIds = attendData.map((user) => user.userId);

        if (!userIds.includes(userId)) {
            res.status(403);
            return res.json({
                message:
                    "Forbidden, User must be an attendee of the event to add an image",
                statusCode: 403,
            });
        }

        const newEventImage = EventImage.build({
            eventId: eventId,
            url: url,
            preview: preview,
        });

        await newEventImage.save();
        const imgRes = await EventImage.findOne({
            where: {
                id: newEventImage.id,
            },
        });
        res.json(imgRes);
    }
);

//EDIT AN EVENT
router.put("/:eventId", [restoreUser, requireAuth], async (req, res, next) => {
    const eventId = req.params.eventId;
    const { user } = req;
    const userId = user.toSafeObject().id;
    const {
        venueId,
        name,
        type,
        capacity,
        price,
        description,
        startDate,
        endDate,
    } = req.body;
    const eventCheck = await Event.findByPk(eventId);
    if (!eventCheck) {
        res.status(404),
            res.json({
                message: "Event couldn't be found",
                statusCode: 404,
            });
    }

    const errors = {};
    const venueCheck = await Venue.findByPk(venueId);
    if (!venueCheck) {
        errors.venueId = "Venue does not exist";
    }
    if (name.length < 5) {
        errors.name = "Name must be at least 5 characters";
    }
    if (type !== "Online" && type !== "In person") {
        errors.type = "Type must be Online or In person";
    }
    if (!Number.isInteger(capacity)) {
        errors.capacity = "Capacity must be an integer";
    }
    let priceString = price.toString();
    let priceSplit = priceString.split(".");
    if (!priceString.includes(".") || priceSplit[1].length > 2) {
        errors.price = "Price is invalid";
    }
    if (!description) {
        errors.description = "Description is required";
    }
    let date = new Date();
    let startDateConvert = new Date(startDate);
    if (startDateConvert < date) {
        errors.startDate = "Start date must be in the future";
    }
    if (endDate < startDate) {
        errors.endDate = "End date is less than start date";
    }
    if (Object.keys(errors).length) {
        res.status(400);
        res.json({
            message: "Validation Error",
            statusCode: 400,
            errors: errors,
        });
    }

    eventCheck.set({
        venueId: venueId,
        name: name,
        type: type,
        capacity: capacity,
        price: price,
        description: description,
        startDate: startDate,
        endDate: endDate,
    });
    await eventCheck.save();
    const event = await Event.scope("eventDetails").findByPk(eventId);
    res.json(event);
});

//REQUEST ATTENDANCE TO AN EVENT BASED ON EVENT ID ********************
router.post(
    "/:eventId/attendance",
    [restoreUser, requireAuth, validEvent],
    async (req, res, next) => {
        const event = res.event;
        const eventId = req.params.eventId;
        const groupId = event.groupId;
        const { user } = req;
        const requestId = user.toSafeObject().id;
        const { userId } = req.body;

        //check if requestor is member of the group
        const groupMember = await Membership.findOne({
            where: {
                groupId: groupId,
                userId: requestId,
            },
        });
        //error message for no requestor group member
        if (!groupMember) {
            res.status(403);
            res.json({
                message: "Forbidden",
                statusCode: 403,
            });
        }

        //check to see if request already exists
        const attendance = await Attendance.findOne({
            where: {
                eventId: eventId,
                userId: userId,
            },
        });

        if (attendance) {
            if (attendance.status === "pending") {
                res.status(400);
                return res.json({
                    message: "Attendance has already been requested",
                    statusCode: 400,
                });
            }
            if (attendance.status === "member") {
                res.status(400);
                return res.json({
                    message: "User is already an attendee of the event",
                    statusCode: 400,
                });
            }
        }

        const attendRes = Attendance.build({
            eventId: eventId,
            userId: userId,
            status: "pending",
        });
        await attendRes.save();

        const attendResObj = await Attendance.findOne({
            where: {
                eventId: eventId,
                userId: userId,
            },
        });

        res.json(attendResObj);
    }
);

//CHANGE STATUS OF ATTENDANCE ********************
router.put(
    "/:eventId/attendance",
    [restoreUser, requireAuth, validEvent],
    async (req, res, next) => {
        const { user } = req;
        const requestorId = user.toSafeObject().id;
        const eventId = req.params.eventId;
        const event = res.event;
        const groupId = event.groupId;
        const { userId, status } = req.body;
        //authorization
        //user must be organizer
        const groupCheck = await Group.findByPk(groupId);
        const coHostCheck = await Membership.findOne({
            where: {
                groupId: groupId,
                userId: requestorId,
                status: "co-host",
            },
        });

        if (requestorId !== groupCheck.organizerId && !coHostCheck) {
            res.status(403);
            res.json({
                message: "Forbidden",
                statusCode: 403,
            });
        }

        //cannot change status to pending error
        if (status === "pending") {
            res.status(400);
            res.json({
                message: "Cannot change an attendance status to pending",
                statusCode: 400,
            });
        }

        const attendance = await Attendance.findOne({
            where: {
                eventId: eventId,
                userId: userId,
            },
        });

        //no attendance error
        if (!attendance) {
            res.status(404);
            res.json({
                message:
                    "Attendance between the user and the event does not exist",
                statusCode: 404,
            });
        }

        await attendance.set({
            userId: userId,
            status: status,
        });

        await attendance.save();

        // attendRes = await Attendance.findOne({
        //     where: {
        //         eventId: eventId,
        //         userId: userId,
        //     },
        // })

        const attendRes = await Attendance.findOne({
            where: {
                userId: userId,
                eventId: eventId
            }
        })

        res.json(attendRes);
    }
);

//GET ALL ATTENDEEDS OF AN EVENT ********************
router.get("/:eventId/attendees", validEvent, async (req, res, next) => {
    const eventId = req.params.eventId;
    const attendees = await Attendance.findAll({
        where: {
            eventId: eventId,
        },
    });

    let resObj = {};
    let resArray = [];

    for (attendee of attendees) {
        let attendeeObj = attendee.toJSON();

        let user = await User.findOne({
            attributes: ["id", "firstName", "lastName"],
            where: {
                id: attendeeObj.userId,
            },
        });
        let userObj = user.toJSON();
        userObj.Attendance = { status: attendeeObj.status };
        resArray.push(userObj);
    }
    resObj.Attendees = resArray;

    res.json(resObj);
});

//DELETE EVENT
router.delete(
    "/:eventId",
    [restoreUser, requireAuth, validEvent],
    async (req, res, next) => {
        const { user } = req;
        const userId = user.toSafeObject().id;
        const eventId = req.params.eventId;

        const event = await Event.findByPk(eventId);
        const groupId = event.groupId;
        const group = await Group.findByPk(groupId);
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

        await event.destroy();

        res.json({
            message: "Successfully deleted",
        });
    }
);

//DELETE ATTENDANCE
router.delete(
    "/:eventId/attendance",
    [restoreUser, requireAuth, validEvent],
    async (req, res, next) => {
        const eventId = req.params.eventId;
        const { memberId } = req.body;
        const { user } = req;
        const event = res.event;
        const userId = user.toSafeObject().id;
  
        const attendance = await Attendance.findOne({
            where: {
                eventId: eventId,
                userId: memberId,
            },
        });

        if (!attendance) {
            res.status(404);
            res.json({
                message: "Attendance does not exist for this User",
                statusCode: 404,
            });
        }

        //get group Id and find if user is organizer of group
        //or if user is the current attendance to be deleted
        const groupId = event.groupId;
        const group = await Group.findByPk(groupId);
        if (userId !== group.organizerId && userId !== memberId) {
            res.status(403);
            res.json({
                message: "Only the User or organizer may delete an Attendance",
                statusCode: 403,
            });
        }

        await attendance.destroy();

        res.json({
            message: "Successfully deleted attendance from event",
        });
    }
);
module.exports = router;
