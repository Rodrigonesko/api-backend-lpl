const mongoose = require('mongoose')

const pedidoScheema = mongoose.Schema({
    numero: String,
    idProtocolo: String,
    valorApresentado: String,
    valorReembolsado: String,
    dataSla: String,
    ativo: Boolean,
    idStatus: String,
    
})