const mongoose = require("mongoose");
const moment = require('moment')
const ControleAtividade = require('../models/ControleAtividade/ControleAtividade')
const User = require('../models/User')

module.exports = {
    atividadePadrao: async (req, res) => {
        try {
            const { name } = req.body

            const buscarAtividade = await User.findOne({
                name
            })

            const atividadePrincipal = buscarAtividade.atividadePrincipal

            const find = await ControleAtividade.findOne({
                data: moment().format('YYYY-MM-DD'),
                analista: name
            })

            if(find){
                return res.status(200).json({
                    msg: 'Dia já iniciado'
                })
            }

            // const create = await ControleAtividade.create({
            //     analista: name,
            //     atividade: atividadePrincipal,
            //     horarioInicio: moment().format('')
            // })

            return res.status(200).json({
                msg: 'oi'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    }
}