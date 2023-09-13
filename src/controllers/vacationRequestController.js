const VacationRequest = require('../models/Ferias/VacationRequest')
const User = require('../models/User/User')

module.exports = {

    sendRequest: async (req, res) => {
        try {

            //Fazer lógica para poder mandar solicitação

            const body = req.body
            const create = await VacationRequest.create({
                nome: req.user,
                status: 'A Aprovar',
                startDate: body.data,
                modeloSolicitado: body.tipoSolicitacao,
            })
            console.log(create)
            return (res.json(body))
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    getAllRequests: async (req, res) => {
        try {
            const result = await VacationRequest.find()
            console.log(result)
            return (res.json(result))
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    getRequestById: async (req, res) => {
        try {

            //ajustar essa rota

            const params = req.params
            const result = await VacationRequest.findOne({ nome: params.id })
            console.log(result)
            return (res.json(result))
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    getRequestByStatus: async (req, res) => {
        try {

            //Fazer rota para retornar as solicitações de acordo com o status requisitado

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    getMyRequests: async (req, res) => {
        try {

            //Rota para retornar as solicitações de férias de quem está fazendo a requisição

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    analyseRequest: async (req, res) => {
        try {

            //Rota para aprovar ou Recusar solicitação de férias

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

}