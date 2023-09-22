const express = require('express')
const router = express.Router()
const treinamentoController = require('../../controllers/treinamentoController')
const auth = require('../../middlewares/auth')

router.get('/', auth, treinamentoController.getAll)
router.post('/', auth, treinamentoController.create)
router.delete('/:id', auth, treinamentoController.delete)
router.put('/', auth, treinamentoController.update)
router.put('/treinamentoRealizado', auth, treinamentoController.treinamentoRealizado)
router.get('/:id', auth, treinamentoController.getById)
router.get('/verificar/treinamento', auth, treinamentoController.verificarTreinamento)
router.put('/naoPrecisaTreinamento', auth, treinamentoController.naoPrecisaTreinamento)

module.exports = router