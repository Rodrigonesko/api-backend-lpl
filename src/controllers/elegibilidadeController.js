const mongoose = require('mongoose')
const Proposta = mongoose.model('PropostasElegibilidade')
const Agenda = mongoose.model('AgendaElegibilidade')
const Prc = mongoose.model('Prc')

const path = require('path')
const moment = require('moment')
const fs = require('fs')
const multer = require('multer')
const os = require('os')

const uploadPropostas = multer({ dest: os.tmpdir() }).single('file')

module.exports = {
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

            if (req.userAcessLevel != 1) {

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

    salvarDadosPreProcessamento: async (req, res) => {
        try {

            const { dados, id, proxFase } = req.body

            console.log(dados);

            for (const item of Object.keys(dados)) {
                await Proposta.findByIdAndUpdate({
                    _id: id
                }, {
                    [item]: dados[item]
                })
            }

            if (proxFase) {

                if (!dados.planoAmil) {
                    return res.status(500).json({
                        msg: 'Campo Plano Amil não foi marcado'
                    })
                }

                if (!dados.documentoIdentificacao) {
                    return res.status(500).json({
                        msg: 'Campo Documento Identificação não foi marcado'
                    })
                }
                if (!dados.declaracaoAssociado) {
                    return res.status(500).json({
                        msg: 'Campo Declaração de Associado ou Carteirinha não foi marcado'
                    })
                }
                if (!dados.vinculadosSimNao) {
                    return res.status(500).json({
                        msg: 'Campo Vinculados não foi marcado'
                    })
                }
                if (!dados.planoAnterior) {
                    return res.status(500).json({
                        msg: 'Campo Plano Anterior não foi marcado'
                    })
                }

                if (dados.faltaDoc === 'Sem Anexos') {
                    return res.status(200).json({
                        msg: "Sem Anexos"
                    })
                }

                await Proposta.findByIdAndUpdate({
                    _id: id
                }, {
                    status: 'A iniciar',
                    analista: 'A definir',
                    dataConclusaoPre: moment(new Date()).format('YYYY-MM-DD')
                })
            }

            return res.status(200).json({
                msg: 'OIi'
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

            console.log(analista);

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

            if (req.userAcessLevel == 1) {
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

    statusEmAndamento: async (req, res) => {
        try {

            const { id } = req.body

            const proposta = await Proposta.findByIdAndUpdate({
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
                await Proposta.updateOne({ _id: id }, { fase1: true });
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

    buscarAgenda: async (req, res) => {
        try {

            const { proposta } = req.params

            const agenda = await Agenda.find({
                proposta
            })

            console.log(agenda);

            console.log(proposta);

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

            const { id, erroSistema } = req.body

            const find = await Proposta.findById({
                _id: id
            })


            if (!find.status1Analise) {

                let status = 'Enviada para Under'

                if (erroSistema) {
                    status = 'Erro Sistema'
                }

                await Proposta.findByIdAndUpdate({
                    _id: id
                }, {
                    status1Analise: 'Liberada',
                    primeiraDevolucao1: 'Liberada',
                    status,
                    dataConclusao: moment(new Date()).format('YYYY-MM-DD')
                })

                return res.status(200).json({
                    msg: 'Ok'
                })
            }

            if (find.status3Analise || find.status2Analise) {
                let status = 'Enviada para Under'

                if (erroSistema) {
                    status = 'Erro Sistema'
                }

                await Proposta.findByIdAndUpdate({
                    _id: id
                }, {
                    status3Analise: 'Liberada',
                    segundoReprotocolo1: 'Liberada',
                    status,
                    dataConclusao: moment(new Date()).format('YYYY-MM-DD')
                })

                return res.status(200).json({
                    msg: 'Ok'
                })
            }

            if (find.status1Analise) {

                let status = 'Enviada para Under'

                if (erroSistema) {
                    status = 'Erro Sistema'
                }

                await Proposta.findByIdAndUpdate({
                    _id: id
                }, {
                    status2Analise: 'Liberada',
                    reprotocolo1: 'Liberada',
                    status,
                    dataConclusao: moment(new Date()).format('YYYY-MM-DD')
                })

                return res.status(200).json({
                    msg: 'Ok'
                })
            }

            return res.status(200).json({
                msg: 'oii'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    enviarFaseCancelamento: async (req, res) => {
        try {

            const { id, motivoCancelamento, categoriaCancelamento, evidenciaFraude } = req.body

            const update = await Proposta.findByIdAndUpdate({
                _id: id
            }, {

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

            const { id, motivosDevolucao, observacoes } = req.body



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