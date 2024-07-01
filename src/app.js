const express = require('express')
const app = express()
const cookieParser = require('cookie-parser')
const cors = require('cors')
const corsOptions = {
    origin: true,
    credentials: true
}

require('./tasks/tasks')
//Tasks

const verificarFerias = require('./tasks/verificarFerias')
verificarFerias()
setInterval(verificarFerias, 300000)

//JWT Related
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET

//Mongo 
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGODB_URL + '/lpl', {
    authSource: 'admin',
    //authMechanism: 'SCRAM-SHA-256',
    // useNewUrlParser: true,
    // useUnifiedTopology: true
})

const db = mongoose.connection

db.once('open', async () => {
    console.log('MongoDB connected!')
})

const routes = require('./config/routes')

app.use(express.json({ limit: '100mb' }))
app.use(cookieParser())
app.use(cors(corsOptions))
app.use(function (req, res, next) {

    // Set headers to allow all origins
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use('/', routes)
app.use('/media', express.static('uploads'))
app.use('/newTeleEntrevista', require('./controllers/newTeleEntrevista.controller'))
app.use('/newPropostaEntrevista', require('./controllers/newPropostaEntrevista.controller'))

module.exports = app