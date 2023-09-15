const express = require('express')
const router = express.Router()
const vacationRequestController = require('../../controllers/vacationRequestController')
const auth = require('../../middlewares/auth')


//Crie as rotas


module.exports = router