const express = require('express')
const router = express.Router()
const dicionarioController = require('../../controllers/dicionarioController')
const auth = require('../../middlewares/auth')

router.get('/', auth, dicionarioController.show)
router.post('/', auth, dicionarioController.create)
router.delete('/:palavra', auth, dicionarioController.delete)

module.exports = router