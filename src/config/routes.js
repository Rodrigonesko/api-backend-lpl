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
const elegibilidadeController = require('../controllers/elegibilidadeController')
const router = express.Router()

const multer = require('multer')
const TeleEntrevistaController = require('../controllers/TeleEntrevistaController')

const uploadRsd = multer({ dest: '/tmp' })

//Public routes
router.get('/', publicController.index)
router.post('/login', publicController.login)

router.get('/verifyToken', auth, verifyToken.verify)

//Rest
router.post('/users', auth, userController.create)
router.get('/users', auth, userController.index)
router.get('/infoUser', auth, userController.infoUser)
router.get('/infoUser/:email', auth, userController.searchEmail)
router.get('/users/enfermeiros', auth, userController.enfermeiros)
router.put('/users/updatePassword', auth, userController.firstAccess)
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

router.get('/entrevistas/perguntas', auth, TeleEntrevistaController.mostrarPerguntas)
router.get('/entrevistas/pessoa/:id', auth, TeleEntrevistaController.mostrarPessoaEntrevista)

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
router.get('/rsd/pedidos/todos', auth, rsdController.show)
router.get('/rsd/pessoas/:mo', auth, rsdController.mostrarPessoa)
router.put('/rsd/pessoas/editar', auth, rsdController.atualizarInformacoes)
router.get('/rsd/pedido/:pedido', auth, rsdController.buscarPedido)
router.put('/rsd/clinica/busca', auth, rsdController.buscarClinica)
router.put('/rsd/pedido/editar', auth, rsdController.editarPedido)
router.post('/rsd/pedido/criar', auth, rsdController.criarPedido)
router.get('/rsd/mo/:protocolo', auth, rsdController.buscarMoProtocolo)
router.post('/rsd/protocolo/criar', auth, rsdController.criarProtocolo)
router.post('/rsd/pacote/criar', auth, rsdController.criarPacote)
router.get('/rsd/pedidos/mo/:mo', auth, rsdController.buscarPedidosMo)
router.put('/rsd/pacote/assumir', auth, rsdController.assumirPacote)
router.get('/rsd/pedidos/pacote/:pacote', auth, rsdController.buscarPedidosPacote)
router.post('/rsd/gravacao/anexar/:pacote', auth, rsdController.anexarGravacao)
router.get('/rsd/arquivos/:pacote', auth, rsdController.buscarArquivos)
router.get('/rsd/formasPagamento', auth, rsdController.buscarFormasPagamento)
router.get('/rsd/statusFinalizacoes', auth, rsdController.buscarStatusFinalizacao)
router.put('/rsd/pedido/atualizar', auth, rsdController.atualizarPedido)
router.get('/rsd/agenda/:pacote', auth, rsdController.buscarAgenda)
router.get('/rsd/pedidos/naoFinalizados/naoFinalizados', auth, rsdController.buscarPedidosNaoFinalizados)
router.get('/rsd/pedidos/naoFinalizados/filtro/:pesquisa', auth, rsdController.filtroPedidosNaoFinalizados)
router.get('/rsd/operadoras', auth, rsdController.buscarOperadoras)
router.post('/rsd/pedido/criar/individual', auth, rsdController.criarPedidoIndividual)
router.post('/rsd/operadoras/criar', auth, rsdController.criarOperadora)
router.put('/rsd/operadoras/editar', auth, rsdController.editarOperadora)
router.get('/rsd/operadora/:id', auth, rsdController.buscarOperadora)
router.get('/rsd/concluidos/:pesquisa', auth, rsdController.buscarPedidosFinalizados)
router.put('/rsd/pedido/devolverAmil', auth, rsdController.devolverAmil)
router.post('/rsd/agenda/novoParecer', auth, rsdController.escrevarAgenda)
router.post('/rsd/pedidosAntigos', auth, rsdController.subirPedidosAntigos)
router.put('/rsd/pacote/voltarFase', auth, rsdController.voltarFase)
router.put('/rsd/pedido/voltarFase', auth, rsdController.voltarFasePedido)
router.put('/rsd/pedido/prioridadeDossie', auth, rsdController.adicionarPrioridadeDossie)

//Rotas Elegibilidade

router.post('/elegibilidade/upload', auth, elegibilidadeController.upload)


module.exports = router