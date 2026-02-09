const pool = require('../db');

// Adds a computed calibration status to each row so the API, not the client,
// owns the compliance logic
const SELECT_WITH_STATUS = `
  SELECT *,
    (last_calibrated_at + calibration_interval_days * INTERVAL '1 day')::date AS next_due,
    CASE
      WHEN last_calibrated_at + calibration_interval_days * INTERVAL '1 day' < NOW() THEN 'OVERDUE'
      WHEN last_calibrated_at + calibration_interval_days * INTERVAL '1 day' < NOW() + INTERVAL '30 days' THEN 'DUE_SOON'
      ELSE 'COMPLIANT'
    END AS status
  FROM instruments
`;

const listInstruments = async (req, res) => {
  try {
    const { rows } = await pool.query(`${SELECT_WITH_STATUS} ORDER BY next_due ASC`);
    return res.json({ success: true, data: rows, message: 'Instruments retrieved' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
};

const getInstrument = async (req, res) => {
  try {
    const { rows } = await pool.query(`${SELECT_WITH_STATUS} WHERE id = $1`, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Instrument not found' });
    }
    return res.json({ success: true, data: rows[0], message: 'Instrument retrieved' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
};

const createInstrument = async (req, res) => {
  const { name, serial_number, location, calibration_interval_days, last_calibrated_at } = req.body;
  if (!name || !serial_number || !location || !last_calibrated_at) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'name, serial_number, location and last_calibrated_at are required',
    });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO instruments (name, serial_number, location, calibration_interval_days, last_calibrated_at)
       VALUES ($1, $2, $3, COALESCE($4, 365), $5) RETURNING *`,
      [name, serial_number, location, calibration_interval_days, last_calibrated_at]
    );
    return res.status(201).json({ success: true, data: rows[0], message: 'Instrument created' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, data: null, message: 'serial_number already exists' });
    }
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
};

const updateInstrument = async (req, res) => {
  const { name, location, calibration_interval_days, last_calibrated_at } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE instruments SET
         name = COALESCE($1, name),
         location = COALESCE($2, location),
         calibration_interval_days = COALESCE($3, calibration_interval_days),
         last_calibrated_at = COALESCE($4, last_calibrated_at)
       WHERE id = $5 RETURNING *`,
      [name, location, calibration_interval_days, last_calibrated_at, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Instrument not found' });
    }
    return res.json({ success: true, data: rows[0], message: 'Instrument updated' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
};

const deleteInstrument = async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM instruments WHERE id = $1', [req.params.id]);
    if (rowCount === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Instrument not found' });
    }
    return res.json({ success: true, data: null, message: 'Instrument deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
};

module.exports = {
  listInstruments,
  getInstrument,
  createInstrument,
  updateInstrument,
  deleteInstrument,
};
