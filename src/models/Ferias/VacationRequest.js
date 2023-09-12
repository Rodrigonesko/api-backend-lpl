const mongoose = require('mongoose')

const Scheema = new mongoose.Schema({
    nome: String,
    idFuncionario: String,
    email: String,
    modeloSolicitado: String,
    startDate: String,
    endDate: String,
    status: String,
    periodo: String
})

const VacationRequest = mongoose.model('VacationRequest', Scheema)

module.exports = VacationRequest