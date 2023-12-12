const ContingenciasIncidentes = require("../models/ContingenciasIncidentes/ContingenciasIncidentes")

const moment = require('moment')
const fs = require('fs')
const multer = require('multer')

const upload = (versao) => multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = `./uploads/contingencias/`
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
            const { contingencia } = req.params;
            const fileName = `${contingencia}-${versao}.pdf`;
            console.log(contingencia, versao);
            cb(null, fileName);
        }
    })
}).single('file');

module.exports = {
    create: async (req, res) => {
        try {

            const { contingencia } = req.params;
            const contingencias = await ContingenciasIncidentes.find({ nome: contingencia });

            console.log(contingencias);

            upload(contingencias.length + 1)(req, res, async (err) => {
                if (err) {
                    console.log(err);
                    return;
                }

                if (contingencias.length === 0) {
                    await ContingenciasIncidentes.create({
                        nome: contingencia,
                        versao: 1,
                        dataCriacao: moment().format('YYYY-MM-DD'),
                        arquivo: `/contingencias/${contingencia}-1.pdf`,
                        inativo: false
                    });
                    return;
                }

                await ContingenciasIncidentes.updateMany({ nome: contingencia }, { inativo: true });

                await ContingenciasIncidentes.create({
                    nome: contingencia,
                    versao: contingencias.length + 1,
                    dataCriacao: moment().format('YYYY-MM-DD'),
                    arquivo: `/contingencias/${contingencia}-${contingencias.length + 1}.pdf`,
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

            const result = await ContingenciasIncidentes.find().sort({ createdAt: -1 })

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },
}