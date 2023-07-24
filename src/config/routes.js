const express = require('express')
const publicController = require('../controllers/publicController')
const userController = require('../controllers/userController')
const verifyToken = require('../middlewares/verifyToken')
const auth = require('../middlewares/auth')

//Arquivos de rota
const controleAtividadeRoutes = require('./routes/controleAtividade')
const rnRoutes = require('./routes/rn')
const teleEntrevistasRoutes = require('./routes/teleEntrevista')
const rsdRoutes = require('./routes/rsd')
const elegibilidadeRoutes = require("./routes/elegibilidade")
const urgenciaEmergenciaRoutes = require('./routes/urgenciaEmergencia')
const dicionarioRoutes = require('./routes/dicionario')
const elegibilidadePmeRoutes = require("./routes/elegibilidadePme")
const politicasRoutes = require('./routes/politicas')

const router = express.Router()

//Public routes
router.get('/', publicController.index)
router.post('/login', publicController.login)
router.post('/logout', publicController.logout)

//Verificar Token
router.get('/verifyToken', auth, verifyToken.verify)

//User
router.post('/users', userController.create)
router.get('/users', userController.index)
router.get('/infoUser', auth, userController.infoUser)
router.get('/infoUser/:email', auth, userController.searchEmail)
router.get('/users/enfermeiros', auth, userController.enfermeiros)
router.get('/users/elegibilidade', auth, userController.analistasElegi)
router.get('/users/rsd', auth, userController.analistasRsd)
router.put('/users/updatePassword', auth, userController.firstAccess)
router.put('/users/modules', auth, userController.modules)
router.put('/users/resetPassword', auth, userController.resetPassword)
router.get('/users/coren/:name', auth, userController.coren)
router.put('/users/lerPolitica', auth, userController.lerPolitica)

//Rotas das células

router.use('/rn', rnRoutes)
router.use('/entrevistas', teleEntrevistasRoutes)
router.use('/rsd', rsdRoutes)
router.use('/urgenciaEmergencia', urgenciaEmergenciaRoutes)
router.use('/elegibilidade', elegibilidadeRoutes)
router.use('/controleAtividade', controleAtividadeRoutes)
router.use('/dicionario', dicionarioRoutes)
router.use('/elegibilidadePme', elegibilidadePmeRoutes)
router.use('/politicas', politicasRoutes)

module.exports = router