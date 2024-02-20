const mongoose = require('mongoose')

const DemandaSchema = new mongoose.Schema({
    codigo: String,
    demandaId: String,
    servico: String,
    beneficiarios: [String],
    prestadores: [String],
    dataInicio: String,
    dataFim: String,
    agenda: [],
    irregularidades: [String],
    justificativa: String,
    dadosDemanda: Object
}, {
    timestamps: true
})

module.exports = mongoose.model('Demanda', DemandaSchema)