const express = require("express")
const router = express.Router()
const elegibilidadePmeController = require('../../controllers/elegibilidadePmeController')
const auth = require('../../middlewares/auth')

router.post('/upload', auth, elegibilidadePmeController.upload)
router.get('/propostas', auth, elegibilidadePmeController.show)
router.get('/propostas/:status', auth, elegibilidadePmeController.propostasPorStatus)
router.get('/propostas/:status/:analista', auth, elegibilidadePmeController.propostasPorStatusEAnalista)
router.get('/proposta/:status/:proposta', auth, elegibilidadePmeController.getProposta)
router.put('/atribuirAnalista', auth, elegibilidadePmeController.atribuirAnalista)
router.get('/infoProposta/:id', auth, elegibilidadePmeController.infoProposta)
router.put('/alterarStatus', auth, elegibilidadePmeController.alterarStatus)
router.get('/agenda/:proposta', auth, elegibilidadePmeController.agendaPorProposta)
router.post('/agenda', auth, elegibilidadePmeController.adicionarComentario)
router.get('/producaoDiaria/:data', auth, elegibilidadePmeController.producaoDiaria)
router.get('/producaoMensal/:mes/:analista', auth, elegibilidadePmeController.producaoMensal)

module.exports = router