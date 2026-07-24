const express = require("express");

const router = express.Router();

const {
    createProgress,
    getStudentProgress,
    getProgressByStudentId,
    updateStageStatus
} = require("../controllers/progressController");

const { protect,adminOnly } = require("../middleware/authMiddleware");


// Student
router.get(
    "/my-progress",
    protect,
    getStudentProgress
);


// Admin
router.post(
    "/create",
    protect,
    adminOnly,
    createProgress
);

router.get(
    "/:studentId",
    protect,
    adminOnly,
    getProgressByStudentId
);

router.patch(
    "/:id",
    protect,
    adminOnly,
    updateStageStatus
);

module.exports = router;