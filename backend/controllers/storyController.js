const storyModel = require("../models/storyModel");
const { rowToCamel, rowsToCamel } = require("../utils/caseConvert");

// Fields an admin is allowed to set/update on a story (camelCase body key ->
// snake_case column). Prevents accidentally overwriting fields like
// created_by via a raw body.
const ALLOWED_FIELDS = {
  studentName: "student_name",
  country: "country",
  university: "university",
  course: "course",
  title: "title",
  description: "description",
  youtubeUrl: "youtube_url",
  thumbnail: "thumbnail",
  isFeatured: "is_featured",
  isActive: "is_active",
  sortOrder: "sort_order",
};

const pickAllowedFields = (body) => {
  const result = {};

  for (const [bodyKey, column] of Object.entries(ALLOWED_FIELDS)) {
    if (body[bodyKey] !== undefined) {
      result[column] = body[bodyKey];
    }
  }

  return result;
};

// Create Story
const createStory = async (req, res) => {
  try {
    const {
      studentName,
      country,
      university,
      course,
      title,
      description,
      youtubeUrl,
      thumbnail,
      isFeatured,
      sortOrder,
    } = req.body;

    if (
      !studentName ||
      !country ||
      !university ||
      !course ||
      !title ||
      !youtubeUrl
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const story = await storyModel.create({
      student_name: studentName,
      country,
      university,
      course,
      title,
      description: description || "",
      youtube_url: youtubeUrl,
      thumbnail: thumbnail || "",
      is_featured: Boolean(isFeatured),
      sort_order: Number(sortOrder) || 0,
      created_by: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Story created successfully",
      story: rowToCamel(story),
    });
  } catch (error) {
    console.error("Create story error:", error.message);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get all active stories
const getStories = async (req, res) => {
  try {
    const stories = await storyModel.findActive();

    res.status(200).json({
      success: true,
      count: stories.length,
      stories: rowsToCamel(stories),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get story by ID
const getStoryById = async (req, res) => {
  try {
    const story = await storyModel.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    res.status(200).json({
      success: true,
      story: rowToCamel(story),
    });
  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid story ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update Story
const updateStory = async (req, res) => {
  try {
    const updateData = pickAllowedFields(req.body);

    const story = await storyModel.update(req.params.id, updateData);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Story updated successfully",
      story: rowToCamel(story),
    });
  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid story ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Delete Story
const deleteStory = async (req, res) => {
  try {
    const deletedCount = await storyModel.deleteById(req.params.id);

    if (!deletedCount) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (error) {
    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid story ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  createStory,
  getStories,
  getStoryById,
  updateStory,
  deleteStory,
};
