const express = require('express')
const router = express.Router()
const sindicanciaController = require('../../controllers/sindicanciaController')
const auth = require('../../middlewares/auth')

router.get('/demanda', sindicanciaController.getDemandas)
router.get('/areaEmpresa', sindicanciaController.getAreaEmpresa)
router.get('/tipoServico', sindicanciaController.getTipoServico)
router.get('/status', sindicanciaController.getStatus)
router.get('/analistasExecucao', auth, sindicanciaController.getAnalistasExecucao)

module.exports = router