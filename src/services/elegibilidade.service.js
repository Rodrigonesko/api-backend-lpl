const moment = require("moment");
const PropostasElegiblidade = require("../models/Elegibilidade/PropostasElegiblidade");

module.exports = {
    producaoIndividualElegibilidade: async (dataInicio = moment().format('YYYY-MM-DD'), dataFim = moment().format('YYYY-MM-DD')) => {
        try {

            const propostas = await PropostasElegiblidade.find({
                dataConclusao: {
                    $gte: dataInicio,
                    $lte: dataFim
                }
            }, {
                analista: 1,
                status: 1,
            }).lean()

            let producao = []

            for (const proposta of propostas) {
                const index = producao.findIndex(p => p.analista === proposta.analista)

                if (index === -1) {
                    producao.push({
                        analista: proposta.analista,
                        total: 1,
                        implantadas: proposta.status === 'Implantada' || proposta.status === 'Enviada para Under',
                        canceladas: proposta.status === 'Cancelada',
                        devolvidas: proposta.status === 'Devolvida',
                    })
                } else {
                    producao[index].total += 1
                    producao[index].implantadas += proposta.status === 'Implantada' || proposta.status === 'Enviada para Under'
                    producao[index].canceladas += proposta.status === 'Cancelada'
                    producao[index].devolvidas += proposta.status === 'Devolvida'
                }
            }

            return producao.sort((a, b) => b.total - a.total)

        } catch (error) {
            throw error
        }
    }
}