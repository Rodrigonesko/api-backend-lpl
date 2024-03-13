const Agenda = require("../models/Agenda/Agenda")

module.exports = {

    createAgenda: async (req, res) => {
        try {

            const { nome, quantidadeRepeticao, dataInicio, descricao } = req.body

            console.log(req.body);

            const create = await Agenda.create({
                nome,
                quantidadeRepeticao,
                dataInicio,
                descricao,
            })

            return res.status(200).json({
                create
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    getAgenda: async (req, res) => {
        try {
            const find = await Agenda.find()
            console.log(find);

            return res.status(200).json({ find })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    }
}