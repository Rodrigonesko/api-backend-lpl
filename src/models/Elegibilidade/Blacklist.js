const mongoose = require('mongoose')

const blacklistScheema = mongoose.Schema({
    proposta: String,
    codCorretor: String,
    entidade: String,
    administradora: String,
    cpfCorretor: String,
    nomeCorretor: String,
    telefoneCorretor: String,
    nomeSupervisor: String,
    cpfSupervisor: String,
    telefoneSupervisor: String
})