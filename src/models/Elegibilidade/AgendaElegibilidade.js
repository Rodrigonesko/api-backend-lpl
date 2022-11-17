const mongoose = require('mongoose')

const agendaElegiScheema = mongoose.Schema({
    comentario: String,
    analista: String,
    proposta: String
}, {
    timestamps: true
})

module.exports = mongoose.model('AgendaElegibilidade', agendaElegiScheema)