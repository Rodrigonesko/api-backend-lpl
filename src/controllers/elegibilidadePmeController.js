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

                    await Proposta.create(obj)
                    qtd++

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

            if (status === 'Todos') {
                const result = await Proposta.find({
                    proposta: { $regex: proposta }
                })

                return res.json(result)
            }

            const result = await Proposta.find({
                status,
                proposta: { $regex: proposta }
            })

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
                data: moment().format('YYYY-MM-DD HH:mm:ss'),
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
                    data: moment().format("YYYY-MM-DD HH:mm:ss")
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

            const result = await Proposta.findOneAndUpdate({
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
                data: moment().format("YYYY-MM-DD HH:mm:ss")
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
                data: moment().format("YYYY-MM-MM HH:mm:ss")
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

    producaoDiaria: async (req, res) => {
        try {

            const { data } = req.params;


            // Procura as propostas com a data de conclusão fornecida
            const propostas = await Proposta.find({
                dataConclusao: moment(data).format('DD/MM/YYYY'),
                status: {$ne: 'Retrocedido'}
            });

            let analistas = [];

            // Percorre as propostas e adiciona os analistas únicos à lista de analistas
            propostas.forEach(e => {
                if (!analistas.includes(e.analista)) {
                    analistas.push(e.analista);
                }
            });

            let producao = [];

            // Para cada analista, conta o número de propostas concluídas na data fornecida
            for (const analista of analistas) {
                const count = await Proposta.find({
                    analista,
                    dataConclusao: moment(data).format('DD/MM/YYYY')
                }).count();

                producao.push({
                    analista,
                    quantidade: count
                });
            }

            // Conta o número total de propostas concluídas na data fornecida
            const total = await Proposta.find({
                dataConclusao: moment(data).format('DD/MM/YYYY')
            }).count();


            // Retorna uma resposta com status 200 contendo um objeto JSON com a produção por analista e o total
            return res.json({
                producao,
                total
            });


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    producaoMensal: async (req, res) => {
        try {

            const { mes, analista } = req.params

            const find = await Proposta.find({
                dataConclusao: { $regex: moment(mes).format('MM/YYYY') },
                analista
            })

            const objPrazo = {}
            let arrPrazo = [['Data', 'd0', 'd1', 'd2', 'd3', 'd4+', 'meta']]
            let propostasDevolvidas = 0
            let propostasNaoDevolvidas = 0
            let total = 0

            for (const item of find) {

                total++

                const key = item.dataConclusao

                const diasUteis = calcularDiasUteis(moment(item.dataRecebimento), moment(item.dataConclusao.split('/').reverse().join('-')), feriados)

                if (item.status === 'Devolvida') {
                    propostasDevolvidas++
                } else {
                    propostasNaoDevolvidas++
                }

                if (diasUteis === 0) {
                    if (objPrazo[key]) {
                        objPrazo[key].d0 += 1
                    } else {
                        objPrazo[key] = {
                            d0: 1,
                            d1: 0,
                            d2: 0,
                            d3: 0,
                            d4: 0
                        }
                    }
                }

                if (diasUteis === 1) {
                    if (objPrazo[key]) {
                        objPrazo[key].d1 += 1
                    } else {
                        objPrazo[key] = {
                            d0: 0,
                            d1: 1,
                            d2: 0,
                            d3: 0,
                            d4: 0
                        }
                    }
                }

                if (diasUteis === 2) {
                    if (objPrazo[key]) {
                        objPrazo[key].d2 += 1
                    } else {
                        objPrazo[key] = {
                            d0: 0,
                            d1: 0,
                            d2: 1,
                            d3: 0,
                            d4: 0
                        }
                    }
                }

                if (diasUteis === 3) {
                    if (objPrazo[key]) {
                        objPrazo[key].d3 += 1
                    } else {
                        objPrazo[key] = {
                            d0: 0,
                            d1: 0,
                            d2: 0,
                            d3: 1,
                            d4: 0
                        }
                    }
                }

                if (diasUteis >= 4) {
                    if (objPrazo[key]) {
                        objPrazo[key].d4 += 1
                    } else {
                        objPrazo[key] = {
                            d0: 0,
                            d1: 0,
                            d2: 0,
                            d3: 0,
                            d4: 1
                        }
                    }
                }
            }

            for (const item of Object.entries(objPrazo)) {

                arrPrazo.push([
                    item[0],
                    item[1].d0,
                    item[1].d1,
                    item[1].d2,
                    item[1].d3,
                    item[1].d4,
                    35
                ])
            }

            arrPrazo.sort((a, b) => {
                const dateA = new Date(a[0].split('/').reverse().join('-'));
                const dateB = new Date(b[0].split('/').reverse().join('-'));
                return dateA - dateB;
            });

            return res.json({
                arrPrazo,
                total,
                propostasDevolvidas,
                propostasNaoDevolvidas
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

const feriados = [
    moment('2022-01-01'),
    moment('2022-04-21'),
    moment('2022-05-01'),
    moment('2022-09-07'),
    moment('2022-10-12'),
    moment('2022-11-02'),
    moment('2022-11-15'),
    moment('2022-12-25'),
    moment('2023-01-01'),
    moment('2023-02-20'),
    moment('2023-02-21'),
    moment('2023-02-22'),
    moment('2023-04-07'),
    moment('2023-04-21'),
    moment('2023-05-01'),
    moment('2023-06-08'),
    moment('2023-09-07'),
    moment('2023-10-12'),
    moment('2023-11-02'),
    moment('2023-11-15'),
    moment('2023-12-25')
];

function calcularDiasUteis(dataInicio, dataFim, feriados) {
    let diasUteis = 0;
    let dataAtual = moment(dataInicio);

    while (dataAtual.isSameOrBefore(dataFim, 'day')) {
        if (dataAtual.isBusinessDay() && !feriados.some(feriado => feriado.isSame(dataAtual, 'day'))) {
            diasUteis++;
        }
        dataAtual.add(1, 'day');
    }

    return diasUteis - 1;
}