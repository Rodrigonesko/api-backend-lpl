const VacationRequest = require('../models/Ferias/VacationRequest')
const User = require('../models/User/User')



module.exports = {

    findAll: async (req, res) => {
        try {
            //Busque todas as solicitacoes

            const encontrarTodos = await VacationRequest.find({

            })

            console.log(encontrarTodos)

            return res.status(200).json({
                encontrarTodos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    createVacationRequest: async (req, res) => {
        try {
            //Crie uma solicitação
            const body = req.body

            if (body.totalDias === '30 dias') {
                const criarRequisicao = await VacationRequest.create({
                    mes: body.mes,
                    vencimento: body.vencimento,
                    colaborador: body.colaborador,
                    dataInicio: body.dataInicio,
                    dataRetorno: body.dataRetorno,
                    totalDias: body.totalDias,
                    expectativa: body.expectativa,
                    statusRH: body.statusRH

                })
            } else if (body.totalDias === '20/10 dias' || body.totalDias === '15/15 dias') {
                const criarRequisicao = await VacationRequest.create({
                    mes: body.mes,
                    vencimento: body.vencimento,
                    colaborador: body.colaborador,
                    dataInicio: body.dataInicio,
                    dataRetorno: body.dataRetorno,
                    totalDias: (body.totalDias === '20/10 dias' ? ('20 dias') : ('15 dias')) ,
                    expectativa: body.expectativa,
                    statusRH: body.statusRH
                })
                const criarRequisicao2 = await VacationRequest.create({
                    mes: body.mes,
                    vencimento: body.vencimento,
                    colaborador: body.colaborador,
                    dataInicio: body.dataInicio2,
                    dataRetorno: body.dataRetorno,
                    totalDias: (body.totalDias === '20/10 dias' ? ('10 dias') : ('15 dias')),
                    expectativa: body.expectativa,
                    statusRH: body.statusRH
                })
            }

            //console.log(criarRequisicao)

            return res.json({
                msg: 'OK'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    }


}