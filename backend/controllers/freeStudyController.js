const freeStudyCountryModel = require("../models/freeStudyCountryModel");
const { renderMarkdown } = require("../utils/markdown");
const { rowToCamel, rowsToCamel } = require("../utils/caseConvert");

const createSlug = (name) => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

function withRenderedHtml(row) {
  if (!row) return row;
  return { ...row, content_html: renderMarkdown(row.content_markdown) };
}

// GET /api/free-study
// Public — "Study Abroad for Free" country list.
const getPublishedCountries = async (req, res) => {
  try {
    const countries = await freeStudyCountryModel.findPublished();

    return res.status(200).json({
      success: true,
      count: countries.length,
      countries: rowsToCamel(countries.map(withRenderedHtml)),
    });
  } catch (error) {
    console.error("Get free-study countries error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// GET /api/free-study/:slug
// Public
const getPublishedCountryBySlug = async (req, res) => {
  try {
    const country = await freeStudyCountryModel.findPublishedBySlug(
      req.params.slug
    );

    if (!country) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    return res.status(200).json({
      success: true,
      country: rowToCamel(withRenderedHtml(country)),
    });
  } catch (error) {
    console.error("Get free-study country error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// GET /api/free-study/admin/all
// Admin only — includes unpublished drafts.
const getAllCountriesForAdmin = async (req, res) => {
  try {
    const countries = await freeStudyCountryModel.findAll();

    return res.status(200).json({
      success: true,
      count: countries.length,
      countries: rowsToCamel(countries.map(withRenderedHtml)),
    });
  } catch (error) {
    console.error("Get admin free-study countries error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// POST /api/free-study
// Admin only
const createCountry = async (req, res) => {
  try {
    let { countryName, summary, contentMarkdown, heroImageUrl, isPublished, sortOrder } =
      req.body;

    if (!countryName || !countryName.trim()) {
      return res.status(400).json({
        success: false,
        message: "countryName is required",
      });
    }

    countryName = countryName.trim();
    const slug = createSlug(countryName);

    const existing = await freeStudyCountryModel.findBySlug(slug);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A country with this name already exists",
      });
    }

    const country = await freeStudyCountryModel.create({
      country_name: countryName,
      country_slug: slug,
      summary: summary?.trim() || "",
      content_markdown: contentMarkdown || "",
      hero_image_url: heroImageUrl?.trim() || null,
      is_published: Boolean(isPublished),
      sort_order: Number(sortOrder) || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Country created successfully",
      country: rowToCamel(withRenderedHtml(country)),
    });
  } catch (error) {
    console.error("Create free-study country error:", error.message);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A country with this name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// PATCH /api/free-study/:id
// Admin only
const updateCountry = async (req, res) => {
  try {
    const existing = await freeStudyCountryModel.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    const {
      countryName,
      summary,
      contentMarkdown,
      heroImageUrl,
      isPublished,
      sortOrder,
    } = req.body;

    const updateData = {};

    if (countryName !== undefined) {
      if (!countryName.trim()) {
        return res.status(400).json({
          success: false,
          message: "countryName cannot be empty",
        });
      }

      const newSlug = createSlug(countryName);
      const slugConflict = await freeStudyCountryModel.findBySlugExcludingId(
        newSlug,
        existing.id
      );

      if (slugConflict) {
        return res.status(409).json({
          success: false,
          message: "A country with this name already exists",
        });
      }

      updateData.country_name = countryName.trim();
      updateData.country_slug = newSlug;
    }

    if (summary !== undefined) updateData.summary = summary.trim();
    if (contentMarkdown !== undefined) updateData.content_markdown = contentMarkdown;
    if (heroImageUrl !== undefined) updateData.hero_image_url = heroImageUrl ? heroImageUrl.trim() : null;
    if (typeof isPublished === "boolean") updateData.is_published = isPublished;

    if (sortOrder !== undefined) {
      const parsedSortOrder = Number(sortOrder);
      if (!Number.isFinite(parsedSortOrder) || parsedSortOrder < 0) {
        return res.status(400).json({
          success: false,
          message: "sortOrder must be a non-negative number",
        });
      }
      updateData.sort_order = parsedSortOrder;
    }

    const country = await freeStudyCountryModel.update(req.params.id, updateData);

    return res.status(200).json({
      success: true,
      message: "Country updated successfully",
      country: rowToCamel(withRenderedHtml(country)),
    });
  } catch (error) {
    console.error("Update free-study country error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid country ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

// DELETE /api/free-study/:id
// Admin only
const deleteCountry = async (req, res) => {
  try {
    const deletedCount = await freeStudyCountryModel.deleteById(req.params.id);

    if (!deletedCount) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Country deleted successfully",
    });
  } catch (error) {
    console.error("Delete free-study country error:", error.message);

    if (error.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid country ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
};

module.exports = {
  getPublishedCountries,
  getPublishedCountryBySlug,
  getAllCountriesForAdmin,
  createCountry,
  updateCountry,
  deleteCountry,
};
