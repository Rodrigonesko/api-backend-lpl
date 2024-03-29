const express = require('express')
const router = express.Router()
const admissaoDemissaoController = require('../../controllers/admissaoDemissaoController')
const auth = require('../../middlewares/auth')

//Rotas

router.post('/createAdmissao', auth, admissaoDemissaoController.createAdmissao)
router.post('/createDemissao', auth, admissaoDemissaoController.createDemissao)
router.put('/status', auth, admissaoDemissaoController.setStatus)
router.put('/obs', auth, admissaoDemissaoController.setObs)
router.put('/data', auth, admissaoDemissaoController.setData)
router.put('/prorrogacao', auth, admissaoDemissaoController.prorrogacao)
router.get('/itens', auth, admissaoDemissaoController.getAllItens)
router.post('/filterTableAdmi', auth, admissaoDemissaoController.filterTableAdmissional)
router.post('/filterTableDemi', auth, admissaoDemissaoController.filterTableDemissional)
router.get('/findAcoesAdmissional', auth, admissaoDemissaoController.findAcoesAdmissional)
router.get('/findAcoesDemissional', auth, admissaoDemissaoController.findAcoesDemissional)

module.exports = router