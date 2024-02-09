const express = require('express')
const router = express.Router()
const urgenciaEmergenciaController = require('../../controllers/urgenciaEmergenciaController')
const auth = require('../../middlewares/auth')

/* Urgencia Emergencia */

router.post('/upload', auth, urgenciaEmergenciaController.upload)
router.get('/andamento', auth, urgenciaEmergenciaController.mostrarAndamento)
router.get('/concluidas', auth, urgenciaEmergenciaController.mostrarConcluidas)
router.get('/anexar', auth, urgenciaEmergenciaController.mostrarAnexar)
router.get('/todas', auth, urgenciaEmergenciaController.mostrarTodas)
router.get('/detalhes/:id', auth, urgenciaEmergenciaController.mostrarDadosProposta)
router.put('/salvarInfo', auth, urgenciaEmergenciaController.salvarInfo)
router.put('/concluir', auth, urgenciaEmergenciaController.concluir)
router.get('/producao/:data', auth, urgenciaEmergenciaController.producao)
router.put('/salvarContato', auth, urgenciaEmergenciaController.salvarContato)
router.put('/concluirAnexo', auth, urgenciaEmergenciaController.concluirAnexo)
router.get('/producaoTotal', auth, urgenciaEmergenciaController.producaoTotal)
router.get('/filter', auth, urgenciaEmergenciaController.filter)
router.get('/producaoMensal/:mes/:analista', auth, urgenciaEmergenciaController.producaoMensal)

module.exports = router