const mongoose = require('mongoose')
const Pedido = mongoose.model('Pedido')
const Pessoa = mongoose.model('Pessoa')
const Protocolo = mongoose.model('Protocolo')
const Pacote = mongoose.model('Pacote')
const Operador = mongoose.model('Operador')
const Clinica = mongoose.model('Clinica')
const Gravacao = mongoose.model('Gravacao')
const FormaPagamento = mongoose.model('FormaPagamento')
const StatusFinalizacao = mongoose.model('StatusFinalizacao')
const Agenda = mongoose.model('AgendaRsd')

const path = require('path')
const moment = require('moment')
const fs = require('fs')
const multer = require('multer')
const os = require('os')

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const { pacote } = req.params
        const { name, ext } = path.parse(file.originalname)
        const dir = `./uploads/rsd/gravacoes/${pacote}/`
        if (!fs.existsSync(dir)) {
            //Efetua a criação do diretório
            fs.mkdir(dir, (err) => {
                if (err) {
                    console.log("Deu ruim...");
                    return
                }
                console.log("Diretório criado!")
            });
        }

        const usuario = req.user
        const arquivo = file.originalname

        let tipo = "Arquivo"

        if (ext === '.wav') {
            tipo = "Gravação"
        }

        await Gravacao.create({
            caminho: dir,
            usuario: usuario,
            arquivo: arquivo,
            tipo: tipo,
            pacote: pacote
        })

        console.log(usuario, arquivo, tipo);

        cb(null, dir)
    },
    filename: (req, file, cb) => {
        const { name, ext } = path.parse(file.originalname)

        cb(null, `${name}${ext}`)
    }
})

const xlsx = require('xlsx')

