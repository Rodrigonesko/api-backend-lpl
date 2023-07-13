const express = require('express')
const router = express.Router()
const politicaController = require('../../controllers/politicasController')
const auth = require('../../middlewares/auth')

//Rotas

router.post('/:politica/:versao', auth, politicaController.create)
router.get('/', auth, politicaController.show)

module.exports = router