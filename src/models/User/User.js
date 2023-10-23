const mongoose = require('mongoose')

const userScheema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    accessLevel: String,
    firstAccess: String,
    enfermeiro: String,
    elegibilidade: String,
    rsd: Boolean,
    horarioEntrada1: String,
    horarioSaida1: String,
    horarioEntrada2: String,
    horarioSaida2: String,
    atividadePrincipal: String,
    atividadeAtual: String,
    coren: String,
    ajusteHorarios: Boolean,
    politicasLidas: [],
    dataAdmissao: String,
    treinamentos: [],
    bancoHoras: String,
    vencimentoFerias: [],
    nomeCompleto: String,
    dataBancoHoras: String,
    dataAniversario: String
    acessos: {
        administrador: Boolean,
        agendamento: Boolean
    }
},
    {
        versionKey: false
    })

module.exports = mongoose.model('User', userScheema)