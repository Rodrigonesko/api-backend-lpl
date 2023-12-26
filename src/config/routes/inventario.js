const express = require('express')
const router = express.Router()
const inventarioController = require('../../controllers/inventarioController')
const auth = require('../../middlewares/auth')

//Crie as rotas

router.get('/findAll', auth, inventarioController.findAll)
router.post('/request', inventarioController.createInventario)
router.put('/status', inventarioController.setStatus)
router.get('/filter', inventarioController.getInventarioByFilter)
router.put('/update', inventarioController.updateInventarioTable)
router.post('/filterInv', inventarioController.filterInv)



module.exports = router