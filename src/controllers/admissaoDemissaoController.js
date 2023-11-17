const AdmissaoDemissao = require('../models/AdmissaoDemissao/AdmissaoDemissao')
const User = require('../models/User/User')

module.exports = {

    findAll: async (req, res) => {
        try {
            const encontrarTodos = await AdmissaoDemissao.find({
            })

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

    setStatus: async (req, res) => {
        try {
            const result = await AdmissaoDemissao.updateOne({ _id: req.body._id }, { status: req.body.status })
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

    infoUser: async (req, res) => {
        try {

            const user = await User.findOne({ email: req.email })

            return res.status(200).json({
                user
            })

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
}