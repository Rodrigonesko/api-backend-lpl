const Inventario = require('../models/Inventario/Inventario')
const moment = require('moment');

const fs = require('fs')
const multer = require('multer');
const upload = (versao) => multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = `./uploads/notasFiscais/`
            if (!fs.existsSync(dir)) {
                fs.mkdir(dir, (err) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log('diretório criado com sucesso');
                });
            }
            cb(null, dir);
        },
        filename: async (req, file, cb) => {
            const find = await Inventario.findOne({
                _id: req.params._id
            })
            console.log(find);
            const usuario = find.ondeEsta;
            const { _id } = req.params

            console.log(usuario, req.params);

            const fileName = `${usuario}-${_id}.pdf`;
            cb(null, fileName);
        }
    })
}).single('file');

module.exports = {

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

            // console.log(body);

            const result = await Inventario.findOne({
                etiqueta: body.etiqueta,
            })

            if (result) {
                return res.status(403).json({
                    msg: "Etiqueta already exists."
                })
            }

            if (body.tempoGarantia) {
                const criarRequisicao = await Inventario.create({
                    nome: body.nome,
                    etiqueta: body.etiqueta,
                    ondeEsta: body.ondeEsta,
                    descricao: body.descricao,
                    dataDeCompra: body.dataDeCompra,
                    dataGarantia: moment(body.dataDeCompra).add(body.tempoGarantia, 'month').format('YYYY-MM-DD')
                })
            }

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

            const { nomeItem, ondeEsta, etiqueta, status, page, limit } = req.query
            // console.log(req.query);

            if (limit === undefined) limit = 10
            if (page === undefined) page = 1

            let skip = (page - 1) * limit;

            const result = await Inventario.find({
                nome: { $regex: new RegExp(nomeItem, 'i') },
                ondeEsta: { $regex: new RegExp(ondeEsta, 'i') },
                etiqueta: { $regex: etiqueta },
                status: { $regex: status }
            }).skip(skip).limit(limit)

            const total = await Inventario.find({
                nome: { $regex: new RegExp(nomeItem, 'i') },
                ondeEsta: { $regex: new RegExp(ondeEsta, 'i') },
                etiqueta: { $regex: etiqueta },
                status: { $regex: status }
            }).countDocuments()

            const resultOrdenado = result.sort((a, b) => parseInt(a.etiqueta) - parseInt(b.etiqueta));
            // console.log(resultOrdenado);

            return res.json({ resultOrdenado, total })

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
                descricao: req.body.descricao,
                dataDeCompra: req.body.dataCompra,
                dataGarantia: req.body.dataGarantia,
                serial: req.body.serial,
            })
            return res.json(criarRequisicao)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    updateNotaFiscal: async (req, res) => {
        try {
            const { _id } = req.params

            upload()(req, res, async (err) => {
                if (err) {
                    console.log(err);
                    return
                }

                const result = await Inventario.updateOne({
                    _id: _id,
                }, {
                    $set: {
                        anexado: true,
                    }
                })
                console.log(result);
            })

            return res.json({
                msg: 'ok'
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: 'Internal Server Error'
            })
        }
    },

    findAll: async (req, res) => {
        try {
            
            const find = await Inventario.find()

            return res.status(200).json(find)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: 'Internal Server Error'
            })
        }
    }
}