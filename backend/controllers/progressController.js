const ApplicationProgress = require("../models/ApplicationProgress");

// ===============================
// Get Student Progress
// ===============================
const getStudentProgress = async (req, res) => {
    try {

        const progress = await ApplicationProgress
            .findOne({ student: req.user._id })
            .populate("student", "name email phone");

        if (!progress) {
            return res.status(404).json({
                success: false,
                message: "Progress not found."
            });
        }

        res.status(200).json({
            success: true,
            progress
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};



// ===============================
// Create Progress
// Admin Only
// ===============================
const createProgress = async (req, res) => {

    try {

        const { student } = req.body;

        const exists = await ApplicationProgress.findOne({ student });

        if (exists) {
            return res.status(400).json({
                success: false,
                message: "Progress already exists."
            });
        }

        const progress = await ApplicationProgress.create({
            student
        });

        res.status(201).json({
            success: true,
            message: "Progress created successfully.",
            progress
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};



// ===============================
// Admin Update Stage
// ===============================
const updateStageStatus = async (req, res) => {

    try {

        const { stageName, status, adminRemark } = req.body;

        const progress = await ApplicationProgress.findById(req.params.id);

        if (!progress) {
            return res.status(404).json({
                success: false,
                message: "Progress not found."
            });
        }

        const stage = progress.stages.find(
            item => item.stageName === stageName
        );

        if (!stage) {

            return res.status(404).json({
                success: false,
                message: "Stage not found."
            });

        }

        stage.status = status;

        if (adminRemark) {
            stage.adminRemark = adminRemark;
        }

        if (status === "Completed") {
            stage.completedAt = new Date();
        }

        progress.currentStage = stageName;

        const completed = progress.stages.filter(
            item => item.status === "Completed"
        ).length;

        progress.progressPercentage =
            Math.round((completed / progress.stages.length) * 100);

        await progress.save();

        res.status(200).json({
            success: true,
            message: "Progress updated successfully.",
            progress
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};



// ===============================
// Admin Get Any Student Progress
// ===============================
const getProgressByStudentId = async (req, res) => {

    try {

        const progress = await ApplicationProgress
            .findOne({ student: req.params.studentId })
            .populate("student", "name email phone");

        if (!progress) {
            return res.status(404).json({
                success: false,
                message: "Progress not found."
            });
        }

        res.status(200).json({
            success: true,
            progress
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};



module.exports = {
    createProgress,
    getStudentProgress,
    getProgressByStudentId,
    updateStageStatus
};