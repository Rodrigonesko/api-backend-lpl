const express = require('express')
const router = express.Router()
const ControleAtividadeController = require('../../controllers/controleAtividadesController')
const auth = require('../../middlewares/auth')


/* Controle de Atividades */

router.post('/iniciarPadrao', auth, ControleAtividadeController.atividadePadrao)
router.get('/andamento', auth, ControleAtividadeController.atividadesAndamento)
router.get('/atual', auth, ControleAtividadeController.atividadeAtual)
router.put('/assumir', auth, ControleAtividadeController.assumirAtividade)
router.put('/encerrar', auth, ControleAtividadeController.encerrarAtividade)
router.get('/report', auth, ControleAtividadeController.report)

module.exports = router;
