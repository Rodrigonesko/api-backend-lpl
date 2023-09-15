const VacationRequest = require('../models/Ferias/VacationRequest')
const User = require('../models/User/User')

module.exports = {

    findAll: async (req, res) => {
        try {

            //Busque todas as solicitacoes

            return res.json({
                msg: 'ok'
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

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    }


}