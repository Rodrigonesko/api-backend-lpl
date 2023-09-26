const express = require('express')
const router = express.Router()
const vacationRequestController = require('../../controllers/vacationRequestController')
const auth = require('../../middlewares/auth')


//Crie as rotas

router.get('/findAll', auth, vacationRequestController.findAll)
router.post('/request', vacationRequestController.createVacationRequest)
router.put('/status', vacationRequestController.setStatusRh)
router.get('/filter', vacationRequestController.getFeriasByFilter)

module.exports = router