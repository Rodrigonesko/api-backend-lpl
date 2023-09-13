const VacationRequest = require('../models/Ferias/VacationRequest')
const User = require('../models/User/User')

module.exports = {

    verifyRequest: async (req, res) => {
        try {

        } catch (error) {

        }
    },

    sendRequest: async (req, res) => {
        try {
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
            console.log(error)
            return res.status(500).json({ error })

        }
    },

    getAllRequests: async (req, res) => {
        try {
            const result = await VacationRequest.find()
            console.log(result)
            return (res.json(result))
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error })

        }
    },

    getRequestById: async (req, res) => {
        try {

            const params = req.params
            const result = await VacationRequest.findOne({ nome: params.id })
            console.log(result)
            return (res.json(result))
        } catch (error) {
            console.log(error)
            return res.status(500).json({ error })
        }
    },

    approveRequest: async (req, res) => {
        try {

            if (res === body) {
                const body = req.body
                console.log(body.resposta)

                return res.json({ mensagem: 'oi' })

            } else {
                console.log(error)
                return res.status(500).json({ error })

            }
        } catch (error) {

        }
    },

    denyRequest: async (req, res) => {
        try {

        } catch (error) {

        }
    }
}