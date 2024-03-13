const express = require('express')
const router = express.Router()
const auth = require('../../middlewares/auth')
const agendaController = require('../../controllers/agendaController')

//Rotas

router.post('/createAgenda', auth, agendaController.createAgenda)
router.get('/getAgenda', auth, agendaController.getAgenda)

module.exports = router