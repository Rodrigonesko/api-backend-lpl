const Politica = require("../models/Politicas/Politica")

const moment = require('moment')
const fs = require('fs')
const multer = require('multer')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {

        const dir = `./uploads/politicas/`
        if (!fs.existsSync(dir)) {
            fs.mkdir(dir, (err) => {
                if (err) {
                    console.log(err);
                    return
                }
                console.log('diretório criado com sucesso');
            })
        }
        cb(null, dir)

    },
    filename: (req, file, cb) => {

        const { politica, versao } = req.params

        const fileName = `${politica}-${versao}.pdf`

        console.log(politica, versao);


        cb(null, fileName)

    }
})

const upload = multer({ storage }).single('file')

module.exports = {
    create: async (req, res) => {
        try {

            const { politica } = req.params

            const politicas = await Politica.find({
                nome: politica
            })

            console.log(politicas);

            upload(req, res, async (err) => {
                if (err) {
                    console.log(err);
                    return
                }

                if (politicas.length === 0) {
                    await Politica.create({
                        nome: politica,
                        versao: 1,
                        dataCriacao: moment().format('YYYY-MM-DD'),
                        arquivo: `/politicas/${politica}-1.pdf`,
                        inativo: false
                    })

                    return
                }

                await Politica.updateMany({
                    politica
                }, {
                    inativo: true
                })

                await Politica.create({
                    nome: politica,
                    versao: politicas.length + 1,
                    dataCriacao: moment().format('YYYY-MM-DD'),
                    arquivo: `/politicas/${politica}-${politicas.length + 1}.pdf`,
                    inativo: false
                })

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
    },

    show: async (req, res) => {
        try {

            const result = await Politica.find()

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },
}