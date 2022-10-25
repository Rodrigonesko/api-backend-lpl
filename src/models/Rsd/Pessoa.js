const mongoose = require('mongoose')

const pessoaScheema = mongoose.Schema({
    cpf: String,
    nome: String,
    dataNascimento: String,
    email: String,
    fone1: String,
    fone2: String,
    fone3: String,
    ativo: Boolean,
    plano: String,
    atualizarDados: Boolean,
    contratoEmpresa: String,
    mo: String
}, {
    timestamps: true
})

module.exports = mongoose.model('Pessoa', pessoaScheema)