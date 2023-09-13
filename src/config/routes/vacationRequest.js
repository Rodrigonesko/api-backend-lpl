const express = require('express')
const router = express.Router()
const vacationRequestController = require('../../controllers/vacationRequestController')
const auth = require('../../middlewares/auth')

router.get('/', vacationRequestController.getAllRequests)
router.get('/:id', vacationRequestController.getRequestById)
router.put('/analyse', vacationRequestController.analyseRequest)
router.post('/send', vacationRequestController.sendRequest)

module.exports = router