const axios = require("axios")
const moment = require("moment");
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET
const SULAMERICA = 'http://localhost:5001'
// process.env.SUL_AMERICA_ADDRESS

module.exports = {
    producaoIndividualSulAmerica: async (dataInicio = moment().format('YYYY-MM-DD'), dataFim = moment().format('YYYY-MM-DD')) => {
        try {
            const token = jwt.sign({ username: 'admin' }, secret)
            const response = await axios.get(`${SULAMERICA}/pedido/pedidosConcluidosPorResponsavel?dataInicio=${dataInicio}&dataFim=${dataFim}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            console.log(response.data)
            return response.data
        } catch (error) {
            throw error
        }
    }
}