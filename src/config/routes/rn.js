const express = require('express')
const router = express.Router()
const rnContoller = require('../../controllers/rnContoller')
const auth = require('../../middlewares/auth')

//Rotas Rns

router.post('/upload', auth, rnContoller.upload)
router.get('/rns', auth, rnContoller.show)
router.get('/rns/:id', auth, rnContoller.search)
router.get('/pedido/:proposta', auth, rnContoller.searchProposta)
router.get('/report', auth, rnContoller.report)
router.put('/rns/update', auth, rnContoller.update)
router.put('/rns/concluir', auth, rnContoller.concluir)
router.put('/updateConfirmadas', auth, rnContoller.updateConfirmadas)
router.get('/naoAgendadas', rnContoller.naoAgendadas)
router.get('/agendadas', rnContoller.agendadas)
router.delete('/delete/:id', auth, rnContoller.excluirProposta)
router.put('/reagendar', auth, rnContoller.reagendar)
router.put('/alterarTelefone', auth, rnContoller.alterarTelefone)
router.get('/concluidas', auth, rnContoller.concluidas)
router.put('/cancelar', auth, rnContoller.cancelar)
router.put('/tentativaContato', auth, rnContoller.tentativaContato)
router.put('/duplicada', auth, rnContoller.duplicada)

module.exports = router;