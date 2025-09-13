const { db } = require('../config/db');

function createSlider(slider, callback) {
  const sql = 'INSERT INTO sliders (image, collection_id, button_text) VALUES (?, ?, ?)';
  const values = [slider.image, slider.collection_id, slider.button_text];
  db.query(sql, values, callback);
}

function getSliders(callback) {
  db.query('SELECT * FROM sliders', callback);
}

function getSliderById(id, callback) {
  db.query('SELECT * FROM sliders WHERE id = ?', [id], callback);
}

function updateSlider(id, slider, callback) {
  const sql = 'UPDATE sliders SET image = ?, collection_id = ?, button_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  const values = [slider.image, slider.collection_id, slider.button_text, id];
  db.query(sql, values, callback);
}

function deleteSlider(id, callback) {
  db.query('DELETE FROM sliders WHERE id = ?', [id], callback);
}

module.exports = {
  createSlider,
  getSliders,
  getSliderById,
  updateSlider,
  deleteSlider,
}; 