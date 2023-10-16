const express = require('express')
const router = express.Router()
const inventarioController = require('../../controllers/inventarioController')
const auth = require('../../middlewares/auth')

//Crie as rotas

router.get('/findAll', auth, inventarioController.findAll)
router.post('/request', inventarioController.createInventario)
router.put('/status', inventarioController.setStatus)
router.get('/filter', inventarioController.getInventarioByFilter)


module.exports = router