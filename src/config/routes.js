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
const patologiasRoutes = require('./routes/patologia')
const vacationRequestRoutes = require('./routes/vacationRequest')
const admissaoDemissaoRoutes = require('./routes/admissaoDemissao')
const treinamentoRoutes = require('./routes/treinamento')
const inventarioRoutes = require('./routes/inventario')

const taskRequestRoutes = require('./routes/taskRequest')
const sindicanciaRoutes = require('./routes/sindicancia')
const muralRoutes = require('./routes/mural')


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
router.get('/celulas', auth, userController.getAllCelulas)
router.post('/celulas', auth, userController.createCelula)
router.patch('/bancoHoras', auth, userController.updateBancoHoras)
router.patch('/horarioPonto', auth, userController.updateHorarioPonto)
router.get('/feriasElegiveis', auth, userController.getFeriasElegiveis)
router.get('/aniversariantes', auth, userController.getAllAniversariantes)
router.patch('/updateProfilePic', auth, userController.updateProfilePic)

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
router.use('/patologias', patologiasRoutes)
router.use('/vacation', vacationRequestRoutes)
router.use('/admissaoDemissao', admissaoDemissaoRoutes)
router.use('/treinamento', treinamentoRoutes)
router.use('/tasks', taskRequestRoutes)
router.use('/sindicancia', sindicanciaRoutes)
router.use('/inventario', inventarioRoutes)
router.use('/mural', muralRoutes)


module.exports = router