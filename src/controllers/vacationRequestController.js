const VacationRequest = require('../models/Ferias/VacationRequest')
const User = require('../models/User/User')
const moment = require('moment')


module.exports = {

    findAll: async (req, res) => {
        try {
            const encontrarTodos = await VacationRequest.find({
            }).sort({ dataInicio: -1 })
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
            const result = await VacationRequest.updateOne({ _id: req.body._id }, { statusRh: req.body.statusRh })
            return res.status(200).json({
                msg: result
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

            const find = await User.findOne({
                $or: [
                    { nomeCompleto: body.colaborador },
                    { name: body.colaborador }
                ]
            })

            const indexVencimento = find.vencimentoFerias.length - 1
            const vencimentoFerias = find.vencimentoFerias

            if (!vencimentoFerias[indexVencimento]?.anoVencimento) {
                return res.status(400).json({
                    msg: 'Colaborador não tem direito as férias por enquanto, verifique a data de admissão'
                })
            }

            const dataVencimento = moment(find.dataAdmissao).year(vencimentoFerias[indexVencimento].anoVencimento)


            if (vencimentoFerias[indexVencimento].tirouFerias) {
                return res.status(400).json({
                    msg: 'Colaborador ja retirou as ferias'
                })
            }

            await User.updateOne({
                _id: find._id,
                "vencimentoFerias.anoVencimento": vencimentoFerias[0].anoVencimento
            }, {
                $set: {
                    'vencimentoFerias.$.tirouFerias': true
                }
            })

            if (body.totalDias === '30 dias') {
                const data = moment(body.dataInicio).add(29, 'day').format('DD/MM/YYYY')
                const criarRequisicao = await VacationRequest.create({
                    mes: data,
                    vencimento: dataVencimento.format('YYYY-MM-DD'),
                    colaborador: body.colaborador,
                    dataInicio: body.dataInicio,
                    dataRetorno: data,
                    totalDias: body.totalDias,
                    statusRh: body.statusRh
                })
            } else if (body.totalDias === '20/10 dias' || body.totalDias === '15/15 dias') {
                const data = moment(body.dataInicio).add(19, 'day').format('DD/MM/YYYY')
                const data2 = moment(body.dataInicio).add(14, 'day').format('DD/MM/YYYY')
                const criarRequisicao = await VacationRequest.create({
                    mes: body.mes,
                    vencimento: dataVencimento.format('YYYY-MM-DD'),
                    colaborador: body.colaborador,
                    dataInicio: body.dataInicio,
                    dataRetorno: (body.totalDias === '20/10 dias' ? (data) : (data2)),
                    totalDias: (body.totalDias === '20/10 dias' ? ('20 dias') : ('15 dias')),
                    statusRh: body.statusRh
                })
                const data3 = moment(body.dataInicio2).add(9, 'day').format('DD/MM/YYYY')
                const data4 = moment(body.dataInicio2).add(14, 'day').format('DD/MM/YYYY')
                const criarRequisicao2 = await VacationRequest.create({
                    mes: body.mes,
                    vencimento: dataVencimento.format('YYYY-MM-DD'),
                    colaborador: body.colaborador,
                    dataInicio: body.dataInicio2,
                    dataRetorno: (body.totalDias === '20/10 dias' ? (data3) : (data4)),
                    totalDias: (body.totalDias === '20/10 dias' ? ('10 dias') : ('15 dias')),
                    statusRh: body.statusRh
                })
            } else if (body.totalDias === '20/10 dias vendidos') {
                const data = moment(body.dataInicio).add(19, 'day').format('DD/MM/YYYY')
                const criarRequisicao3 = await VacationRequest.create({
                    mes: data,
                    vencimento: dataVencimento.format('YYYY-MM-DD'),
                    colaborador: body.colaborador,
                    dataInicio: body.dataInicio,
                    dataRetorno: data,
                    totalDias: body.totalDias,
                    statusRh: body.statusRh
                })
            }
            return res.json({
                msg: 'OK'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }

    },

    getFeriasByFilter: async (req, res) => {
        try {

            const { colaborador, mes, vencimento } = req.query

            console.log(req.query);

            const result = await VacationRequest.find({

                colaborador: { $regex: colaborador },
                dataInicio: { $regex: mes },
                vencimento: { $regex: vencimento }
            }).sort({ dataInicio: -1 })

            console.log(result);

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    updateVacationTable: async (req, res) => {
        try {
            const find = await VacationRequest.findOne({ _id: req.body._id })
            const quatidadeDias = find.totalDias
            const data = moment(req.body.data).add(quatidadeDias.split(' ')[0], 'day').format('DD/MM/YYYY')
            console.log(quatidadeDias)
            const criarRequisicao = await VacationRequest.updateOne({ _id: req.body._id }, { dataInicio: req.body.data, dataRetorno: data })
            return res.json(criarRequisicao)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    }
}
