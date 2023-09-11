const mongoose = require('mongoose')

const AgendaScheema = new mongoose.Schema({
    idPacote: String,
    usuario: String,
    tipo: String,
    parecer: String
}, {
    timestamps: true
})

module.exports = mongoose.model('AgendaRsd', AgendaScheema)