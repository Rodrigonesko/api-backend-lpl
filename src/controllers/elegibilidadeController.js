const mongoose = require('mongoose')
const Proposta = mongoose.model('PropostasElegibilidade')

const path = require('path')
const moment = require('moment')
const fs = require('fs')
const multer = require('multer')
const os = require('os')

const uploadPropostas = multer({ dest: os.tmpdir() }).single('file')

module.exports = {
    upload: async (req, res) => {
        try {

            uploadPropostas(req, res, async (err) => {

                const { name, ext } = path.parse(req.file.originalname)

                if (ext == '.txt') {
                    let data = fs.readFileSync(req.file.path, { encoding: 'latin1' })
                    let listaArr = data.split('\n');
                    let arrAux = listaArr.map(e => {
                        return e.split('#')
                    })

                    console.log('oii');

                    let propostasBanco = await Proposta.find()

                    for (const item of arrAux) {
                        let vigencia = item[36]
                        let proposta = item[22]
                        let produto = item[6]
                        let plano = item[48]
                        let produtor = item[7]
                        let uf = item[3]
                        if (uf == 'São Paulo') {
                            uf = 'SP'
                        }
                        if (uf == 'Rio de Janeiro') {
                            uf = 'RJ'
                        }
                        if (uf == 'Distrito Federal') {
                            uf = 'DF'
                        }
                        let administradora = item[8]
                        let codCorretor = item[33]
                        let corretor = item[34]
                        let entidade = item[28]

                        if (entidade?.indexOf('UBE') == 0) {
                            entidade = 'UBE'
                        }

                        if (entidade?.indexOf('ASPROFILI') == 0) {
                            entidade = 'ASPROFILI'
                        }

                        let tipoVinculo = item[9]
                        let nome = item[35]
                        let idade = item[37]
                        let numeroVidas = item[46]
                        let valorMedico = item[51]
                        let valorDental = item[52]
                        let valorTotal = item[53]
                        let supervisor = item[21]
                        let situacao = item[44]

                        if (situacao == 'Implantada') {
                            await Proposta.findOneAndUpdate({
                                proposta
                            }, {
                                status: 'Implantada'
                            })
                        }

                        if (situacao == 'Pronta para análise') {
                            await Proposta.findOneAndUpdate({
                                proposta
                            }, {
                                proposta,
                                vigencia,
                                produto,
                                produtor,
                                uf,
                                administradora,
                                codCorretor,
                                corretor,
                                entidade,
                                tipoVinculo,
                                nome,
                                idade,
                                numeroVidas,
                                valorMedico,
                                valorDental,
                                valorTotal,
                                status: 'Análise de Documentos',
                                supervisor,
                                plano
                            }, {
                                upsert: true
                            })
                        }
                    }
                } else {
                    let file = fs.readFileSync(req.file.path)
                }

            })

            return res.status(200).json({
                message: 'oii'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    }
}