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

            //Migrar patologias para motivo beneficiario

            const find = await DadosEntrevista.findOne({
                idProposta: id
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
                    tea
                })
                await PropostaEntrevista.updateOne({
                    _id: id
                }, {
                    status: 'Concluído',
                    dataConclusao: moment().format('YYYY-MM-DD HH:mm:ss'),
                    enfermeiro: responsavel,
                    newStatus: 'Concluído',
                    dadosEntrevista: create._id
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
                    tea,
                }, {
                    new: true
                })
                await PropostaEntrevista.updateOne({
                    _id: id
                }, {
                    status: 'Concluído',
                    dataConclusao: moment().format('YYYY-MM-DD HH:mm:ss'),
                    enfermeiro: responsavel,
                    newStatus: 'Concluído',
                    dadosEntrevista: update._id
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