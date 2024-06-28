const DadosEntrevista = require('../models/TeleEntrevista/DadosEntrevista');

class FinalizarEntrevistaUsecase {
    async execute(id, respostas, cids, cidsDs, pessoa, divergencia, qualDivergencia, motivoBeneficiario, tea) {
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
        });

        //Migrar patologias para motivo beneficiario

        const find = await DadosEntrevista.findOne({
            idProposta: id
        }).lean()
        console.log(respostasConcatenadas);
        if (!find) {
            return await DadosEntrevista.create({
                ...respostasConcatenadas,
                idProposta: id,
                cids,
                cidsDs,
                houveDivergencia: divergencia,
                divergencia: qualDivergencia,
                motivoBeneficiario,
                tea
            })
        } else {
            return await DadosEntrevista.updateOne({
                idProposta: id
            }, {
                ...respostasConcatenadas,
                cids,
                cidsDs,
                houveDivergencia: divergencia,
                divergencia: qualDivergencia,
                motivoBeneficiario,
                tea,

            })
    }
}
}

module.exports = new FinalizarEntrevistaUsecase();