const toDo = require('../models/toDo/toDo')
const User = require('../models/User/User')
const moment = require('moment')


module.exports = {

    newToDo: async (req, res) => {
        try {

            const { _id } = req.body
            //Crie uma solicitação

            const body = req.body

            const find = await User.findOne({
                $or: [
                    { nomeCompleto: body.colaborador },
                    { name: body.colaborador }
                ]
            })
            const criarRequisicao = [
                {
                    nome: body.nome,
                    dataConclusao: body.dataConclusao,
                    tarefa: body.tarefa,
                    tipoCriacao: body.tipoCriacao,
                },
            ]

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
