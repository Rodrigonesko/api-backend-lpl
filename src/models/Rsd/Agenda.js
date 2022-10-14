const mongoose = require('mongoose')

const AgendaScheema = mongoose.Schema({
    idPacote: String,
    dataParecer: String,
    idUsuario: String,
    tipo: String,
    parecer: String
}, {
    timestamps: true
})

module.exports = mongoose.model('AgendaRsd', AgendaScheema)