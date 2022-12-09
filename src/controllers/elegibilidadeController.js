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

            let qtd = 0

            uploadPropostas(req, res, async (err) => {

                const { name, ext } = path.parse(req.file.originalname)


                if (ext == '.txt') {

                    let data = fs.readFileSync(req.file.path, { encoding: 'latin1' })
                    let listaArr = data.split('\n');
                    let arrAux = listaArr.map(e => {
                        return e.split('#')
                    })

                    for (const item of arrAux) {
                        let vigencia = item[36]
                        vigencia = ajustarData(vigencia)
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

                            const find = await Proposta.findOne({
                                proposta
                            })

                            console.log(find);

                            if (!find) {
                                console.log('oii');
                                await Proposta.create({
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
                                    plano,
                                    dataImportacao: moment(new Date).format('YYYY-MM-DD')
                                })

                                qtd++
                            }
                        }
                    }
                } else {
                    let file = fs.readFileSync(req.file.path)
                }

            })

            console.log(qtd);

            return res.status(200).json({
                qtd
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    mostrarAnaliseDoc: async (req, res) => {
        try {

            const propostas = await Proposta.find({
                status: 'Análise de Documentos'
            })

            return res.status(200).json({
                propostas,
                total: propostas.length
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    atribuirAnalistaPre: async (req, res) => {
        try {

            const { id, analista } = req.body

            if(req.userAcessLevel != 1){
                
                console.log(req.userAcessLevel);

                return res.status(500).json({
                    msg: 'O usuário não tem permissão para trocar de Analista'
                })
    
            }

            const proposta = await Proposta.findByIdAndUpdate({
                _id: id
            }, {
                analistaPreProcessamento: analista,
                status: 'Pre Processamento'
            })

            return res.status(200).json({
                proposta
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    mostrarPreProcessamento: async (req, res) => {
        try {

            const { analista } = req.params

            if (analista === 'Todos' || analista === '') {
                const propostas = await Proposta.find({
                    status: 'Pre Processamento'
                })

                return res.status(200).json({
                    propostas,
                    total: propostas.length
                })

            }

            const propostas = await Proposta.find({
                $and: [
                    { status: 'Pre Processamento' },
                    { analistaPreProcessamento: analista }
                ]
            })

            return res.status(200).json({
                propostas,
                total: propostas.length
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    mostrarPropostaFiltradaPreProcessamento: async (req, res) => {
        try {

            const { proposta } = req.params

            const result = await Proposta.find({
                $and: [
                    { status: 'Pre Processamento' },
                    { proposta: { $regex: proposta } }
                ]
            })

            console.log(result);

            return res.status(200).json({
                proposta: result
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    mostrarInfoPropostaId: async (req, res) => {
        try {

            const {id} = req.params

            const proposta = await Proposta.findById({
                _id: id
            })

            return res.status(200).json({
                proposta
            })
            
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    }

}

function ajustarData(data) {
    let split = data.split('/')
    let dia = split[0]
    let mes = split[1]
    let ano = split[2]

    return `${ano}-${mes}-${dia}`
}