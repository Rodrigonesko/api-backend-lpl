const express = require('express')
const router = express.Router()
const sindicanciaController = require('../../controllers/sindicanciaController')
const auth = require('../../middlewares/auth')

router.get('/',  sindicanciaController.show)

module.exports = router