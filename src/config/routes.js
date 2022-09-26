const express = require('express')
const publicController = require('../controllers/publicController')
const userController = require('../controllers/userController')
const verifyToken = require('../middlewares/verifyToken')
const auth = require('../middlewares/auth')
const rnContoller = require('../controllers/rnContoller')
const propostaEntrevistaController = require('../controllers/propostaEntrevistaController')
const liminarController = require('../controllers/liminarController')
const router = express.Router()

//Public routes
router.get('/', publicController.index)
router.post('/login', publicController.login)

router.get('/verifyToken', auth, verifyToken.verify)

//Rest
router.post('/users', auth,userController.create)
router.get('/users', auth,userController.index)
router.get('/infoUser', auth, userController.infoUser)
router.get('/infoUser/:email', auth, userController.searchEmail)
router.put('/users/updatePassword', auth ,userController.firstAccess)
router.put('/users/modules', auth, userController.modules)

//Rns

router.post('/rn/upload', auth, rnContoller.upload)
router.get('/rn/rns', auth, rnContoller.show)
router.get('/rn/rns/:proposta', auth, rnContoller.search)
router.get('/rn/pedido/:proposta', auth, rnContoller.searchProposta)
router.get('/rn/report', auth, rnContoller.report)
router.put('/rn/rns/update', auth, rnContoller.update)
router.put('/rn/rns/concluir', auth, rnContoller.concluir)
router.put('/rn/updateConfirmadas', auth, rnContoller.updateConfirmadas)

//Tele Entrevistas

router.post('/entrevistas/upload', auth, propostaEntrevistaController.upload)

//Liminar

router.post('/liminares/upload', auth, liminarController.upload)
router.get('/liminares/show', auth, liminarController.show)
router.put('/liminares/concluir', auth, liminarController.concluir)
router.put('/liminares/change', auth, liminarController.change)


module.exports = router