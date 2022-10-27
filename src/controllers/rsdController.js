const mongoose = require('mongoose')
const Pedido = mongoose.model('Pedido')
const Pessoa = mongoose.model('Pessoa')
const Protocolo = mongoose.model('Protocolo')
const Operador = mongoose.model('Operador')
const Clinica = mongoose.model('Clinica')

const moment = require('moment')
const fs = require('fs')
const multer = require('multer')
const os = require('os')

const xlsx = require('xlsx')

const uploadRsd = multer({ dest: os.tmpdir() }).single('file')

module.exports = {
    upload: async (req, res) => {
        try {

            const pedidosBanco = await Pedido.find()

            console.log('pedidos banco ok');

            let pedidos = []

            uploadRsd(req, res, async (err) => {

                console.log(req.file.originalname);

                let file = fs.readFileSync(req.file.path)

                const valorCorte = req.body.corte

                console.log(valorCorte);

                const workbook = xlsx.read(file, { type: 'array' })

                const firstSheetName = workbook.SheetNames[0]

                const worksheet = workbook.Sheets[firstSheetName]

                let result = xlsx.utils.sheet_to_json(worksheet)

                console.log(result.length);

                if (req.file.originalname.indexOf('PF') === 10) {
                    console.log('fila pf');

                    let mapCpfs = new Map()
                    let arrPedidos = []

                    result = result.filter((item) => {
                        return !this[JSON.stringify(item[' Reembolso'])] && (this[JSON.stringify(item[' Reembolso'])] = true)
                    }, Object.create(null))

                    console.log(result.length);

                    result.forEach(e => {

                        if (e['Situação'] == 'Aguardando documentação' ||
                            e['Situação'] == 'Documento recebido na Amil' ||
                            e['Situação'] == 'Em processamento' ||
                            e['Situação'] == 'Pedido Cadastrado' ||
                            e['Situação'] == 'Aguardando documento original' ||
                            e['Situação'] == 'Em Análise Técnica'
                        ) {

                            let rep = e['Beneficiário'].replace(' - ', '-')
                            let split = rep.split('-')
                            let mo = split[0]
                            let beneficiario = split[1]

                            arrPedidos.push([
                                e[' Reembolso'],
                                e['Situação'],
                                e['Data do Pedido'],
                                e['Data Prevista Pagamento'],
                                e['Data Pagamento'],
                                e['Número do Titulo'],
                                e['CPF do Favorecido'],
                                mo,
                                beneficiario,
                                e['Valor Apresentado'],
                                e['Valor Reembolsado'],
                                e.Protocolo,
                                'pf'
                            ])

                            if (mapCpfs.has(e['CPF do Favorecido'])) {
                                mapCpfs.set(e['CPF do Favorecido'], mapCpfs.get(e['CPF do Favorecido']) + e['Valor Apresentado'])
                            } else {
                                mapCpfs.set(e['CPF do Favorecido'], e['Valor Apresentado'])
                            }
                        }
                    })

                    let arr = []

                    console.log('filtrando por valor');

                    arrPedidos.forEach(val => {
                        for (const [cpf, value] of mapCpfs) {
                            if (value >= valorCorte) {
                                if (val[6] == cpf) {
                                    arr.push(val)
                                    break
                                }
                            }
                        }
                    })

                    console.log('verificando se existe na lpl');

                    arr.forEach(e => {
                        let flag = 0
                        pedidosBanco.forEach(item => {
                            if (e[0] == item.numero || e[8] == 'LUZIA LOPES MAURI CARDOSO') {
                                flag++
                                return
                            }
                        })

                        if (flag == 0) {
                            pedidos.push(e)
                        }

                    })

                    console.log(pedidos.length);

                } else {
                    console.log('fila pj');
                }

                return res.status(200).json({
                    pedidos
                })
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    subir: async (req, res) => {
        try {

            const { pedidos } = req.body

            const addPessoas = await Promise.all(pedidos.map(async item => {
                return await Pessoa.findOneAndUpdate({
                    mo: item[7]
                }, {
                    cpf: item[6],
                    nome: item[8],
                    mo: item[7]
                }, {
                    upsert: true
                })
            }))

            const addPedidos = await Promise.all(pedidos.map(async item => {

                if (item[12] == 'pf') {
                    let numero = item[0]
                    let protocolo = item[11]
                    let valorApresentado = item[9]
                    let valorReembolsado = item[10]

                    let dataSla = moment(new Date()).add(1, 'days').toDate()

                    return await Pedido.create({
                        numero: numero,
                        protocolo: protocolo,
                        valorApresentado: valorApresentado,
                        valorReembolsado: valorReembolsado,
                        dataSla: dataSla,
                        ativo: true,
                        status: 'A iniciar'
                    })
                }
            }))

            const addProtocolo = await Promise.all(pedidos.map(async item => {

                if (item[12] == 'pf') {
                    let dataSolicitacao = ExcelDateToJSDate(item[2])
                    dataSolicitacao.setDate(dataSolicitacao.getDate() + 1)
                    dataSolicitacao = moment(dataSolicitacao).format('YYYY-MM-DD')

                    let dataPagamento = ExcelDateToJSDate(item[3])
                    dataPagamento.setDate(dataPagamento.getDate() + 1)
                    dataPagamento = moment(dataPagamento).format('YYYY-MM-DD')

                    let dataSla = moment(new Date()).add(1, 'days').toDate()

                    let protocolo = item[11]
                    let mo = item[7]
                    let nome = item[8]

                    return await Protocolo.findOneAndUpdate({
                        numero: protocolo
                    }, {
                        numero: protocolo,
                        mo: mo,
                        dataSolicitacao: dataSolicitacao,
                        dataPagamento: dataPagamento,
                        dataSla: dataSla,
                        ativo: true,
                        status: 'Pedido Cadastrado',
                        idStatus: 'A iniciar',
                        pessoa: nome
                    }, {
                        upsert: true
                    })

                }

            }))

            return res.status(200).json({
                pedidos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    show: async (req, res) => {
        try {
            const protocolos = await Protocolo.find()

            return res.status(200).json({
                protocolos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    mostrarPessoa: async (req, res) => {
        try {
            const { mo } = req.params

            console.log(mo);

            const pessoa = await Pessoa.findOne({
                mo: mo
            })

            return res.status(200).json({
                pessoa
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    atualizarInformacoes: async (req, res) => {
        try {

            const { dataNascimento, email, fone1, fone2, fone3, contratoEmpresa, mo } = req.body

            const pessoa = await Pessoa.findOneAndUpdate({
                mo: mo
            }, {
                dataNascimento,
                email,
                fone1,
                fone2,
                fone3,
                contratoEmpresa
            })

            return res.status(200).json({
                pessoa
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    mostrarProtocolos: async (req, res) => {
        try {

            const { mo } = req.params

            const protocolos = await Protocolo.find({
                mo: mo
            })

            console.log(protocolos);

            return res.status(200).json({
                protocolos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    mostrarProtocolo: async (req, res) => {
        try {

            const { protocolo } = req.params

            const result = await Protocolo.findOne({
                numero: protocolo
            })

            return res.status(200).json({
                result
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    mostrarPedidos: async (req, res) => {
        try {
            const { protocolo } = req.params

            console.log(protocolo);

            const pedidos = await Pedido.find({
                protocolo: protocolo
            })

            console.log(pedidos);

            return res.status(200).json({
                pedidos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarPedido: async (req, res) => {
        try {
            const { pedido } = req.params

            const result = await Pedido.findOne({
                numero: pedido
            })

            return res.status(200).json({
                result
            })


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    assumirProtocolo: async (req, res) => {
        try {

            const { analista, protocolo } = req.body

            const result = await Protocolo.findOneAndUpdate({
                numero: protocolo
            }, {
                analista: analista
            })

            console.log(result);

            return res.status(200).json({
                result
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarClinica: async (req, res) => {
        try {

            const { cnpj } = req.body

            const clinica = await Clinica.findOne({
                cnpj
            })

            console.log(clinica);

            if (!clinica) {
                return res.status(501).json({
                    msg: 'Não foi encontrado clinica'
                })
            }

            return res.status(200).json({
                clinica
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    editarPedido: async (req, res) => {
        try {

            const { pedido, valorApresentado, valorReembolsado, cnpj, clinica, nf } = req.body

            const updatePedido = await Pedido.findOneAndUpdate({
                numero: pedido
            }, {
                valorApresentado: valorApresentado,
                valorReembolsado: valorReembolsado,
                cnpj: cnpj,
                clinica: clinica,
                nf: nf
            })

            const updateClinica = await Clinica.findOneAndUpdate({
                cnpj: cnpj
            }, {
                descricao: clinica
            }, {
                upsert: true
            })

            return res.status(200).json({
                updateClinica, updatePedido
            })


        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    criarPedido: async (req, res) => {
        try {

            const { pedido, protocolo, valorApresentado, valorReembolsado, cnpj, clinica, nf } = req.body

            const create = await Pedido.create({
                numero: pedido,
                protocolo,
                valorApresentado,
                valorReembolsado,
                cnpj,
                clinica,
                nf,
                ativo: true,
                status: 'A iniciar'
            })

            const updateClinica = await Clinica.findOneAndUpdate({
                cnpj: cnpj
            }, {
                descricao: clinica
            }, {
                upsert: true
            })

            console.log(create, updateClinica);

            return res.status(200).json({
                create,
                updateClinica
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    criarProtocolo: async (req, res) => {
        try {
            const {protocolo, dataSolicitacao, dataPagamento, operador, mo} = req.body

            const pessoa = await Pessoa.findOne({
                mo: mo
            })

            console.log(pessoa);

            const result = await Protocolo.create({
                numero: protocolo,
                dataSolicitacao,
                dataPagamento,
                status: 'A iniciar',
                ativo: true,
                pessoa: pessoa.nome
            })

            return res.status(200).json({
                result
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