const { db } = require("../config/db");
const socketService = require("../services/socketService");

// Create new slider
function createSlider(req, res) {
  const { title, description, link, category_id } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!title || !image) {
    return res.status(400).json({ error: "Title and image are required" });
  }

  const sql =
    "INSERT INTO sliders (title, description, image_url, link_url, category_id) VALUES (?, ?, ?, ?, ?)";
  db.query(
    sql,
    [title, description, image, link, category_id],
    (err, result) => {
      if (err) {
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
    }
  );
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
    res.json(results);
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
    res.json(results[0]);
  });
}

// Update slider
function updateSlider(req, res) {
  const { id } = req.params;
  const { title, description, link, category_id } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  let sql, params;
  if (image) {
    sql =
      "UPDATE sliders SET title = ?, description = ?, image_url = ?, link_url = ?, category_id = ? WHERE id = ?";
    params = [title, description, image, link, category_id, id];
  } else {
    sql =
      "UPDATE sliders SET title = ?, description = ?, link_url = ?, category_id = ? WHERE id = ?";
    params = [title, description, link, category_id, id];
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
