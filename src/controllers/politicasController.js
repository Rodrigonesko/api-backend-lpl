const Politica = require("../models/Politicas/Politica")

const moment = require('moment')
const fs = require('fs')
const multer = require('multer')

const upload = (versao) => multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = `./uploads/politicas/`
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
        filename: (req, file, cb) => {
            const { politica } = req.params;
            const fileName = `${politica}-${versao}.pdf`;
            console.log(politica, versao);
            cb(null, fileName);
        }
    })
}).single('file');

module.exports = {
    create: async (req, res) => {
        try {

            const { politica } = req.params;
            const politicas = await Politica.find({ nome: politica });

            console.log(politicas);

            upload(politicas.length + 1)(req, res, async (err) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (politicas.length === 0) {
                    await Politica.create({
                        nome: politica,
                        versao: 1,
                        dataCriacao: moment().format('YYYY-MM-DD'),
                        arquivo: `/politicas/${politica}-1.pdf`,
                        inativo: false
                    });
                    return;
                }

                await Politica.updateMany({ nome: politica }, { inativo: true });

                await Politica.create({
                    nome: politica,
                    versao: politicas.length + 1,
                    dataCriacao: moment().format('YYYY-MM-DD'),
                    arquivo: `/politicas/${politica}-${politicas.length + 1}.pdf`,
                    inativo: false
                });
            });

            return res.json({
                msg: 'ok'
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    show: async (req, res) => {
        try {

            const result = await Politica.find().sort({ createdAt: -1 })

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    showActive: async (req, res) => {
        try {

            const result = await Politica.find({
                inativo: { $ne: true }
            })

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    showPolitica: async (req, res) => {
        try {

            const { id } = req.params

            const result = await Politica.findOne({
                _id: id
            })

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    assinarPolitica: async (req, res) => {
        try {
            
            const {id} = req.body

            console.log(id);

            await Politica.updateOne({
                _id: id
            }, {
                $push: {
                    assinaturas: {
                        nome: req.user,
                        data: moment().format('YYYY-MM-DD HH:mm:ss')
                    }
                }
            })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    }
}