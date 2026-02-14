const { Router } = require('express');
const {
  listInstruments,
  getInstrument,
  createInstrument,
  updateInstrument,
  deleteInstrument,
} = require('../controllers/instruments.controller');

const router = Router();

router.get('/', listInstruments);
router.get('/:id', getInstrument);
router.post('/', createInstrument);
router.put('/:id', updateInstrument);
router.delete('/:id', deleteInstrument);

module.exports = router;
