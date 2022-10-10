const express = require('express')
const app = express()
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
const Proposta = require("./models/PropostaEntrevista")
const Liminar = require("./models/Liminar")
const ProjetoAj = require('./models/ProjetoAj')
const Pergunta = require('./models/Pergunta')
const Horario = require('./models/Horario')

const routes = require('./config/routes')

app.use(express.json())
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