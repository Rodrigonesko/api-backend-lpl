const VacationRequest = require('../models/Ferias/VacationRequest')
const User = require('../models/User/User')
const moment = require('moment')


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

    setStatusRh: async (req, res) => {
        try {
            console.log(req.body)
            const pegarStatus = await VacationRequest.updateOne({_id: req.body._id}, {statusRh: req.body.statusRh})

            console.log(pegarStatus)

            return res.status(200).json({
                msg: 'OK'
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
                const data = moment(body.dataInicio).add(30, 'day').format('DD/MM/YYYY')
                const criarRequisicao = await VacationRequest.create({
                    mes: data,
                    vencimento: body.vencimento,
                    colaborador: body.colaborador,
                    dataInicio: body.dataInicio,
                    dataRetorno: data,
                    totalDias: body.totalDias,
                    statusRh: body.statusRh
                })
            } else if (body.totalDias === '20/10 dias' || body.totalDias === '15/15 dias') {
                const data = moment(body.dataInicio).add(20, 'day').format('DD/MM/YYYY')
                const data2 = moment(body.dataInicio).add(15, 'day').format('DD/MM/YYYY')
                const criarRequisicao = await VacationRequest.create({
                    mes: body.mes,
                    vencimento: body.vencimento,
                    colaborador: body.colaborador,
                    dataInicio: body.dataInicio,
                    dataRetorno: (body.totalDias === '20/10 dias' ? (data) : (data2)),
                    totalDias: (body.totalDias === '20/10 dias' ? ('20 dias') : ('15 dias')),
                    statusRh: body.statusRh
                })
                const data3 = moment(body.dataInicio2).add(10, 'day').format('DD/MM/YYYY')
                const data4 = moment(body.dataInicio2).add(15, 'day').format('DD/MM/YYYY')
                const criarRequisicao2 = await VacationRequest.create({
                    mes: body.mes,
                    vencimento: body.vencimento,
                    colaborador: body.colaborador,
                    dataInicio: body.dataInicio2,
                    dataRetorno: (body.totalDias === '20/10 dias' ? (data3) : (data4)),
                    totalDias: (body.totalDias === '20/10 dias' ? ('10 dias') : ('15 dias')),
                    statusRh: body.statusRh
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
