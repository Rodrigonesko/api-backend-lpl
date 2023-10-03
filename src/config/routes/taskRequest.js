const express = require('express')
const router = express.Router()
const auth = require('../../middlewares/auth')
const taskRequestController = require('../../controllers/taskRequestController')


//Crie as rotas

router.get('/findAll', auth, taskRequestController.findAll)
router.post('/request', auth, taskRequestController.createTaskRequest)
router.put('/status', taskRequestController.setStatus)
router.put('/analist', taskRequestController.setAnalist)
router.post('/retorno', taskRequestController.setRetorno)
router.get('/filter', auth, taskRequestController.getCadastroByFilter)

module.exports = router