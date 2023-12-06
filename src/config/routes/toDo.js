const express = require('express')
const router = express.Router()
const toDoController = require('../../controllers/toDoController')
const auth = require('../../middlewares/auth')

//Crie as rotas

router.post('/newToDo', auth, toDoController.newToDo)
router.put('/update', toDoController.updateVacationTable)
router.get('/filter', toDoController.getFeriasByFilter)

module.exports = router