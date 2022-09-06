const express = require('express')
const publicController = require('../controllers/publicController')
const userController = require('../controllers/userController')
const verifyToken = require('../middlewares/verifyToken')
const auth = require('../middlewares/auth')
const router = express.Router()

//Public routes
router.get('/', publicController.index)
router.post('/login', publicController.login)

router.get('/verifyToken', auth, verifyToken.verify)

//Rest
router.post('/users', auth,userController.create)
router.get('/users', auth,userController.index)



module.exports = router