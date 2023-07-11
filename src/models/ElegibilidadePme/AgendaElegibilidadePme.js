const mongoose = require('mongoose')

const agendaElegiScheema = mongoose.Schema({
    comentario: String,
    analista: String,
    proposta: String,
    data: String
}, {
    timestamps: true
})

module.exports = mongoose.model('AgendaElegibilidadePme', agendaElegiScheema)