const PropostaElegibilidadePme = require("../models/ElegibilidadePme/PropostaElegibilidadePme")
const moment = require("moment")

module.exports = {
    producaoIndividualElegibilidadePme: async (dataInicio = moment().format('YYYY-MM-DD'), dataFim = moment().format('YYYY-MM-DD')) => {
        try {

            const PropostasPme = await PropostaElegibilidadePme.find({
                dataRecebimento: {
                    $gte: dataInicio,
                    $lte: dataFim
                }
            }, {
                analista: 1,
                status: 1,
            }).lean()

            let producaoPme = []

            for (const propostaPme of PropostasPme) {
                const index = producaoPme.findIndex(p => p.analista === propostaPme.analista)

                if (index === -1) {
                    producaoPme.push({
                        analista: propostaPme.analista,
                        total: 1,
                        concluidas: propostaPme.status === 'Concluido' ? 1 : 0,
                        devolvidas: propostaPme.status === 'Devolvida' ? 1 : 0,
                    })
                } else {
                    producaoPme[index].total += 1
                    producaoPme[index].concluidas += propostaPme.status === 'Concluido' ? 1 : 0
                    producaoPme[index].devolvidas += propostaPme.status === 'Devolvida' ? 1 : 0
                }
            }

            return producaoPme.sort((a, b) => b.total - a.total)

        } catch (error) {
            throw error
        }
    }
}