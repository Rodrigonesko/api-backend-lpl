const mongoose = require('mongoose')

const userScheema = new mongoose.Schema({
    name: String,
    matricula: String,
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
    coren: String,
    politicasLidas: [],
    dataAdmissao: String,
    treinamentos: [],
    bancoHoras: String,
    vencimentoFerias: [],
    nomeCompleto: String,
    dataBancoHoras: String,
    dataAniversario: String,
    acessos: {
        administrador: Boolean,
        agendamento: Boolean,
        sulAmerica: Boolean,
        ssi: Boolean,
    },
    horarioSaida: String,
    online: Boolean,
    socketId: String,
    admissao: [],
    demissao: [],
    status: String,
    data: String,
    inativo: Boolean,
    prorrogacao: Boolean,
    deFerias: Boolean,
    ausencias: [],
    dataAusencia: String,
    dataDemissao: String,
    dataAtualizacaoPassword: String
},
    {
        versionKey: false
    })

module.exports = mongoose.model('User', userScheema)