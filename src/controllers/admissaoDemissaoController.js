const { default: mongoose } = require('mongoose');
const User = require('../models/User/User')
const moment = require('moment')

module.exports = {

    createAdmissao: async (req, res) => {
        try {
            const { _id } = req.body

            const admissao = [
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Agendamento Exame Admissional',
                    fornecedor: 'Clinimerces',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Planilha Contratação',
                    fornecedor: 'Eniltec',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Assinar Documentos',
                    fornecedor: 'Eniltec',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Foto 3x4',
                    fornecedor: '',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Administrador',
                    acao: 'Conta Salário',
                    fornecedor: 'CEF',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Administrador',
                    acao: 'VR',
                    fornecedor: 'Site Caixa',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Administrador',
                    acao: 'VC',
                    fornecedor: 'Site VR',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Administrador',
                    acao: 'VT/Metrocard',
                    fornecedor: 'URBS',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Gerson Douglas',
                    acao: 'Email',
                    fornecedor: 'Localweb',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Gerson Douglas',
                    acao: 'Assinatura Email',
                    fornecedor: '',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Gerson Douglas',
                    acao: 'Linux',
                    fornecedor: '',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Gerson Douglas',
                    acao: 'Notebook',
                    fornecedor: '',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Gerson Douglas',
                    acao: 'Ramal',
                    fornecedor: '',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Portal LPL',
                    fornecedor: '',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Ponto',
                    fornecedor: 'Voux',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Crachá',
                    fornecedor: 'Perfect Design',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Digital Sala',
                    fornecedor: 'You Do',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Transunion',
                    fornecedor: '',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Sisamil',
                    fornecedor: '',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Treinamentos Obrigatórios',
                    fornecedor: 'Clinimerces',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
            ]
            console.log(_id);

            const result = await User.findOneAndUpdate(
                {
                    _id: _id

                },
                {
                    admissao
                }

            )
            const find = await User.findOne({ _id })
            return res.status(200).json(find)

        } catch (error) {
            return res.status(500).json({
                msg: 'Internal Server Error',
                error: error.message // Melhor captura do erro, pegando a mensagem de erro
            });
        }
    },

    createDemissao: async (req, res) => {
        try {
            const { _id } = req.body

            const demissao = [
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Entrega Carta Pedido de Demissão ou Assinatura de Rescisão do Contrato',
                    fornecedor: 'Próprio punho ou Eniltec',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Agendamento Exame Demissional',
                    fornecedor: 'Clinimerces',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Envio docs assinados para baixa',
                    fornecedor: 'Eniltec',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Assinar Documentos/Acerto',
                    fornecedor: 'Eniltec',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Administrador',
                    acao: 'Conta Salário',
                    fornecedor: 'CEF',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Administrador',
                    acao: 'VR',
                    fornecedor: 'Site Caixa',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Administrador',
                    acao: 'VC',
                    fornecedor: 'Site VR',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Administrador',
                    acao: 'VT/Metrocard',
                    fornecedor: 'URBS',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Gerson Douglas',
                    acao: 'Cancelar Email',
                    fornecedor: 'Localweb',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Gerson Douglas',
                    acao: 'Cancelar Linux',
                    fornecedor: '',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Gerson Douglas',
                    acao: 'Notebook',
                    fornecedor: '',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Gerson Douglas',
                    acao: 'Ramal',
                    fornecedor: '',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Cancelar Portal LPL',
                    fornecedor: '',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Fechar e Cancelar Ponto',
                    fornecedor: 'Voux',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Cancelar Acesso Crachá',
                    fornecedor: 'You Do',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Cancelar Digital Sala',
                    fornecedor: 'You Do',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Cancelar Transunion',
                    fornecedor: '',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                },
                {
                    responsavel: 'Samantha Maciel Giazzon',
                    acao: 'Cancelar Sisamil',
                    fornecedor: '',
                    obs: '',
                    status: '',
                    data: '',
                    id: mongoose.Types.ObjectId()
                }
            ]
            console.log(_id);

            const result = await User.findOneAndUpdate(
                {
                    _id: _id

                },
                {
                    demissao
                }



            )

            const find = await User.findOne({ _id })

            return res.status(200).json(find)

        } catch (error) {
            return res.status(500).json({
                msg: 'Internal Server Error',
                error: error.message // Melhor captura do erro, pegando a mensagem de erro
            });
        }
    },

    setStatus: async (req, res) => {
        try {
            console.log(req.body)
            let tipoExame = 'admissao.id'
            if (req.body.tipoExame === 'demissao') {
                tipoExame = 'demissao.id'
            }
            const result = await User.findOneAndUpdate({ _id: req.body._id, [tipoExame]: mongoose.Types.ObjectId(req.body.id) }, { $set: { [`${req.body.tipoExame}.$.status`]: req.body.status } })
            const find = await User.findOne({ _id: req.body._id })

            return res.status(200).json(find)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    setObs: async (req, res) => {
        try {
            console.log(req.body)
            let tipoExame = 'admissao.id'
            if (req.body.tipoExame === 'demissao') {
                tipoExame = 'demissao.id'
            }
            const result = await User.findOneAndUpdate({ _id: req.body._id, [tipoExame]: mongoose.Types.ObjectId(req.body.id) }, { $set: { [`${req.body.tipoExame}.$.obs`]: req.body.obs } })
            const find = await User.findOne({ _id: req.body._id })

            return res.status(200).
                json(find)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    setData: async (req, res) => {
        try {
            console.log(req.body)
            let tipoExame = 'admissao.id'
            if (req.body.tipoExame === 'demissao') {
                tipoExame = 'demissao.id'
            }
            const result = await User.findOneAndUpdate({ _id: req.body._id, [tipoExame]: mongoose.Types.ObjectId(req.body.id) }, { $set: { [`${req.body.tipoExame}.$.data`]: req.body.data } })
            const find = await User.findOne({ _id: req.body._id })

            return res.status(200).
                json(find)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    prorrogacao: async (req, res) => {
        try {

            const { name, prorrogacao } = req.body

            const result = await User.findOneAndUpdate({ name: name }, {
                prorrogacao: prorrogacao,
            })
            console.log(name, prorrogacao);

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

    getAllItens: async (req, res) => {
        try {
            const users = await User.find();
            const itens = [];

            for (const user of users) {
                if (user.admissao) {
                    const passouTrintaDias = moment(user.dataAdmissao).add(29, 'days').isBefore(moment()) && !user.prorrogacao;

                    if (req.user === 'Samantha Maciel Giazzon' && passouTrintaDias) {
                        itens.push({
                            nome: user.name,
                            acao: `É necessário assinar o Contrato de Prorrogação para o Colaborador ${user.name} no dia ${moment(user.dataAdmissao).add(30, 'days').format('DD/MM/YYYY')}`,
                            negrito: true,
                        });
                    }
                    for (const item of user.admissao) {
                        if (req.user === item.responsavel && (item.status !== 'concluido' && item.status !== 'naoSeAplica')) {
                            itens.push({
                                nome: user.name,
                                acao: item.acao,
                            });
                        }
                    }
                }

                if (user.demissao) {
                    for (const item of user.demissao) {
                        if (req.user === item.responsavel && (item.status !== 'concluido' && item.status !== 'naoSeAplica')) {
                            itens.push({
                                nome: user.name,
                                acao: item.acao,
                            });
                        }
                    }
                }
            }

            return res.json(itens);
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error',
                error: error.message,
            });
        }
    },
}