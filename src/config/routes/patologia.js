const express = require('express')
const router = express.Router()
const patologiaController = require('../../controllers/patologiaController')
const auth = require('../../middlewares/auth')

router.post('/', auth, patologiaController.create)
router.get('/', auth, patologiaController.show)
router.get('/:celula/:idCelula', auth, patologiaController.showById)

module.exports = router