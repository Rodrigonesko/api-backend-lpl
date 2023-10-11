const express = require('express')
const router = express.Router()
const muralController = require('../../controllers/muralController')
const auth = require('../../middlewares/auth')

router.post('/', auth, muralController.create)
router.get('/', auth, muralController.getAllRecados)

module.exports = router