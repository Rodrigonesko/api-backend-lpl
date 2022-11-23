const mongoose = require('mongoose')

const dadosEntrevistaScheema = mongoose.Schema({
    nome: String,
    cpf: String,
    dataNascimento: Date,
    dataEntrevista: Date,
    proposta: String,
    tipoFormulario: String,
    profissao: String,
    carteiraVacina: String,
    maFormacao: String,
    tratamento: String,
    espectro: String,
    deficitAtencao: String,
    preenchimentoDps: String
})

module.exports = mongoose.model('DadosEntrevista', dadosEntrevistaScheema)