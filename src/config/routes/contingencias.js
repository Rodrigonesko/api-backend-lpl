const express = require('express')
const router = express.Router()
const contingenciasController = require('../../controllers/contingenciasController')
const auth = require('../../middlewares/auth')

//Rotas

router.post('/:contingencia/:versao', auth, contingenciasController.create)
router.get('/', auth, contingenciasController.show)

module.exports = router