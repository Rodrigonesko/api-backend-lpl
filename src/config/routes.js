const express = require('express')
const publicController = require('../controllers/publicController')
const userController = require('../controllers/userController')

const router = express.Router()

//Public routes
router.get('/', publicController.index)

//Rest

router.post('/users', userController.create)



module.exports = router