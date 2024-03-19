const express = require('express')
const router = express.Router()
const auth = require('../../middlewares/auth')
const agendaController = require('../../controllers/agendaController')

//Rotas

router.post('/createAgenda', auth, agendaController.createAgenda)
router.get('/getAgenda', auth, agendaController.getAgenda)
router.get('/getAgendaToDo', auth, agendaController.getAgendaToDo)
router.delete('/deleteAgenda/:id', auth, agendaController.deleteAgenda)
router.put('/updateAgendaCheck', auth, agendaController.updateAgendaCheck)
router.put('/data', auth, agendaController.setData)

module.exports = router