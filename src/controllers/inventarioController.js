const Inventario = require('../models/Inventario/Inventario')

module.exports = {

    findAll: async (req, res) => {
        try {
            const encontrarTodos = await Inventario.find()

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
            const result = await Inventario.updateOne({ _id: req.body._id }, { status: req.body.status })
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

    createInventario: async (req, res) => {
        try {

            //Crie uma solicitação

            const body = req.body

            const result = await Inventario.findOne({
                etiqueta: body.etiqueta,
            })

            if (result) {
                return res.status(403).json({
                    msg: "Etiqueta already exists."
                })
            }

            const criarRequisicao = await Inventario.create({
                nome: body.nome,
                quantidade: body.quantidade,
                etiqueta: body.etiqueta,
                ondeEsta: body.ondeEsta,
                descricao: body.descricao,
                status: body.status
            })

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

    getInventarioByFilter: async (req, res) => {
        try {

            const { nomeItem, ondeEsta, etiqueta } = req.query

            console.log(req.query);

            const result = await Inventario.find({
                nome: { $regex: new RegExp(nomeItem, 'i') },
                ondeEsta: { $regex: new RegExp(ondeEsta, 'i') },
                etiqueta: { $regex: etiqueta }
            })

            console.log(result);

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    updateInventarioTable: async (req, res) => {
        try {
            const find = await Inventario.findOne({ _id: req.body._id })
            const criarRequisicao = await Inventario.updateOne({ _id: req.body._id }, {
                nome: req.body.nome,
                etiqueta: req.body.etiqueta,
                ondeEsta: req.body.ondeEsta,
                descricao: req.body.descricao
            })
            return res.json(criarRequisicao)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    }

}