const uploadRsd = multer({ dest: os.tmpdir() }).single('file')
const uploadGravacao = multer({ storage }).single('file')

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

                if (req.file.originalname.indexOf('PF') === 10 || req.file.originalname.indexOf('PF') === 5) {
                    console.log('fila pf');

                    let mapCpfs = new Map()
                    let arrPedidos = []

                    result = result.filter((item) => {
                        return !this[JSON.stringify(item[' Reembolso'])] && (this[JSON.stringify(item[' Reembolso'])] = true)
                    }, Object.create(null))

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

                    result.forEach((e, key) => {
                        let conc = `${e[' Valor Apresentado'].replace('R$ ', '').replace('.', '').replace(',', '.')}`
                        conc = +conc
                        conc = `${e['Número do Protocolo'].replace(/[^0-9]/g, '')}${conc}`
                        let flag = 0

                        console.log(conc);

                        pedidosBanco.forEach(item => {
                            let concBanco = `${item?.protocolo?.replace(/[^0-9]/g, '')}${Number(item.valorApresentado)}`
                            if (concBanco == conc) {
                                flag++
                                return
                            }
                        })

                        let split = e[' Beneficiário'].split(' ')
                        let mo = split[1]
                        let beneficiario = split[2]

                        if (flag == 0) {
                            pedidos.push([
                                undefined,
                                undefined,
                                e['Data Solicitação'],
                                undefined,
                                e['Data Pagamento'],
                                undefined,
                                undefined,
                                mo,
                                beneficiario,
                                e[' Valor Apresentado']?.replace('R$ ', '').replace('.', '').replace(',', '.'),
                                e[' Valor Reembolsado']?.replace('R$ ', '').replace('.', '').replace(',', '.'),
                                e['Número do Protocolo'].replace(/[^0-9]/g, ''),
                                e['Operadora Beneficiário'].replace(' ', ' ')
                            ])
                        }
                    })

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
                let numero = item[0]
                let protocolo = item[11]
                let valorApresentado = item[9]
                let valorReembolsado = item[10]

                let dataSolicitacao = ExcelDateToJSDate(item[2])
                dataSolicitacao.setDate(dataSolicitacao.getDate() + 1)
                dataSolicitacao = moment(dataSolicitacao).format('YYYY-MM-DD')

                let dataPagamento = ExcelDateToJSDate(item[3])
                dataPagamento.setDate(dataPagamento.getDate() + 1)
                dataPagamento = moment(dataPagamento).format('YYYY-MM-DD')

                let dataSla = moment(new Date()).add(3, 'days').toDate()

                if (item[12] == 'pf') {
                    dataSla = moment(new Date()).add(1, 'days').toDate()
                } else {
                    const operadores = await Operador.find()

                    operadores.forEach(e => {
                        console.log(item[12]);
                        if (item[12] == e.descricao) {
                            dataSla = moment(new Date()).add(e.sla, 'days').toDate()
                            return
                        }
                    })
                }

                let mo = item[7]
                let nome = item[8]

                return await Pedido.create({
                    numero: numero,
                    protocolo: protocolo,
                    valorApresentado: valorApresentado,
                    valorReembolsado: valorReembolsado,
                    dataSla: dataSla,
                    ativo: true,
                    status: 'A iniciar',
                    statusPacote: 'Não iniciado',
                    dataSolicitacao,
                    dataPagamento,
                    mo,
                    pessoa: nome,
                    fase: 'A iniciar',
                    statusGerencial: 'A iniciar',
                    statusPadraoAmil: 'A iniciar'
                })

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
            const pedidos = await Pedido.find()

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

    mostrarPessoa: async (req, res) => {
        try {
            const { mo } = req.params

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

            const result = await Pedido.findById({
                _id: pedido
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

            const { pedido, valorApresentado, valorReembolsado, cnpj, clinica, nf, pedidoEditado } = req.body

            const updatePedido = await Pedido.findByIdAndUpdate({
                _id: pedido
            }, {
                valorApresentado: valorApresentado,
                valorReembolsado: valorReembolsado,
                cnpj: cnpj,
                clinica: clinica,
                nf: nf,
                numero: pedidoEditado
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
                status: 'A iniciar',
                statusPacote: 'Não iniciado',
                fase: 'A iniciar',
                statusGerencial: 'A iniciar',
                statusPadraoAmil: 'A iniciar'
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
            const { protocolo, dataSolicitacao, dataPagamento, operadora, mo, pedido } = req.body

            const pessoa = await Pessoa.findOne({
                mo: mo
            })

            console.log(pessoa);

            const operadores = await Operador.find()

            let sla = 3

            operadores.forEach(e => {
                if (e.descricao == operadora) {
                    sla = e.sla
                }
            })

            dataSla = moment(new Date()).add(sla, 'days').toDate()


            const result = await Protocolo.create({
                numero: protocolo,
                dataSolicitacao,
                dataPagamento,
                idStatus: 'A iniciar',
                status: 'Pedido cadastrado',
                ativo: true,
                pessoa: pessoa.nome,
                mo
            })

            const criarProtocolo = await Pedido.create({
                numero: pedido,
                protocolo,
                dataSolicitacao,
                dataPagamento,
                ativo: true,
                pessoa: pessoa.nome,
                mo,
                status: 'A iniciar',
                statusPacote: 'Não iniciado',
                fase: 'A iniciar',
                statusGerencial: 'A iniciar',
                statusPadraoAmil: 'A iniciar',
                dataSla,
                operador: operadora
            })

            return res.status(200).json({
                criarProtocolo
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    criarPacote: async (req, res) => {
        try {

            const { arrPedidos } = req.body

            console.log(arrPedidos);

            if (arrPedidos.length === 0) {
                return res.status(500).json({
                    msg: 'Nenhum pedido selecionado!'
                })
            }

            const pacote = await Pacote.create({
                ativo: true,
                status: 'A iniciar'
            })

            const idPacote = pacote._id

            const updatePedidos = await Promise.all(arrPedidos.map(async item => {

                return await Pedido.findOneAndUpdate({
                    numero: item
                }, {
                    pacote: idPacote,
                    status: 'Em andamento',
                    statusPacote: 'A iniciar'
                })
            }))

            return res.status(200).json({
                idPacote, updatePedidos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarPedidosMo: async (req, res) => {
        try {

            const { mo } = req.params

            const pedidos = await Pedido.find({
                mo: mo
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

    assumirPacote: async (req, res) => {
        try {
            const { name, pacote } = req.body

            console.log(name, pacote);

            const pedidos = await Pedido.find({
                pacote: pacote
            })

            for (const item of pedidos) {
                const updatePedido = await Pedido.findByIdAndUpdate({
                    _id: item._id
                }, {
                    analista: name
                })
            }

            const updatePacote = await Pacote.findByIdAndUpdate({
                _id: pacote
            }, {
                analista: name
            })


            return res.status(200).json({
                msg: 'Assumido com sucesso!'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarPedidosPacote: async (req, res) => {
        try {

            const { pacote } = req.params

            console.log(pacote);

            const pedidos = await Pedido.find({
                pacote: pacote
            })

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

    anexarGravacao: async (req, res) => {
        try {

            uploadGravacao(req, res, async (err) => {
                //console.log(req);
                console.log(res.file);
            })

            const { pacote } = req.params

            const caminho = `./uploads/rsd/gravacoes/${pacote}`
            const usuario = req.user

            return res.status(200).json({
                msg: 'Anexado com sucesso'
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarArquivos: async (req, res) => {
        try {

            const { pacote } = req.params

            const arquivos = await Gravacao.find({
                pacote: pacote
            })

            return res.status(200).json({
                arquivos
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarFormasPagamento: async (req, res) => {
        try {

            const formasPagamento = await FormaPagamento.find()

            return res.status(200).json({
                formasPagamento
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarStatusFinalizacao: async (req, res) => {
        try {

            const statusFinalizacoes = await StatusFinalizacao.find()

            return res.status(200).json({
                statusFinalizacoes
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    atualizarPedido: async (req, res) => {
        try {

            const { pacote, sucesso, motivoContato, confirmacaoServico, finalizacao } = req.body

            const pacoteBanco = await Pedido.findOne({
                pacote: pacote
            })

            if (sucesso === 'Sem Retorno de Contato') {
                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Cancelando o pacote por falta de contato"
                })

                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    status: 'Finalizado',
                    statusPacote: 'Finalizado',
                    fase: 'Finalizado',
                    statusGerencial: 'Protocolo Cancelado',
                    statusPadraoAmil: 'CANCELAMENTO - Sem retorno pós 5 dias úteis',
                    dataConclusao: new Date()
                })

            }

            if (pacoteBanco.statusPacote === 'A iniciar' && sucesso === 'Não') {

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Iniciado Processamento (etapa: 1° Tentativa)"
                })

                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    statusPacote: '2° Tentativa'
                })

            }

            if (pacoteBanco.statusPacote === '2° Tentativa' && sucesso === 'Não') {

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Iniciado Processamento (etapa: 2° Tentativa)"
                })

                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    statusPacote: '3° Tentativa'
                })
            }

            if (pacoteBanco.statusPacote === '3° Tentativa' && sucesso === 'Não') {

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Iniciado Processamento (etapa: 3° Tentativa)"
                })

                await Pedido.updateMany({
                    pacote: pacote
                }, {
                    statusPacote: 'Aguardando Retorno Contato',
                    status: 'Aguardando Retorno Contato',
                    fase: 'Em andamento',
                    statusGerencial: 'Aguardando Retorno Contato',
                    statusPadraoAmil: 'E-MAIL - Sem sucesso de contrato pós 3 tentativas, solicitado retorno'
                })
            }

            if (pacoteBanco.statusPacote === 'A iniciar' && sucesso === 'Sim') {

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Iniciado Processamento (etapa: 1° Tentativa)"
                })

            }

            if (pacoteBanco.statusPacote === '2° Tentativa' && sucesso === 'Sim') {

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Iniciado Processamento (etapa: 2° Tentativa)"
                })

            }

            if (pacoteBanco.statusPacote === '3° Tentativa' && sucesso === 'Sim') {

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Iniciado Processamento (etapa: 3° Tentativa)"
                })

            }

            if (pacoteBanco.statusPacote === '3° Tentativa' && sucesso === 'Sim') {

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: "Iniciado Processamento (etapa: Aguardando Retorno Contato)"
                })

            }

            for (const item of motivoContato) {

                let reconhece = false

                if (item[1] == 'Sim') {
                    reconhece = true
                }


                if (reconhece === false) {

                    const updatePedido = await Pedido.findOneAndUpdate({
                        numero: item[0]
                    }, {
                        reconhece: reconhece,
                        status: 'Finalizado',
                        fase: 'Finalizado',
                        statusGerencial: 'Protocolo Cancelado',
                        statusPadraoAmil: 'CANCELAMENTO - Não reconhece Procedimento/Consulta',
                        dataConclusao: new Date()
                    })

                    await Agenda.create({
                        idPacote: pacote,
                        usuario: req.user,
                        parecer: `Beneficiário não reconhece pedido: ${item[0]}, finalizando pedido`
                    })

                } else {
                    const updatePedido = await Pedido.findOneAndUpdate({
                        numero: item[0]
                    }, {
                        reconhece: reconhece
                    })

                    await Agenda.create({
                        idPacote: pacote,
                        usuario: req.user,
                        parecer: `Beneficiário reconhece pedido: ${item[0]}`
                    })
                }

            }

            for (const item of confirmacaoServico) {

                if (item[1] === 'Pagamento não realizado') {

                    const updatePedido = await Pedido.findOneAndUpdate({
                        numero: item[0]
                    }, {
                        formaPagamento: item[1],
                        status: 'Pagamento Não Realizado',
                        statusPacote: 'Finalizado',
                        fase: 'Finalizado',
                        statusGerencial: 'Pagamento Não Realizado',
                        statusPadraoAmil: 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento',
                        dataConclusao: new Date()
                    })

                    await Agenda.create({
                        idPacote: pacote,
                        usuario: req.user,
                        parecer: `Pedido: ${item[0]}, pagamento não realizado`
                    })

                } else {

                    const updatePedido = await Pedido.findOneAndUpdate({
                        numero: item[0]
                    }, {
                        formaPagamento: item[1],
                        status: 'Aguardando Docs',
                        fase: 'Em Andamento',
                        statusGerencial: 'Aguardando Comprovante',
                        statusPadraoAmil: 'AGD - Em ligação beneficiaria afirma ter pago, solicitando comprovante'
                    })

                    if (item[1] === 'Dinheiro') {
                        const updatePedido = await Pedido.findOneAndUpdate({
                            numero: item[0]
                        }, {
                            formaPagamento: item[1],
                            status: 'Aguardando Docs',
                            fase: 'Em Andamento',
                            statusGerencial: 'Aguardando Comprovante',
                            statusPadraoAmil: 'AGD - Em ligação beneficiaria afirma ter pago em dinheiro, solicitando declaração de quitação'
                        })
                    }

                    await Agenda.create({
                        idPacote: pacote,
                        usuario: req.user,
                        parecer: `Pedido: ${item[0]}, Forma de Pagamento: ${item[1]}, Aguardando Comprovante`
                    })
                }

            }

            for (const item of finalizacao) {

                if (item[1] === 'Comprovante Correto') {
                    const updatePedido = await Pedido.findOneAndUpdate({
                        numero: item[0]
                    }, {
                        statusFinalizacao: 'Finalizado',
                        status: 'Finalizado',
                        fase: 'Finalizado',
                        statusGerencial: 'Comprovante Correto',
                        statusPadraoAmil: 'PAGAMENTO LIBERADO',
                        dataConclusao: new Date()
                    })
                }

                if (item[1] === 'Pago pela Amil sem Comprovante') {
                    const updatePedido = await Pedido.findOneAndUpdate({
                        numero: item[0]
                    }, {
                        statusFinalizacao: 'Finalizado',
                        status: 'Finalizado',
                        fase: 'Finalizado',
                        statusGerencial: 'Pago pela Amil sem Comprovante',
                        statusPadraoAmil: 'PAGAMENTO LIBERADO',
                        dataConclusao: new Date()
                    })
                }

                if (item[1] === 'Pagamento Não Realizado') {
                    const updatePedido = await Pedido.findOneAndUpdate({
                        numero: item[0]
                    }, {
                        statusFinalizacao: 'Finalizado',
                        status: 'Finalizado',
                        fase: 'Finalizado',
                        statusGerencial: 'Pagamento Não Realizado',
                        statusPadraoAmil: 'INDEFERIR - Em contato beneficiário confirma que não realizou pagamento',
                        dataConclusao: new Date()
                    })
                }

                if (item[1] === 'Comprovante Não Recebido') {
                    const updatePedido = await Pedido.findOneAndUpdate({
                        numero: item[0]
                    }, {
                        statusFinalizacao: 'Finalizado',
                        status: 'Finalizado',
                        fase: 'Finalizado',
                        statusGerencial: 'Protocolo Cancelado',
                        statusPadraoAmil: 'CANCELAMENTO - Comprovante não Recebido',
                        dataConclusao: new Date()
                    })
                }

                if (item[1] === 'Reapresentação de Protocolo Indeferido') {
                    const updatePedido = await Pedido.findOneAndUpdate({
                        numero: item[0]
                    }, {
                        statusFinalizacao: 'Finalizado',
                        status: 'Finalizado',
                        fase: 'Finalizado',
                        statusGerencial: 'Protocolo Cancelado',
                        statusPadraoAmil: 'INDEFERIR - Reapresentação de Protocolo Indeferido',
                        dataConclusao: new Date()
                    })
                }

                await Agenda.create({
                    idPacote: pacote,
                    usuario: req.user,
                    parecer: `Pedido: ${item[0]}, finalização: ${item[1]}`
                })

            }

            const buscarPedidos = await Pedido.find({
                pacote: pacote
            })

            let flag = 0

            for (const item of buscarPedidos) {

                if (item.fase === 'Finalizado') {
                    flag++
                }

                if (buscarPedidos.length === flag) {
                    await Pedido.updateMany({
                        pacote: pacote
                    }, {
                        statusPacote: 'Finalizado'
                    })
                }

            }

            return res.status(200).json({
                msg: 'oi'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarAgenda: async (req, res) => {
        try {

            const { pacote } = req.params

            const agenda = await Agenda.find({
                idPacote: pacote
            })

            return res.status(200).json({
                agenda
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarPedidosNaoFinalizados: async (req, res) => {
        try {

            const pedidos = await Pedido.find({
                status: {
                    $in: ['A iniciar', 'Em andamento', 'Aguardando Retorno Contato', 'Aguardando Comprovante']
                }
            })

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

    filtroPedidosNaoFinalizados: async (req, res) => {
        try {

            const { pesquisa } = req.params

            const pedidos = await Pedido.find({
                $or: [
                    {
                        mo: pesquisa,
                        status: {
                            $in: ['A iniciar', 'Em andamento', 'Aguardando Retorno Contato', 'Aguardando Comprovante']
                        }
                    },
                    {
                        pessoa: pesquisa,
                        status: {
                            $in: ['A iniciar', 'Em andamento', 'Aguardando Retorno Contato', 'Aguardando Comprovante']
                        }
                    }
                ]
            })

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

    buscarOperadoras: async (req, res) => {
        try {

            const operadoras = await Operador.find()

            return res.status(200).json({
                operadoras
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    criarPedidoIndividual: async (req, res) => {
        try {

            const {
                mo,
                nome,
                dataNascimento,
                email,
                fone1,
                fone2,
                fone3,
                cpf,
                operadoraBeneficiario,
                protocolo,
                dataSolicitacao,
                dataPagamento,
                pedido
            } = req.body

            const operadores = await Operador.find()

            let sla = 3

            operadores.forEach(e => {
                if (e.descricao == operadoraBeneficiario) {
                    sla = e.sla
                }
            })

            dataSla = moment(new Date()).add(sla, 'days').toDate()

            const pessoa = await Pessoa.findOneAndUpdate({
                mo: mo
            }, {
                nome,
                dataNascimento,
                email,
                fone1,
                fone2,
                fone3,
                ativo: true,
                cpf
            }, {
                upsert: true
            })

            const novoPedido = await Pedido.create({
                mo: mo,
                pessoa: nome,
                protocolo,
                operador: operadoraBeneficiario,
                dataSolicitacao,
                dataPagamento,
                numero: pedido,
                ativo: true,
                status: 'A iniciar',
                statusPacote: 'Não iniciado',
                dataSla,
                fase: 'A iniciar',
                statusGerencial: 'A iniciar',
                statusPadraoAmil: 'A iniciar'
            })

            return res.status(200).json({
                novoPedido
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    criarOperadora: async (req, res) => {
        try {

            const { descricao, sla } = req.body

            const operadora = await Operador.create({
                descricao,
                sla
            })

            return res.status(200).json({
                operadora
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    editarOperadora: async (req, res) => {
        try {
            const { descricao, sla, id } = req.body

            const operadora = await Operador.findByIdAndUpdate({
                _id: id
            }, {
                descricao,
                sla
            })

            return res.status(200).json({
                operadora
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarOperadora: async (req, res) => {
        try {

            const { id } = req.params

            const operadora = await Operador.findById({
                _id: id
            })

            return res.status(200).json({
                operadora
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    buscarPedidosFinalizados: async (req, res) => {
        try {

            const { pesquisa } = req.params

            const pedidos = await Pedido.find({
                $or: [
                    {
                        mo: pesquisa,
                        fase: 'Finalizado'
                    },
                    {
                        numero: pesquisa,
                        fase: 'Finalizado'
                    },
                    {
                        protocolo: pesquisa,
                        fase: 'Finalizado'
                    }
                ]
            })

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

    devolverAmil: async (req, res) => {
        try {

            const { pedido } = req.body

            console.log(pedido);

            const update = await Pedido.findOneAndUpdate({
                numero: pedido
            }, {
                status: 'Finalizado',
                fase: 'Finalizado',
                statusGerencial: 'Devolvido Amil',
                statusPadraoAmil: 'Devolvido Amil'
            })

            return res.status(200).json({
                update
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    escrevarAgenda: async (req, res) => {
        try {

            const { pacote, parecer } = req.body

            const comentario = await Agenda.create({
                idPacote: pacote,
                usuario: req.user,
                parecer
            })

            return res.status(200).json({
                comentario
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