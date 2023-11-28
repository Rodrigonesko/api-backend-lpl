const express = require('express')
const router = express.Router()
const admissaoDemissaoController = require('../../controllers/admissaoDemissaoController')
const auth = require('../../middlewares/auth')

//Crie as rotas

router.get('/findAll', auth, admissaoDemissaoController.findAll)
router.put('/status', admissaoDemissaoController.setStatus)
router.post('/email', admissaoDemissaoController.setEmail)
router.post('/setNumero', admissaoDemissaoController.setNumero)
router.post('/create', admissaoDemissaoController.createNewAdmissao)
router.get('/infoUser', admissaoDemissaoController.infoUser)
router.get('/infoUser/:nome', admissaoDemissaoController.searchName)
router.get('/users', admissaoDemissaoController.index)

module.exports = router