const PropostaElegibilidadePme = require("../models/ElegibilidadePme/PropostaElegibilidadePme")
const moment = require("moment");
const User = require("../models/User/User");
const userService = require("./user.service");

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

            const users = await userService.getUsersFaltasByDate(dataInicio, dataFim)

            let producaoPme = []

            for (const propostaPme of PropostasPme) {
                const index = producaoPme.findIndex(p => p.analista === propostaPme.analista)

                if (index === -1) {
                    const ausenciasUsuario = users.filter(usuario => usuario.name === propostaPme.analista);
                    const totalFaltas = ausenciasUsuario.length > 0 ? ausenciasUsuario.length : 0;

                    producaoPme.push({
                        analista: propostaPme.analista,
                        total: 1,
                        concluidas: propostaPme.status === 'Concluido' ? 1 : 0,
                        devolvidas: propostaPme.status === 'Devolvida' ? 1 : 0,
                        redistribuidas: propostaPme.status === 'Redistribuído' ? 1 : 0,
                        aIniciar: propostaPme.status === 'A iniciar' ? 1 : 0,
                        faltas: totalFaltas
                    })
                } else {
                    producaoPme[index].total += 1
                    producaoPme[index].concluidas += propostaPme.status === 'Concluido' ? 1 : 0
                    producaoPme[index].devolvidas += propostaPme.status === 'Devolvida' ? 1 : 0
                    producaoPme[index].redistribuidas += propostaPme.status === 'Redistribuído' ? 1 : 0
                    producaoPme[index].aIniciar += propostaPme.status === 'A iniciar' ? 1 : 0
                }
            }
            // console.log(producaoPme.sort((a, b) => b.total - a.total));

            return producaoPme.sort((a, b) => b.total - a.total)

        } catch (error) {
            throw error
        }
    }
}