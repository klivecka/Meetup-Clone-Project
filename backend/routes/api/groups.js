const express = require("express");
const router = express.Router();
const { requireAuth } = require("../../utils/auth");
const { Group, User, Membership, GroupImage } = require("../../db/models");
const { validateLogin } = require("./session");
const { restoreUser } = require("../../utils/auth");
const groupimage = require("../../db/models/groupimage");
const group = require("../../db/models/group");
// const validateLogin = require("./session")

//GET ALL GROUPS ORGANIZED AND JOINED BY CURRENT USER
router.get("/current", restoreUser, async (req, res, next) => {
    const { user } = req;
    const groupArray = [];
    if (user) {
        const userId = user.toSafeObject().id;
        const groupsOrg = await Group.findAll({
            where: {
                organizerId: userId,
            },
        });
        groupArray.push(...groupsOrg);

        const groupIds = await Membership.findAll({
            attributes: ["groupId"],
            where: {
                userId: userId,
            },
        });

        for (groupId of groupIds) {
            let id = groupId.groupId;
            let group = await Group.findByPk(id);
            groupArray.push(group);
        }

        // console.log('groupIdx', groupIds)

        // groupArray.push(groupsMem);

        res.json(groupArray);
    }
});

//GET GROUP DETAILS BY GROUP ID
router.get("/:groupId", async (req, res, next) => {
    const groupId = req.params.groupId;
    const groupArray = [];
    const group = await Group.findByPk(groupId, {
        include: [
            {
                model: GroupImage,
            },
        ],
    });
    const user = await User.findOne({
        attributes: ["id"],
        where: {
            id: group.organizerId,
        },
    });
    groupArray.push(group, user)
    res.json(groupArray);
});

//EDIT A GROUP
router.put("/:groupId", async (req, res, next) => {
    const { name, about, type, private, city, state } = req.body;
    const groupId = req.params.groupId;

    const group = await Group.findByPk(groupId);

    group.set({
        name: name,
        about: about,
        type: type,
        private: private,
        city: city,
        state: state,
    });
    res.json(group);
});

//GET ALL GROUPS
router.get("/", async (req, res, next) => {
    const groups = await Group.findAll({});
    res.json(groups);
});

//CREATE A GROUP
router.post("/", restoreUser, async (req, res, next) => {
    const { user } = req;
    const { name, about, type, private, city, state } = req.body;
    if (user) {
        const userId = user.toSafeObject().id;
        // console.log(req.body)
        const newGroup = Group.build({
            organizerId: userId,
            name: name,
            about: about,
            type: type,
            private: private,
            city: city,
            state: state,
        });
        await newGroup.save();
        res.json(newGroup);
    }
});

module.exports = router;
