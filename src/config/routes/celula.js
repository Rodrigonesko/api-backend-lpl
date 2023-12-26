const express = require('express');
const router = express.Router();
const celulaController = require('../../controllers/celulaController');
const auth = require('../../middlewares/auth');

//Rotas

router.post('/', auth, celulaController.create);
router.get('/', auth, celulaController.show);

module.exports = router;