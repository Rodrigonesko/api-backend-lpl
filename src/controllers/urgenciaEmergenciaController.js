const mongoose = require('mongoose')
const UrgenciasEmergencia = mongoose.model('UrgenciasEmergencia')
const User = mongoose.model('User')

const moment = require('moment')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const os = require('os')
const xlsx = require('xlsx')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/urgenciaEmergencia/'
        if (!fs.existsSync(dir)) {
            fs.mkdir(dir, (err) => {
                if (err) {
                    console.log("Deu ruim...");
                    return
                }
                console.log("Diretório criado!")
            });
        }
        cb(null, dir)
    },

    filename: (req, file, cb) => {
        cb(null, 'upload.xlsx')
    }

})

const uploadUrg = multer({ storage }).single('file')

module.exports = {
    upload: async (req, res) => {
        try {

            let quantidade = 0

            uploadUrg(req, res, async (err) => {
                console.log(req.file.originalname);

                let file = fs.readFileSync(req.file.path)

                const workbook = xlsx.read(file, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]

                const worksheet = workbook.Sheets[firstSheetName]

                let result = xlsx.utils.sheet_to_json(worksheet)

                for (const item of result) {
                    const find = await UrgenciasEmergencia.findOne({
                        proposta: item['PROPOSTA '],
                        nomeAssociado: item.NOME_ASSOC
                    })

                    if (!find) {
                        const dataRecebimento = moment(new Date()).format('YYYY-MM-DD')
                        const numAssociado = item.NUM_ASSOC
                        const proposta = item['PROPOSTA ']
                        let dataInclusao = ExcelDateToJSDate(item.DATA_INCLUSAO)
                        dataInclusao.setDate(dataInclusao.getDate() + 1)
                        dataInclusao = moment(dataInclusao).format('YYYY-MM-DD')
                        const nomeAssociado = item.NOME_ASSOC
                        let dataNascimento = ExcelDateToJSDate(item.DATA_NASC)
                        dataNascimento.setDate(dataNascimento.getDate() + 1)
                        dataNascimento = moment(dataNascimento).format('YYYY-MM-DD')
                        const idade = item.IDADE
                        const responsavel = item['RESPONSÁVEL']
                        const telefone = item['TEL CTTO']
                        const email = item.EMAIL
                        let dataSolicitacao = ExcelDateToJSDate(item.DATA_SOLICITACAO)
                        dataSolicitacao.setDate(dataSolicitacao.getDate() + 1)
                        dataSolicitacao = moment(dataSolicitacao).format('YYYY-MM-DD')
                        const nomePrestador = item.NOME_PRESTADOR
                        const cid = item.CID
                        const descricaoCid = item.NOM_CID_PRIN_AUTORIZ
                        const sitAutoriz = item.SIT_AUTORIZ
                        const relatorioMedico = item['INF RELATÓRIO MÉDICO']
                        const obsUnder = item[' OBS UNDER']

                        const obj = {
                            dataRecebimento,
                            numAssociado,
                            proposta,
                            dataInclusao,
                            nomeAssociado,
                            dataNascimento,
                            idade,
                            responsavel,
                            telefone,
                            email,
                            dataSolicitacao,
                            nomePrestador,
                            cid,
                            descricaoCid,
                            sitAutoriz,
                            relatorioMedico,
                            obsUnder,
                            status: 'Andamento',
                        }

                        await UrgenciasEmergencia.create(
                            obj
                        )

                        quantidade++

                    }
                }

                console.log(quantidade);

                return res.status(200).json({
                    quantidade
                })
            })


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    mostrarAndamento: async (req, res) => {
        try {
            const propostas = await UrgenciasEmergencia.find({
                status: 'Andamento'
            })

            console.log(propostas);

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    mostrarAnexar: async (req, res) => {
        try {
            const propostas = await UrgenciasEmergencia.find({
                status: 'Anexar'
            })

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    mostrarConcluidas: async (req, res) => {
        try {

            const propostas = await UrgenciasEmergencia.find({
                status: 'Concluído'
            })

            console.log(propostas);

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    mostrarTodas: async (req, res) => {
        try {

            const propostas = await UrgenciasEmergencia.find()

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    mostrarDadosProposta: async (req, res) => {
        try {

            const { id, } = req.params

            const proposta = await UrgenciasEmergencia.findById({
                _id: id
            })

            return res.status(200).json({
                proposta
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    salvarInfo: async (req, res) => {
        try {

            const { id, obj } = req.body

            const proposta = await UrgenciasEmergencia.findByIdAndUpdate({
                _id: id
            }, obj)

            console.log(proposta);

            return res.status(200).json({
                proposta
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    concluir: async (req, res) => {
        try {

            const { id, obj } = req.body

            const proposta = await UrgenciasEmergencia.findByIdAndUpdate({
                _id: id
            }, {
                contato1: obj.contato1,
                contato2: obj.contato2,
                contato3: obj.contato3,
                telefone: obj.telefone,
                email: obj.telefone,
                retorno: obj.retorno,
                observacoes: obj.observacoes,
                status: 'Anexar',
                analista: req.user,
                dataConclusao: moment(new Date()).format('YYYY-MM-DD')
            })

            console.log(proposta);

            return res.status(200).json({
                proposta
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    concluirAnexo: async (req, res) => {
        try {

            const {id} = req.body

            const proposta = await UrgenciasEmergencia.findByIdAndUpdate({
                _id: id
            }, {
                status: 'Concluído'
            })

            return res.status(200).json({
                proposta
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    producao: async (req, res) => {
        try {

            const { data } = req.params

            const analistas = await User.find({
                enfermeiro: true
            })

            let producao = []

            for (const item of analistas) {
                const count = await UrgenciasEmergencia.find({
                    analista: item.name,
                    dataConclusao: data
                }).count()

                producao.push({
                    analista: item.name,
                    quantidade: count
                })
            }

            const total = await UrgenciasEmergencia.find({
                dataConclusao: data
            }).count()

            return res.status(200).json({
                producao,
                total
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    salvarContato: async (req, res) => {
        try {

            const { obj, id } = req.body

            if (obj.contato === 'contato1') {
                const proposta = await UrgenciasEmergencia.findByIdAndUpdate({
                    _id: id
                }, {
                    contato1: moment(new Date()).format('YYYY-MM-DD HH:mm')
                })
            }

            if (obj.contato === 'contato2') {
                const proposta = await UrgenciasEmergencia.findByIdAndUpdate({
                    _id: id
                }, {
                    contato2: moment(new Date()).format('YYYY-MM-DD HH:mm')
                })
            }

            if (obj.contato === 'contato3') {
                const proposta = await UrgenciasEmergencia.findByIdAndUpdate({
                    _id: id
                }, {
                    contato3: moment(new Date()).format('YYYY-MM-DD HH:mm')
                })
            }

            return res.status(200).json({
                msg: 'Contato atualizado com sucesso!'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    }

}

function ExcelDateToJSDate(serial) {
    var utc_days = Math.floor(serial - 25569);
    var utc_value = utc_days * 86400;
    var date_info = new Date(utc_value * 1000);

    var fractional_day = serial - Math.floor(serial) + 0.0000001;

    var total_seconds = Math.floor(86400 * fractional_day);

    var seconds = total_seconds % 60;

    total_seconds -= seconds;

    var hours = Math.floor(total_seconds / (60 * 60));
    var minutes = Math.floor(total_seconds / 60) % 60;

    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}

function ajustarDataEHorario(data) {

    if(data === undefined){
        return ''
    }

    const spaceSplit = data.split(' - ')
    const dataSplit = spaceSplit[0].split('/')
    const dia = dataSplit[0]
    const mes = dataSplit[1]
    const ano = dataSplit[2]
    const horario = spaceSplit[1]

    const dataCorrigida = `${ano}-${mes}-${dia} ${horario}`

    return dataCorrigida

}