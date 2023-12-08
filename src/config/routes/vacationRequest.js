const express = require('express')
const router = express.Router()
const vacationRequestController = require('../../controllers/vacationRequestController')
const auth = require('../../middlewares/auth')


//Crie as rotas

router.get('/findAll', auth, vacationRequestController.findAll)
router.post('/request', vacationRequestController.createVacationRequest)
router.put('/status', vacationRequestController.setStatusRh)
router.put('/update', vacationRequestController.updateVacationTable)
router.get('/filter', vacationRequestController.getFeriasByFilter)
router.put('/gestorAceitou', vacationRequestController.getGestorAceitou)

module.exports = router