const express = require('express')
const publicController = require('../controllers/publicController')
const userController = require('../controllers/userController')
const verifyToken = require('../middlewares/verifyToken')
const auth = require('../middlewares/auth')
const rnContoller = require('../controllers/rnContoller')
const propostaEntrevistaController = require('../controllers/propostaEntrevistaController')
const liminarController = require('../controllers/liminarController')
const projetoAjController = require('../controllers/projetoAjController')
const horarioController = require('../controllers/horarioController')
const rsdController = require('../controllers/rsdController')
const router = express.Router()

const fs = require('fs')
const multer = require('multer')

const uploadRsd = multer({dest: '/tmp'})

//Public routes
router.get('/', publicController.index)
router.post('/login', publicController.login)

router.get('/verifyToken', auth, verifyToken.verify)

//Rest
router.post('/users', auth,userController.create)
router.get('/users', auth,userController.index)
router.get('/infoUser', auth, userController.infoUser)
router.get('/infoUser/:email', auth, userController.searchEmail)
router.get('/users/enfermeiros', auth, userController.enfermeiros)
router.put('/users/updatePassword', auth ,userController.firstAccess)
router.put('/users/modules', auth, userController.modules)


//Rns

router.post('/rn/upload', auth, rnContoller.upload)
router.get('/rn/rns', auth, rnContoller.show)
router.get('/rn/rns/:id', auth, rnContoller.search)
router.get('/rn/pedido/:proposta', auth, rnContoller.searchProposta)
router.get('/rn/report', auth, rnContoller.report)
router.put('/rn/rns/update', auth, rnContoller.update)
router.put('/rn/rns/concluir', auth, rnContoller.concluir)
router.put('/rn/updateConfirmadas', auth, rnContoller.updateConfirmadas)

//Tele Entrevistas

router.post('/entrevistas/upload', auth, propostaEntrevistaController.upload)
router.get('/entrevistas/propostas', auth, propostaEntrevistaController.show)
router.put('/entrevistas/reagendar', auth, propostaEntrevistaController.reagendar)

router.post('/entrevistas/gerarHorarios', auth, horarioController.gerar)
router.get('/entrevistas/buscarDiasDisponiveis/:enfermeiro', auth, horarioController.search)
router.get('/entrevistas/buscarHorariosDisponiveis/:enfermeiro/:data', auth, horarioController.searchHorarios)
router.put('/entrevistas/agendar', auth, horarioController.agendar)


//Liminar

router.post('/liminares/upload', auth, liminarController.upload)
router.get('/liminares/show', auth, liminarController.show)
router.put('/liminares/concluir', auth, liminarController.concluir)
router.put('/liminares/change', auth, liminarController.change)

//Projeto Aj

router.post('/projetoAj/upload', auth, projetoAjController.upload)
router.get('/projetoAj/show', auth, projetoAjController.show)
router.put('/projetoAj/concluir', auth, projetoAjController.concluir)
router.put('/projetoAj/change', auth, projetoAjController.change)

//RSD

router.post('/rsd/upload', auth, rsdController.upload)
router.post('/rsd/subir', auth, rsdController.subir)
router.get('/rsd/protocolos', auth, rsdController.show)
router.get('/rsd/pessoas/:mo', auth, rsdController.mostrarPessoa)


module.exports = router