const express = require('express')
const router = express.Router()
const contingenciasController = require('../../controllers/contingenciasController')
const auth = require('../../middlewares/auth')

//Rotas

router.post('/:contingencia/:versao', auth, contingenciasController.create)
router.get('/', auth, contingenciasController.show)
router.get('/ativos', auth, contingenciasController.showActive)
router.get('/politica/:id', auth, contingenciasController.showContingencia)

module.exports = router