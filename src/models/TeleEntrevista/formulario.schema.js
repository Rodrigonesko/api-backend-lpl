const mongoose = require('mongoose')

const formularioSchema = new mongoose.Schema({
    proposta: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposta' },
    respostas: [{
        pergunta: { type: mongoose.Schema.Types.ObjectId, ref: 'Pergunta' },
        resposta: String
    }],
    cids: [{
        cid: { type: mongoose.Schema.Types.ObjectId, ref: 'Cid' }
    }],
    entrevistaQualidade: { type: Boolean, default: false },
    
}, {
    timestamps: true
})
