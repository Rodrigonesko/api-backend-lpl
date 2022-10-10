const mongoose = require('mongoose')

const userScheema = mongoose.Schema({
    name: String,
    email: String,
    password: String,
    accessLevel: String,
    firstAccess: String,
    liminares: String,
    liminaresAj: String,
    enfermeiro: String,
    elegibilidade: String,
    horarioEntrada1: String,
    horarioSaida1: String,
    horarioEntrada2: String,
    horarioSaida2: String,
},
    {
        versionKey: false
    })

module.exports = mongoose.model('User', userScheema)