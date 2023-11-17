const express = require('express')
const router = express.Router()
const admissaoDemissaoController = require('../../controllers/admissaoDemissaoController')
const auth = require('../../middlewares/auth')

//Crie as rotas

router.get('/findAll', auth, admissaoDemissaoController.findAll)
router.put('/status', admissaoDemissaoController.setStatus)
router.put('/infoUser', admissaoDemissaoController.infoUser)

module.exports = router