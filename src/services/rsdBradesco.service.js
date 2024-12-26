const axios = require("axios")
const moment = require("moment");
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET
const RSDBRADESCO = process.env.RSD_BRADESCO_ADDRESS

module.exports = {
    producaoIndividualBradesco: async (dataInicio = moment().format('YYYY-MM-DD'), dataFim = moment().format('YYYY-MM-DD')) => {
        try {
            const token = jwt.sign({ username: 'admin' }, secret)
            const response = await axios.get(`http://localhost:5002/pacote/analiticoRsdBradesco?dataInicio=${dataInicio}&dataFim=${dataFim}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            console.log(response.data)
            return response.data
        } catch (error) {
            throw error
        }
    }
}