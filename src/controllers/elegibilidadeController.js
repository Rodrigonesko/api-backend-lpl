const mongoose = require('mongoose')
const Proposta = mongoose.model('PropostasElegibilidade')
const Agenda = mongoose.model('AgendaElegibilidade')
const Prc = mongoose.model('Prc')
const Blacklist = require('../models/Elegibilidade/Blacklist')
const PropostaManual = require('../models/Elegibilidade/PropostaElegibilidadeManual')
const CpfCancelado = require('../models/Elegibilidade/Cpfcancelado')

const path = require('path')
const moment = require('moment')
const fs = require('fs')
const multer = require('multer')
const os = require('os')
const xlsx = require('xlsx')

const uploadPropostas = multer({ dest: os.tmpdir() }).single('file')

const mysql = require('mysql');

const connection = mysql.createConnection({
    host: '10.0.0.71', // endereço do servidor do MySQL
    user: 'adm', // usuário do MySQL
    password: 'lpladm$1', // senha do MySQL
    database: 'elegibilidade' // nome do banco de dados
});

// Conectar ao banco de dados
connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao MySQL:', err);
        return;
    }
    console.log('Conexão bem-sucedida ao MySQL!');
});


module.exports = {

    show: async (req, res) => {

        try {

            const propostas = await Proposta.find()

            return res.json(propostas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }

    },

    upload: async (req, res) => {
        try {

            const ufMap = {
                'São Paulo': 'SP',
                'Rio de Janeiro': 'RJ',
                'Distrito Federal': 'DF'
            };

            let qtd = 0

            uploadPropostas(req, res, async (err) => {

                const { name, ext } = path.parse(req.file.originalname)


                if (ext == '.txt') {

                    let data = fs.readFileSync(req.file.path, { encoding: 'latin1' })
                    let listaArr = data.split('\n');
                    let arrAux = listaArr.map(e => {
                        return e.split('#')
                    })

                    for await (const item of arrAux) {
                        let vigencia = item[36]

                        if (vigencia) {
                            vigencia = ajustarData(vigencia)
                        }
                        let proposta = item[22]
                        let produto = item[6]
                        let plano = item[48]
                        let produtor = item[7]
                        const uf = ufMap[item[3]] || item[3];
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

                            if (!find) {
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

                    const workbook = xlsx.read(file, { type: 'array' })

                    const firstSheetName = workbook.SheetNames[0]

                    const worksheet = workbook.Sheets[firstSheetName]

                    let result = xlsx.utils.sheet_to_json(worksheet)

                    console.log(result.length);

                    result = result.filter((e) => { return e['Situação Atual'] === 'Pronta para análise' || e['Situação Atual'] === 'Em análise' })

                    console.log(result.length);

                    for (const item of result) {

                        const dataImportacao = moment().format('YYYY-MM-DD')
                        const proposta = item.Proposta
                        const statusMotor = item.Score_motor

                        let vigencia = ExcelDateToJSDate(item['Vigência Beneficiario'])
                        vigencia.setDate(vigencia.getDate() + 1)
                        vigencia = moment(vigencia).format('YYYY-MM-DD')

                        const produto = item['Linha de Produto']
                        const produtor = item['Cód. Adm.']
                        const uf = item['Nome da Unidade']
                        const administradora = item['Nome da Administradora']
                        const codCorretor = item['Cód.Corretor']
                        const nomeCorretor = item['Nome Corretor']
                        const entidade = item['Nome Fantasia Contrato Médico']
                        const tipoVinculo = item['Classificação Prof. Médica']
                        const nome = item.Titular
                        const idade = item['Idade Beneficiário']
                        const numeroVidas = item['Nro Vidas Médico']
                        const valorMedico = item['Valor Médico']
                        const valorDental = item['Valor Dental']
                        const valorTotal = item['Valor Total']
                        const nomeSupervisor = item['Nome Supervisor']

                        const existeProposta = await Proposta.findOne({
                            proposta
                        })

                        const obj = {
                            dataImportacao,
                            proposta,
                            statusMotor,
                            vigencia,
                            produto,
                            produtor,
                            uf,
                            administradora,
                            codCorretor,
                            nomeCorretor,
                            entidade,
                            tipoVinculo,
                            nome,
                            idade,
                            numeroVidas,
                            valorMedico,
                            valorDental,
                            valorTotal,
                            nomeSupervisor,
                            status: 'Análise de Documentos',
                        }

                        if (!existeProposta) {
                            await Proposta.create(obj)
                            qtd++

                        } else if (statusMotor !== '#N/D') {

                            await Proposta.updateOne({
                                proposta
                            },
                                statusMotor
                            )
                        }

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

            if (req.userAcessLevel === 'false') {

                console.log(req.userAcessLevel);

                return res.status(500).json({
                    msg: 'O usuário não tem permissão para trocar de Analista'
                })

            }

            const proposta = await Proposta.findByIdAndUpdate({
                _id: id
            }, {
                analista: analista,
                status: 'A iniciar'
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

    mostrarPropostaFiltradaAnalise: async (req, res) => {
        try {

            const { proposta } = req.params

            const result = await Proposta.find({
                $and: [
                    { $or: [{ status: 'A iniciar' }, { status: 'Em andamento' }] },
                    { proposta: { $regex: proposta } }
                ]
            })

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

            const { id } = req.params

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
    },

    mostrarAnalise: async (req, res) => {
        try {

            const { analista } = req.params

            if (analista === 'Todos' || analista === '') {
                const propostas = await Proposta.find({
                    $or: [
                        { status: 'A iniciar' },
                        { status: 'Em andamento' }
                    ]
                })

                return res.status(200).json({
                    propostas,
                    total: propostas.length
                })

            }

            const propostas = await Proposta.find({
                $or: [
                    { status: 'A iniciar' },
                    { status: 'Em andamento' }
                ],
                $and: [
                    { analista: analista }
                ]
            })

            console.log(propostas);

            return res.status(200).json({
                propostas,
                total: propostas.length
            })

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    entidades: async (req, res) => {
        try {

            const entidades = await Proposta.find({
                $or: [
                    { status: 'A iniciar' },
                    { status: 'Em andamento' }
                ]
            }).distinct('entidade')

            return res.status(200).json({
                entidades
            })

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    filtroAnalise: async (req, res) => {
        try {

            const { analista, entidade, status } = req.query

            console.log(analista == '', entidade == '', status === '');

            let propostas = await Proposta.find({
                analista: { $regex: analista },
                entidade: { $regex: entidade },
                status: { $regex: status },
            })

            propostas = propostas.filter(e => {
                return e.status === 'A iniciar' || e.status === 'Em andamento'
            })

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    fitroPropostaAnalise: async (req, res) => {
        try {
            const { proposta } = req.params

            const propostas = await Proposta.find({
                $or: [
                    {
                        proposta: { $regex: proposta },
                        status: 'A iniciar'
                    }, {
                        proposta: { $regex: proposta },
                        status: 'Em andamento'
                    }
                ]
            })

            console.log(propostas);

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error)
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    atribuirAnalista: async (req, res) => {
        try {

            const { analista, id } = req.body

            if (req.userAcessLevel !== 'false') {
                await Proposta.findByIdAndUpdate({
                    _id: id
                }, {
                    analista
                })
            }

            return res.status(200).json({
                msg: 'oiii'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error
            })
        }
    },

    propostasACancelar: async (req, res) => {
        try {

            const { analista } = req.params

            if (analista === 'Todos' || analista === '') {
                const propostas = await Proposta.find({
                    status: 'Fase Cancelamento'
                })

                return res.json(propostas)

            }

            const propostas = await Proposta.find({
                status: 'Fase Cancelamento',
                $and: [
                    { analista: analista }
                ]
            })

            return res.status(200).json({
                propostas,
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error
            })
        }
    },

    filtroPropostaCancelar: async (req, res) => {
        try {

            const { proposta } = req.params

            const propostas = await Proposta.find({

                proposta: { $regex: proposta },
                status: 'Fase Cancelamento'
            })

            console.log(propostas);

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error
            })
        }
    },

    filtroCancelar: async (req, res) => {
        try {

            const { analista, entidade } = req.query

            console.log(analista == '', entidade == '');

            let propostas = await Proposta.find({
                analista: { $regex: analista },
                entidade: { $regex: entidade },
                status: 'Fase Cancelamento',
            })

            // propostas = propostas.filter(e => {
            //     return e.status === 'A iniciar' || e.status === 'Em andamento'
            // })

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error
            })
        }
    },

    propostasDevolvidas: async (req, res) => {
        try {
            const { analista } = req.params

            if (analista === 'Todos' || analista === '') {
                const propostas = await Proposta.find({
                    status: 'Devolvida'
                })

                return res.json(propostas)

            }

            const propostas = await Proposta.find({
                status: 'Devolvida',
                $and: [
                    { analista: analista }
                ]
            })

            return res.status(200).json({
                propostas,
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error
            })
        }
    },

    filtroPropostasDevolvidas: async (req, res) => {
        try {

            const { proposta } = req.params

            console.log(proposta);

            const propostas = await Proposta.find({

                proposta: { $regex: proposta },
                status: 'Devolvida'
            })

            console.log(propostas);

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error
            })
        }
    },

    filtroDevolvidas: async (req, res) => {
        try {

            const { analista, entidade } = req.query

            console.log(analista == '', entidade == '');

            let propostas = await Proposta.find({
                analista: { $regex: analista },
                entidade: { $regex: entidade },
                status: 'Devolvida',
            })

            return res.status(200).json({
                propostas
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error
            })
        }
    },

    filtroPropostaTodas: async (req, res) => {
        try {

            const { proposta } = req.params

            const propostas = await Proposta.find({
                proposta: { $regex: proposta }
            })

            return res.json(propostas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error
            })
        }
    },

    filtroTodas: async (req, res) => {
        try {

            const { analista, vigencia, status } = req.query

            console.log(analista, vigencia, status);

            let propostas = await Proposta.find({
                analista: { $regex: analista },
                vigencia: { $regex: vigencia },
                status: { $regex: status },
            })

            return res.json(propostas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error
            })
        }
    },

    statusEmAndamento: async (req, res) => {
        try {

            const { id } = req.body

            await Proposta.updateOne({
                _id: id
            }, {
                status: 'Em andamento'
            })

            return res.status(200).json({
                msg: 'Ok'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error
            })
        }
    },

    fase1: async (req, res) => {
        try {

            const { id, dataUpdate, concluir } = req.body;

            console.log(id, dataUpdate, concluir);

            if (concluir) {
                await Proposta.updateOne({ _id: id }, { fase1: true, status: 'Em andamento' });
            }

            const result = await Proposta.findOneAndUpdate({
                _id: id
            }, dataUpdate, {
                new: true
            })?.lean();

            if (result) {
                return res.status(200).json(result);
            } else {
                throw new Error("Proposta não encontrada");
            }

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    fase2: async (req, res) => {
        try {

            const { id, dataUpdate } = req.body

            console.log(id, dataUpdate);

            const result = await Proposta.findOneAndUpdate({
                _id: id
            }, dataUpdate, {
                new: true
            })?.lean();

            if (result) {
                return res.status(200).json(result);
            } else {
                throw new Error("Proposta não encontrada");
            }

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    comentario: async (req, res) => {
        try {

            const { comentario, id } = req.body

            console.log(comentario, id, req.user);

            const result = await Agenda.create({
                comentario,
                proposta: id,
                analista: req.user,
                data: moment().format('YYYY-MM-DD HH:mm:ss')
            })

            console.log(result);

            return res.status(200).json(result)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    buscarAgenda: async (req, res) => {
        try {

            const { proposta } = req.params

            const agenda = await Agenda.find({
                proposta
            })

            console.log(agenda);

            return res.status(200).json(agenda)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    excluirComentario: async (req, res) => {
        try {
            const { id } = req.params

            const agenda = await Agenda.findByIdAndDelete({
                _id: id
            })

            return res.status(200).json({
                agenda
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    buscarPrc: async (req, res) => {
        try {

            const prc = await Prc.find()

            return res.status(200).json({
                prc
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    enviarUnder: async (req, res) => {
        try {

            const { id, erroSistema } = req.body;
            const find = await Proposta.findById({ _id: id });

            console.log(find)

            let status = '';
            let camposAtualizados = {};

            status = erroSistema ? 'Erro Sistema' : 'Enviada para Under';

            if (!find.status1Analise) {
                camposAtualizados = {
                    status1Analise: 'Liberada',
                    primeiraDevolucao1: 'Liberada',
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            } else if (find.status3Analise || find.status2Analise) {
                camposAtualizados = {
                    status3Analise: 'Liberada',
                    segundoReprotocolo1: 'Liberada',
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            } else if (find.status1Analise) {
                camposAtualizados = {
                    status2Analise: 'Liberada',
                    reprotocolo1: 'Liberada',
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            }

            if (Object.keys(camposAtualizados).length > 0) {
                await Proposta.findByIdAndUpdate({ _id: id }, camposAtualizados);
            }

            const respostaJson = { msg: 'Ok' };
            return res.status(200).json(respostaJson);

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    enviarFaseCancelamento: async (req, res) => {
        try {

            const { id, motivoCancelamento, categoriaCancelamento, evidencia } = req.body

            console.log(id, motivoCancelamento, categoriaCancelamento, evidencia);

            await Proposta.updateOne({
                _id: id
            }, {
                motivoCancelamento,
                categoriaCancelamento,
                evidenciaFraude: evidencia,
                status: 'Fase Cancelamento',
                dataConclusao: moment().format('YYYY-MM-DD'),
                analista: req.user
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

    devolver: async (req, res) => {
        try {

            const { id, motivos, observacoes } = req.body

            const find = await Proposta.findById({ _id: id });

            const status = 'Devolvida'

            let camposAtualizados = {}

            if (!find.primeiraDevolucao1) {

                const primeiraDevolucao1 = motivos[0]
                const primeiraDevolucao2 = motivos[1]
                const primeiraDevolucao3 = motivos[2]
                const primeiraDevolucao4 = motivos[3]

                camposAtualizados = {
                    status1Analise: 'Devolvida',
                    primeiraDevolucao1,
                    primeiraDevolucao2,
                    primeiraDevolucao3,
                    primeiraDevolucao4,
                    observacoesDevolucao: observacoes,
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };

            } else if (find.primeiraDevolucao1 && !find.reprotocolo1) {

                const reprotocolo1 = motivos[0]
                const reprotocolo2 = motivos[1]
                const reprotocolo3 = motivos[2]

                camposAtualizados = {
                    status2Analise: 'Devolvida',
                    reprotocolo1,
                    reprotocolo2,
                    reprotocolo3,
                    observacoesDevolucao: observacoes,
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };


            } else if (find.primeiraDevolucao1 && find.reprotocolo1) {
                console.log('terceira devolução');

                const segundoReprotocolo1 = motivos[0]
                const segundoReprotocolo2 = motivos[1]
                const segundoReprotocolo3 = motivos[2]

                camposAtualizados = {
                    status3Analise: 'Devolvida',
                    segundoReprotocolo1,
                    segundoReprotocolo2,
                    segundoReprotocolo3,
                    observacoesDevolucao: observacoes,
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            }

            if (Object.keys(camposAtualizados).length > 0) {
                await Proposta.updateOne({ _id: id }, camposAtualizados);
            }

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

    cancelar: async (req, res) => {
        try {

            const { id } = req.body

            const proposta = await Proposta.findOne({
                _id: id
            })

            const status = 'Cancelada'

            if (!proposta.status1Analise) {
                camposAtualizados = {
                    status1Analise: 'Cancelada',
                    primeiraDevolucao1: 'Cancelada',
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            } else if (proposta.status3Analise || proposta.status2Analise) {
                camposAtualizados = {
                    status3Analise: 'Cancelada',
                    segundoReprotocolo1: 'Cancelada',
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            } else if (proposta.status1Analise) {
                camposAtualizados = {
                    status2Analise: 'Cancelada',
                    reprotocolo1: 'Cancelada',
                    status,
                    dataConclusao: moment().format('YYYY-MM-DD'),
                    analista: req.user
                };
            }

            if (Object.keys(camposAtualizados).length > 0) {
                await Proposta.updateOne({ _id: id }, camposAtualizados);
            }

            await Blacklist.create({
                proposta: proposta.proposta,
                codCorretor: proposta.codCorretor,
                entidade: proposta.entidade,
                administradora: proposta.administradora,
                cpfCorretor: proposta.cpfCorretor,
                nomeCorretor: proposta.nomeCorretor,
                telefoneCorretor: proposta.telefoneCorretor,
                nomeSupervisor: proposta.nomeSupervisor,
                cpfSupervisor: proposta.cpfSupervisor,
                telefoneSupervisor: proposta.telefoneSupervisor,
                motivoCancelamento: proposta.motivoCancelamento,
                categoriaCancelamento: proposta.categoriaCancelamento,
                evidenciaFraude: proposta.evidenciaFraude
            })

            // console.log(addBlacklist);

            return res.json({ msg: 'ok' })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    producaoDiaria: async (req, res) => {
        try {

            const { data } = req.params

            const propostas = await Proposta.find({
                dataConclusao: data
            })

            let analistas = []

            propostas.forEach(e => {
                if (!analistas.includes(e.analista)) {
                    analistas.push(e.analista)
                }
            })

            let producao = []

            for (const analista of analistas) {
                const count = await Proposta.find({
                    analista,
                    dataConclusao: data
                }).count()

                producao.push({
                    analista,
                    quantidade: count
                })
            }

            const total = await Proposta.find({
                dataConclusao: data
            }).count()

            return res.json({
                producao,
                total
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    propostasCorretor: async (req, res) => {
        try {

            const { corretor } = req.params

            const propostas = await Proposta.find({
                nomeCorretor: corretor
            })

            return res.json(propostas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    blacklist: async (req, res) => {
        try {

            const propostas = await Blacklist.find()

            return res.json(propostas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    report: async (req, res) => {
        try {

            const recebidasHoje = await Proposta.find({
                dataImportacao: moment().format('YYYY-MM-DD')
            }).count()

            const emAnalise = await Proposta.find({
                dataImportacao: { $ne: moment().format('YYYY-MM-DD') },
                $or: [
                    { status: 'Em andamento' },
                    { status: 'A iniciar' },
                    { status: 'Análise de Documentos' }
                ]
            }).count()

            const propostas = await Proposta.find({
                $or: [
                    { status: 'Em andamento' },
                    { status: 'A iniciar' },
                    { status: 'Análise de Documentos' }
                ]
            })

            const vigencias = []

            propostas.forEach(proposta => {

                const { vigencia } = proposta

                const indice = vigencias.findIndex((item) => item.vigencia === vigencia)

                if (indice === -1) {
                    vigencias.push({ vigencia, quantidade: 1 })
                } else {
                    vigencias[indice].quantidade++
                }

            })

            const totalEmAnalise = propostas.length

            const obj = {
                recebidasHoje,
                emAnalise,
                totalEmAnalise,
                vigencias
            }

            console.log(obj);

            return res.json(obj)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    registroPropostaManual: async (req, res) => {
        try {

            const { dadosProposta } = req.body

            await PropostaManual.create(dadosProposta)

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

    showPropostasManual: async (req, res) => {
        try {

            const propostas = await PropostaManual.find()

            return res.json(propostas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    showPropostasManualAndamento: async (req, res) => {
        try {

            const propostas = await PropostaManual.find({
                status: 'Em andamento'
            })

            return res.json(propostas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    cancelarCpf: async (req, res) => {
        try {

            const { dados } = req.body

            await CpfCancelado.create(dados)

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

    consultaCpfCancelado: async (req, res) => {
        try {

            const { cpf } = req.params

            const result = await CpfCancelado.findOne({
                cpfCorretor: cpf
            })

            if (!result) {
                return res.json({
                    msg: 'Não achou'
                })
            }

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

    salvarDiploma: async (req, res) => {
        try {

            const { dados } = req.body

            const { universidade, curso, numeroRegistro } = dados

            await Proposta.updateOne({
                _id: dados.id
            }, {
                universidade,
                curso,
                numeroRegistro
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

    buscarDiploma: async (req, res) => {
        try {

            const { universidade, curso, numeroRegistro, id } = req.body.dados

            if (!universidade || !curso || !numeroRegistro) {
                const diplomas = []

                return res.json(diplomas)
            }

            const diplomas = await Proposta.find({
                universidade,
                curso,
                numeroRegistro,
                _id: { $ne: id }
            })

            return res.json(diplomas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    buscarUniversidades: async (req, res) => {
        try {

            const result = await Proposta.aggregate([
                {
                    $group: {
                        _id: null, // Usamos null para agrupar todos os documentos em um único grupo
                        universidades: { $addToSet: "$universidade" }
                    }
                }
            ])

            const universidades = result[0].universidades

            return res.json(universidades)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    buscarCursos: async (req, res) => {
        try {

            const result = await Proposta.aggregate([
                {
                    $group: {
                        _id: null, // Usamos null para agrupar todos os documentos em um único grupo
                        cursos: { $addToSet: "$curso" }
                    }
                }
            ])

            const cursos = result[0].cursos

            return res.json(cursos)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    migrarBanco: async (req, res) => {

        try {
            connection.query("SELECT * FROM analise", async (err, rows) => {
                if (err) {
                    console.log(err);
                    return
                }

                for (const item of rows) {

                    if (item.enviadaUnder === 'Pré Processamento') {
                        item.enviadaUnder = 'A iniciar'
                    }

                    var mapeamento = {
                        Samantha: "Samantha Maciel Giazzon",
                        Gerson: "Fernanda Ribeiro",
                        Djeinny: "Djeinny Carradore",
                        Matheus: "Matheus Lopes",
                        Daniele: "Daniele Silva",
                        Vanessa: "Vanessa Passos da Silva",
                        Barbara: "Bárbara Cristina Nunes",
                        Claudia: "Cecilia Belli",
                        Fernanda: "Fernanda Ribeiro",
                        Denise: "Denise Gonçalves Vargas",
                        Luciana: "Luciana Tavares",
                        Jessica: "Jéssica Wachesk",
                        Camila: "Camila Cristine Remus",
                        Ana: "Ana Paula Brás",
                        Giovana: "Giovana Santana",
                        Allana: "Allana Silva",
                        Hevellin: "Hevellin Santos",
                        Eduarda: "Eduarda Mayworm",
                        Isabelle: "Isabelle Silva",
                        Sandra: "Sandra Santos",
                        Michelle: "Michelle Jonsson"
                    };

                    var nomeAntigo = item.analistaResponsavel;
                    if (mapeamento.hasOwnProperty(nomeAntigo)) {
                        item.analistaResponsavel = mapeamento[nomeAntigo];
                    }

                    if (item.ligacao?.toLowerCase() === 'sim') {
                        item.ligacao = true
                    } else if (item.ligacao?.toLowerCase() === 'não' || item.ligacao?.toLowerCase() === 'nao') {
                        item.ligacao = false
                    } else {
                        item.ligacao = undefined
                    }

                    if (item.documento_identificacao?.toLowerCase() === 'sim') {
                        item.documento_identificacao = true
                    } else if (item.documento_identificacao?.toLowerCase() === 'não' || item.documento_identificacao?.toLowerCase() === 'nao') {
                        item.documento_identificacao = false
                    } else {
                        item.documento_identificacao = undefined
                    }

                    if (item.declaracao_associado_carteirinha?.toLowerCase() === 'sim') {
                        item.declaracao_associado_carteirinha = true
                    } else if (item.declaracao_associado_carteirinha?.toLowerCase() === 'não' || item.declaracao_associado_carteirinha?.toLowerCase() === 'nao') {
                        item.declaracao_associado_carteirinha = false
                    } else {
                        item.declaracao_associado_carteirinha = undefined
                    }

                    let vinculadosSimNao = undefined

                    if (item.vinculados) {
                        vinculadosSimNao = true
                    }

                    if (item.plano_anterior?.toLowerCase() === 'sim') {
                        item.plano_anterior = true
                    } else if (item.plano_anterior?.toLowerCase() === 'não' || item.plano_anterior?.toLowerCase() === 'nao') {
                        item.plano_anterior = false
                    } else {
                        item.plano_anterior = undefined
                    }

                    if (item.sisamil_deacordo?.toLowerCase() === 'sim') {
                        item.sisamil_deacordo = true
                    } else if (item.sisamil_deacordo?.toLowerCase() === 'não' || item.sisamil_deacordo?.toLowerCase() === 'nao') {
                        item.sisamil_deacordo = false
                    } else {
                        item.sisamil_deacordo = undefined
                    }

                    if (item.site?.toLowerCase() === 'sim') {
                        item.site = true
                    } else if (item.site?.toLowerCase() === 'não' || item.site?.toLowerCase() === 'nao') {
                        item.site = false
                    } else {
                        item.site = undefined
                    }

                    let fase1 = false

                    if (item.finalizada_pre) {
                        fase1 = true
                    }


                    const obj = {
                        dataImportacao: ajustarData(item.dataImportacao),
                        vigencia: item.inicioVigencia,
                        proposta: item.proposta,
                        statusMotor: item.statusMotor,
                        status: item.enviadaUnder,
                        status1Analise: item.status1analise,
                        status2Analise: item.status2analise,
                        status3Analise: item.status3analise,
                        produto: item.produto,
                        plano: item.plano,
                        produtor: item.produtor,
                        uf: item.uf,
                        administradora: item.administradora,
                        codCorretor: item.codCorretor,
                        nomeCorretor: item.corretor,
                        entidade: item.entidade,
                        tipoVinculo: item.tipoVinculo,
                        nome: item.nomeTitular,
                        idade: item.idadeBeneficiario,
                        numeroVidas: item.numeroVidas,
                        valorMedico: item.valorMedico,
                        valorDental: item.valorDental,
                        valorTotal: item.valorTotal,
                        primeiraDevolucao1: item.primeiraDevolucao1,
                        primeiraDevolucao2: item.primeiraDevolucao2,
                        primeiraDevolucao3: item.primeiraDevolucao3,
                        primeiraDevolucao4: item.primeiraDevolucao4,
                        reprotocolo1: item.reprotocolo1,
                        reprotocolo2: item.reprotocolo2,
                        reprotocolo3: item.reprotocolo3,
                        segundoReprotocolo1: item.segundoReprotocolo1,
                        segundoReprotocolo2: item.segundoReprotocolo2,
                        segundoReprotocolo3: item.segundoReprotocolo3,
                        observacoesDevolucao: item.segundoReprotocolo4,
                        analista: item.analistaResponsavel,
                        dataConclusao: item.finalizada ? ajustarData(item.finalizada) : undefined,
                        ligacao: item.ligacao,
                        prc: item.pontosDeAtencao,
                        motivoCancelamento: item.motivoCancelamento,
                        evidenciaFraude: item.evidenciaFraude,
                        cpfCorretor: item.cpf_corretor,
                        telefoneCorretor: item.telefone_corretor,
                        nomeSupervisor: item.supervisor,
                        cpfSupervisor: item.cpf_supervisor,
                        telefoneSupervisor: item.telefone_supervisor,
                        cpf: item.cpf_titular,
                        planoAmil: item.plano_amil,
                        dataInicioPlanoAmil: item.data_inicio_plano_amil,
                        dataFimPlanoAmil: item.data_fim_plano_amil,
                        custoPlanoAmil: item.custo_plano_amil,
                        documentoIdentificacao: item.documento_identificacao,
                        declaracaoAssociadoCarteirinha: item.declaracao_associado_carteirinha,
                        vinculados: item.vinculados,
                        vinculadosSimNao,
                        planoAnterior: item.plano_anterior,
                        faltaDoc: item.falta_doc,
                        sisAmilDeacordo: item.sisamil_deacordo,
                        site: item.site,
                        contrato: item.contrato,
                        analistaPreProcessamento: item.analista_1,
                        dataConclusaoPre: item.finalizada_pre ? ajustarData(item.finalizada_pre) : undefined,
                        observacoes: item.observacoes,
                        categoriaCancelamento: item.categoria_cancelamento,
                        fase1
                    }

                    await Proposta.create(obj)

                }

                return res.json({ msg: 'oi' })
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }

    },

    adicionarUniversidades: async (req, res) => {
        try {

            connection.query("SELECT * FROM blacklist_diplomas GROUP BY proposta", async function (err, result, fields) {
                if (err) throw err;

                for (const item of result) {
                    await Proposta.updateOne({
                        proposta: item.proposta
                    }, {
                        numeroRegistro: item.n_registro,
                        universidade: item.universidade,
                        curso: item.curso
                    })

                }


                return res.json(result.length)
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    adicionarBlacklist: async (req, res) => {
        try {

            connection.query("SELECT * FROM analise WHERE enviadaUnder = 'Cancelada'", async function (err, result, fields) {
                if (err) throw err;

                for (const item of result) {

                    await Blacklist.create({
                        proposta: item.proposta,
                        codCorretor: item.codCorretor,
                        entidade: item.entidade,
                        administradora: item.administradora,
                        cpfCorretor: item.cpf_corretor,
                        telefoneCorretor: item.telefone_corretor,
                        nomeCorretor: item.corretor,
                        nomeSupervisor: item.supervisor,
                        cpfSupervisor: item.cpf_supervisor,
                        telefoneSupervisor: item.telefone_supervisor,
                        motivoCancelamento: item.motivoCancelamento,
                        categoriaCancelamento: item.categoria_cancelamento,
                        evidenciaFraude: item.evidenciaFraude
                    })
                }


                return res.json(result.length)
            });

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