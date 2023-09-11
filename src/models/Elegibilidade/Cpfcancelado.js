const mongoose = require('mongoose')

const scheema = new mongoose.Schema({
    proposta: String,
    codCorretor: String,
    entidade: String,
    administradora: String,
    cpfCorretor: String,
    nomeCorretor: String,
    telefoneCorretor: String,
    nomeSupervisor: String,
    cpfSupervisor: String,
    telefoneSupervisor: String,
    motivoCancelamento: String,
    categoriaCancelamento: String,
    evidenciaFraude: String
})

module.exports = mongoose.model('CpfCancelado', scheema)