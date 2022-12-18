const express = require('express')
const app = express()
const fileupload = require('express-fileupload')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const corsOptions = {
    origin: `${process.env.FRONT_END_ADDRESS}`,
    credentials: true
}

//JWT Related
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET

//Mongo 

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGODB_URL)
const User = require('./models/User')
const Rn = require('./models/Rn')

const Liminar = require("./models/Liminar")
const ProjetoAj = require('./models/ProjetoAj')

//Models Entrevista

const Proposta = require("./models/PropostaEntrevista")
const Pergunta = require('./models/Pergunta')
const Horario = require('./models/Horario')
const DadosEntrevista = require('./models/TeleEntrevista/DadosEntrevista')
const Cid = require("./models/TeleEntrevista/Cid")

//Models RSD

const Agenda = require('./models/Rsd/Agenda')
const Clinica = require('./models/Rsd/Clinica')
const FormaPagamento = require('./models/Rsd/FormaPagamento')
const Gravacao = require('./models/Rsd/Gravacao')
const Operador = require('./models/Rsd/Operador')
const Pacote = require('./models/Rsd/Pacote')
const Pedido = require('./models/Rsd/Pedido')
const Pessoa = require('./models/Rsd/Pessoa')
const Protocolo = require('./models/Rsd/Protocolo')
const StatusFinalizacao = require('./models/Rsd/StatusFinalizacao')
const StatusPacote = require('./models/Rsd/StatusPacote')
const StatusPedido = require('./models/Rsd/StatusPedido')
const StatusProtocolo = require('./models/Rsd/StatusProtocolo')

//Models Elegibilidade

const PropostasElegiblidade = require('./models/Elegibilidade/PropostasElegiblidade')
const AgendaElegibilidade = require('./models/Elegibilidade/AgendaElegibilidade')
const Prc = require('./models/Elegibilidade/Prc')

const routes = require('./config/routes')

app.use(express.json({limit: '100mb'}))
app.use(cookieParser())
app.use(cors(corsOptions))
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', `${process.env.FRONT_END_ADDRESS}`);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use('/', routes)

module.exports = app