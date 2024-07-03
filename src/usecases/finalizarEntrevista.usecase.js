const DadosEntrevista = require('../models/TeleEntrevista/DadosEntrevista');
const PropostaEntrevista = require('../models/TeleEntrevista/PropostaEntrevista');
const moment = require('moment');

class FinalizarEntrevistaUsecase {
    async execute(id, respostas, cids, cidsDs, divergencia, qualDivergencia, motivoBeneficiario, tea, responsavel) {
        try {
            const respostasConcatenadas = Object.keys(respostas).map(key => {
                let respostasConcatenadas = ``;
                Object.keys(respostas[key]).forEach(keyRes => {
                    if (keyRes === 'resposta') {
                        respostasConcatenadas += respostas[key][keyRes];
                    } else {
                        respostasConcatenadas += `\n${keyRes} ${respostas[key][keyRes]}`
                    }
                });
                return {
                    [key]: respostasConcatenadas
                }
            }).reduce((acc, cur) => {
                return {
                    ...acc,
                    ...cur
                }
            }, {});



            const find = await DadosEntrevista.findOne({
                idProposta: id,
                cancelado: false
            }).lean()

            if (!find) {
                const create = await DadosEntrevista.create({
                    ...respostasConcatenadas,
                    idProposta: id,
                    cidsAjustados: cids,
                    cidsDs,
                    houveDivergencia: divergencia,
                    divergencia: qualDivergencia,
                    motivoBeneficiario,
                    patologias: motivoBeneficiario,
                    tea,
                    responsavel,
                    dataEntrevista: moment().format('YYYY-MM-DD HH:mm:ss')
                })
                const proposta = await PropostaEntrevista.findOneAndUpdate({
                    _id: id
                }, {
                    status: 'Concluído',
                    dataConclusao: moment().format('YYYY-MM-DD HH:mm:ss'),
                    enfermeiro: responsavel,
                    newStatus: 'Concluído',
                    dadosEntrevista: create._id
                })
                await DadosEntrevista.updateOne({
                    _id: create._id
                }, {
                    tipoFormulario: proposta.formulario,
                    cpf: proposta.cpf,
                    nome: proposta.nome,
                    proposta: proposta.proposta,
                    dataNascimento: proposta.dataNascimento,
                    tipoContrato: proposta.tipoContrato,
                    sexo: proposta.sexo,
                    idade: proposta.idade,
                    vigencia: proposta.vigencia,
                    dataRecebimento: proposta.dataRecebimento,
                    filial: proposta.filial,
                    administradora: proposta.administradora,
                })
                return create;
            } else {
                const update = await DadosEntrevista.findOneAndUpdate({
                    idProposta: id
                }, {
                    ...respostasConcatenadas,
                    cidsAjustados: cids,
                    cidsDs,
                    houveDivergencia: divergencia,
                    divergencia: qualDivergencia,
                    motivoBeneficiario,
                    patologias: motivoBeneficiario,
                    responsavel,
                    tea,
                    dataEntrevista: moment().format('YYYY-MM-DD HH:mm:ss')
                }, {
                    new: true
                })
                const proposta = await PropostaEntrevista.updateOne({
                    _id: id
                }, {
                    status: 'Concluído',
                    dataConclusao: moment().format('YYYY-MM-DD HH:mm:ss'),
                    enfermeiro: responsavel,
                    newStatus: 'Concluído',
                    dadosEntrevista: update._id
                })

                await DadosEntrevista.updateOne({
                    _id: update._id
                }, {
                    tipoFormulario: proposta.formulario,
                    cpf: proposta.cpf,
                    nome: proposta.nome,
                    proposta: proposta.proposta,
                    dataNascimento: proposta.dataNascimento,
                    tipoContrato: proposta.tipoContrato,
                    sexo: proposta.sexo,
                    idade: proposta.idade,
                    vigencia: proposta.vigencia,
                    dataRecebimento: proposta.dataRecebimento,
                    filial: proposta.filial,
                    administradora: proposta.administradora,
                })
                return update;
            }

        } catch (error) {
            console.log(error);
            throw new Error('Erro ao finalizar entrevista', error);
        }

    }
}

module.exports = new FinalizarEntrevistaUsecase();