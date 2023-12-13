const express = require('express')
const router = express.Router()
const toDoController = require('../../controllers/toDoController')
const auth = require('../../middlewares/auth')

//Crie as rotas

router.post('/newToDo', auth, toDoController.newToDo)

module.exports = router