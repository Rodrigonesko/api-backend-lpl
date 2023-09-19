const mongoose = require('mongoose')

const Scheema = new mongoose.Schema({
    vencimento: String,
    colaborador: String,
    dataVencimento: String,
    dataInicio: String,
    dataRetorno: String,
    totalDias: String,
    expectativa: String,
    statusRh: String,
    solicitado: Boolean,
    assinado: Boolean,
    realizado: Boolean,
    status: String
}, {
    timestamps: true
})

const VacationRequest = mongoose.model('VacationRequest', Scheema)

module.exports = VacationRequest