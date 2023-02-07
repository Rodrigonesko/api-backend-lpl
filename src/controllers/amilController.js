const mongoose = require('mongoose')
const Amil = require('../models/Amil/Amil')

module.exports = {
    insert: async (req, res) => {
        try {

            const {pedidos} = req.body

            console.log(pedidos);

            return res.status(200).json({
                msg: 'oi'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    }
}