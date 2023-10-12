const Recados = require('../models/Mural/Recado')
const path = require('path')
const fs = require('fs')
const multer = require('multer')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/mural/'
        if (!fs.existsSync(dir)) {
            fs.mkdir(dir, (err) => {
                if (err) {
                    console.log("Algo deu errado", err);
                    return
                }
                console.log("Diretório criado!")
            })
        }
        cb(null, dir)
    },

    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const uploadFiles = multer({ storage }).array('files', 10)

module.exports = {

    create: async (req, res) => {
        try {

            uploadFiles(req, res, async (err) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        msg: 'Erro ao fazer upload de arquivos.'
                    });
                }

                const { texto, titulo } = req.body;
                const files = req.files; // Aqui você pode acessar os arquivos enviados

                const fileNames = files.map(file => {
                    return file.filename
                })

                await Recados.create({
                    texto,
                    arquivos: fileNames,
                    responsavel: req.user,
                    titulo
                })

                // Faça o que precisar com os arquivos e outros dados

                return res.json({
                    msg: 'Arquivos enviados com sucesso.'
                });
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    getAllRecados: async (req, res) => {
        try {

            const result = await Recados.find({}).sort({ createdAt: -1 }).lean()

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    destroy: async (req, res) => {
        try {

            const { id } = req.params

            const result = await Recados.deleteOne({
                _id: id
            })

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    }
}