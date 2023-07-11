const Proposta = require('../models/ElegibilidadePme/PropostaElegibilidadePme')
const Agenda = require('../models/ElegibilidadePme/AgendaElegibilidadePme')

const moment = require('moment')
const fs = require('fs')
const multer = require('multer')
const xlsx = require('xlsx')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/elegibilidade/'
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

const uploadPropostas = multer({ storage }).single('file')


module.exports = {

    upload: async (req, res) => {
        try {

            var qtd = 0

            uploadPropostas(req, res, async (err) => {

                let file = fs.readFileSync(req.file.path)

                const workbook = xlsx.read(file, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]

                // Obtém a planilha
                const worksheet = workbook.Sheets[firstSheetName]

                // Converte a planilha em JSON
                let result = xlsx.utils.sheet_to_json(worksheet)

                for (const item of result) {

                    const porte = item.Porte
                    const linhaDeProduto = item['Linha de Produto']
                    const grupo = item.Grupo
                    const cnpj = item['CNPJ Empresa']
                    const proposta = item.Proposta
                    const vidas = item.Vidas
                    const colaborador = item.Colaborador
                    const situacao = item['Situação']
                    let dataProtocolo = ExcelDateToJSDate(item['Data Protocolo'])
                    dataProtocolo.setDate(dataProtocolo.getDate() + 1)
                    dataProtocolo = moment(dataProtocolo).format('YYYY-MM-DD')
                    let dataAnalise = ''
                    if (item['Data em Análise']) {
                        dataAnalise = ExcelDateToJSDate(item['Data em Análise'])
                        dataAnalise.setDate(dataAnalise.getDate() + 1)
                        dataAnalise = moment(dataAnalise).format('YYYY-MM-DD')
                    }
                    const observacoes = item['Observação']
                    const motor = item.Motor
                    const gestor = item.Gestor
                    const analista = 'A definir'
                    const dataRecebimento = moment().format("YYYY-MM-DD")
                    const status = 'A iniciar'

                    const obj = {
                        porte,
                        linhaDeProduto,
                        grupo,
                        cnpj,
                        proposta,
                        vidas,
                        colaborador,
                        situacao,
                        dataProtocolo,
                        dataAnalise,
                        observacoes,
                        motor,
                        gestor,
                        analista,
                        dataRecebimento,
                        status
                    }

                    const existeProposta = await Proposta.findOne({
                        proposta
                    })

                    if (!existeProposta) {
                        await Proposta.create(obj)
                        qtd++
                    }
                }

                return res.status(200).json({
                    qtd
                })
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

            const result = await Proposta.find()

            return res.status(200).json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    propostasPorStatus: async (req, res) => {
        try {

            const { status } = req.params

            const result = await Proposta.find({
                status
            })

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    propostasPorStatusEAnalista: async (req, res) => {
        try {

            const { status, analista } = req.params

            const result = await Proposta.find({
                status,
                analista
            })

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    getProposta: async (req, res) => {
        try {

            const { status, proposta } = req.params

            const result = await Proposta.find({
                status,
                proposta: { $regex: proposta }
            })

            console.log(result);

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    atribuirAnalista: async (req, res) => {
        try {

            const { analista, id } = req.body

            const result = await Proposta.findOne({
                _id: id
            })

            await Proposta.updateOne({
                _id: id
            }, {
                analista
            })

            await Agenda.create({
                proposta: result.proposta,
                analista: req.user,
                data: moment().format('YYYY-MM-DD H:i:s'),
                comentario: `O analista: ${req.user}, atribuiu de: ${result.analista} para: ${analista}`
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

    infoProposta: async (req, res) => {
        try {

            const { id } = req.params

            const result = await Proposta.findOne({
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

    alterarStatus: async (req, res) => {
        try {

            const { status, motivo, id } = req.body

            if (status === 'Devolvida') {

                const result = await Proposta.findOneAndUpdate({
                    _id: id
                }, {
                    status,
                    motivo,
                    dataConclusao: moment().format('DD/MM/YYYY'),
                    analista: req.user
                })

                await Agenda.create({
                    proposta: result.proposta,
                    analista: req.user,
                    comentario: `O analista: ${req.user} devolveu a proposta com o motivo: ${motivo}`,
                    data: moment().format("YYYY-MM-DD HH:ii:ss")
                })

                return res.json({
                    msg: 'ok'
                })

            }

            await Proposta.updateOne({
                _id: id
            }, {
                status,
                dataConclusao: moment().format('DD/MM/YYYY'),
                analista: req.user
            })

            await Agenda.create({
                proposta: result.proposta,
                analista: req.user,
                comentario: `O analista: ${req.user} concluiu a proposta`,
                data: moment().format("YYYY-MM-DD HH:ii:ss")
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

    agendaPorProposta: async (req, res) => {
        try {

            const { proposta } = req.params

            const result = await Agenda.find({
                proposta
            })

            return res.json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    adicionarComentario: async (req, res) => {
        try {

            const { proposta, comentario } = req.body

            await Agenda.create({
                analista: req.user,
                proposta,
                comentario,
                data: moment().format("YYYY-MM-MM H:i:s")
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

