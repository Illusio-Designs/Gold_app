const { db } = require("../config/db");
const socketService = require("../services/socketService");
const { getBaseUrl } = require("../config/environment");

// Create new slider
function createSlider(req, res) {
  const { title, category_id } = req.body;
  const image = req.file ? req.file.filename : null;

  console.log("Slider creation request:", { title, category_id, image });
  console.log("Request body:", req.body);

  if (!title || !image) {
    return res.status(400).json({ error: "Title and image are required" });
  }

  const sql =
    "INSERT INTO sliders (title, image_url, category_id) VALUES (?, ?, ?)";
  const categoryId = category_id && category_id !== "" ? category_id : null;
  db.query(sql, [title, image, categoryId], (err, result) => {
    if (err) {
      console.error("Database error:", err);
      if (err.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({ error: "Invalid category selected" });
      }
      return res.status(500).json({ error: err.message });
    }

    // Get the created slider for real-time update
    const sliderId = result.insertId;
    db.query(
      "SELECT * FROM sliders WHERE id = ?",
      [sliderId],
      (getErr, sliderResults) => {
        if (!getErr && sliderResults.length > 0) {
          // Emit real-time update
          socketService.notifySliderUpdate(sliderResults[0], "created");
        }
      }
    );

    res.status(201).json({
      message: "Slider created successfully",
      sliderId: result.insertId,
    });
  });
}

// Get all sliders
function getSliders(req, res) {
  const sql = `
    SELECT s.*, c.name as category_name 
    FROM sliders s 
    LEFT JOIN categories c ON s.category_id = c.id 
    ORDER BY s.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Process results to include properly formatted image URLs
    const processedResults = results.map((slider) => {
      let processedImageUrl = null;

      if (slider.image_url) {
        // Encode the filename to handle spaces and special characters
        const encodedFilename = encodeURIComponent(slider.image_url);
        // Construct the full image URL
        processedImageUrl = `${getBaseUrl()}/uploads/slider/${encodedFilename}`;
      }

      return {
        ...slider,
        image_url: processedImageUrl,
      };
    });

    res.json(processedResults);
  });
}

// Get slider by ID
function getSliderById(req, res) {
  const { id } = req.params;
  const sql = "SELECT * FROM sliders WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Slider not found" });
    }

    // Process result to include properly formatted image URL
    const slider = results[0];
    let processedImageUrl = null;

    if (slider.image_url) {
      // Encode the filename to handle spaces and special characters
      const encodedFilename = encodeURIComponent(slider.image_url);
      // Construct the full image URL
      processedImageUrl = `${getBaseUrl()}/uploads/slider/${encodedFilename}`;
    }

    const processedSlider = {
      ...slider,
      image_url: processedImageUrl,
    };

    res.json(processedSlider);
  });
}

// Update slider
function updateSlider(req, res) {
  const { id } = req.params;
  const { title, category_id } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  let sql, params;
  const categoryId = category_id && category_id !== "" ? category_id : null;
  if (image) {
    sql =
      "UPDATE sliders SET title = ?, image_url = ?, category_id = ? WHERE id = ?";
    params = [title, image, categoryId, id];
  } else {
    sql = "UPDATE sliders SET title = ?, category_id = ? WHERE id = ?";
    params = [title, categoryId, id];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Slider not found" });
    }

    // Get the updated slider for real-time update
    db.query(
      "SELECT * FROM sliders WHERE id = ?",
      [id],
      (getErr, sliderResults) => {
        if (!getErr && sliderResults.length > 0) {
          // Emit real-time update
          socketService.notifySliderUpdate(sliderResults[0], "updated");
        }
      }
    );

    res.json({ message: "Slider updated successfully" });
  });
}

// Delete slider
function deleteSlider(req, res) {
  const { id } = req.params;

  // Get the slider before deleting for real-time update
  db.query(
    "SELECT * FROM sliders WHERE id = ?",
    [id],
    (getErr, sliderResults) => {
      if (getErr) {
        return res.status(500).json({ error: getErr.message });
      }

      if (sliderResults.length === 0) {
        return res.status(404).json({ error: "Slider not found" });
      }

      const sliderToDelete = sliderResults[0];

      // Delete the slider
      db.query("DELETE FROM sliders WHERE id = ?", [id], (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Emit real-time update
        socketService.notifySliderUpdate(sliderToDelete, "deleted");

        res.json({ message: "Slider deleted successfully" });
      });
    }
  );
}

module.exports = {
  createSlider,
  getSliders,
  getSliderById,
  updateSlider,
  deleteSlider,
};
