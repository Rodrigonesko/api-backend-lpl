const express = require('express')
const publicController = require('../controllers/publicController')
const userController = require('../controllers/userController')
const verifyToken = require('../middlewares/verifyToken')
const auth = require('../middlewares/auth')
const rnContoller = require('../controllers/rnContoller')
const router = express.Router()

//Public routes
router.get('/', publicController.index)
router.post('/login', publicController.login)

router.get('/verifyToken', auth, verifyToken.verify)

//Rest
router.post('/users', auth,userController.create)
router.get('/users', auth,userController.index)

//Rns

router.post('/rn/upload', auth, rnContoller.upload)
router.get('/rn/rns', auth, rnContoller.show)
router.get('/rn/rns/:proposta', auth, rnContoller.search)


module.exports = router