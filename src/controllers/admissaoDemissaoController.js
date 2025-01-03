const { default: mongoose } = require('mongoose');
const User = require('../models/User/User')
const moment = require('moment');

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

            await User.findOneAndUpdate(
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

            console.log(_id);

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

            const find = await User.findOne({ _id })

            if (find.demissao.length === 0) {
                const result = await User.findOneAndUpdate(
                    {
                        _id: _id
                    },
                    {
                        demissao
                    }
                )
            }

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
                console.log('entrou aqui');
                tipoExame = 'demissao.id'
            }
            const findOne = await User.findOne({ _id: req.body._id, [tipoExame]: mongoose.Types.ObjectId(req.body.id) })
            if (findOne) {
                await User.updateOne({ _id: req.body._id, [tipoExame]: mongoose.Types.ObjectId(req.body.id) }, { [`${req.body.tipoExame}.$.status`]: req.body.status })
            } else {
                await User.updateOne({ _id: req.body._id, [tipoExame]: req.body.id }, { [`${req.body.tipoExame}.$.status`]: req.body.status })
            }
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
            const findOne = await User.findOne({ _id: req.body._id, [tipoExame]: mongoose.Types.ObjectId(req.body.id) })
            if (findOne) {
                await User.updateOne({ _id: req.body._id, [tipoExame]: mongoose.Types.ObjectId(req.body.id) }, { [`${req.body.tipoExame}.$.obs`]: req.body.obs })
            } else {
                await User.updateOne({ _id: req.body._id, [tipoExame]: req.body.id }, { [`${req.body.tipoExame}.$.obs`]: req.body.obs })
            }
            const find = await User.findOne({ _id: req.body._id })

            return res.status(200).json(find)
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
            const findOne = await User.findOne({ _id: req.body._id, [tipoExame]: mongoose.Types.ObjectId(req.body.id) })
            if (findOne) {
                await User.updateOne({ _id: req.body._id, [tipoExame]: mongoose.Types.ObjectId(req.body.id) }, { [`${req.body.tipoExame}.$.data`]: req.body.data })
            } else {
                await User.updateOne({ _id: req.body._id, [tipoExame]: req.body.id }, { [`${req.body.tipoExame}.$.data`]: req.body.data })
            }
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
                    const passouQuarentaECincoDias = moment(user.dataAdmissao).add(44, 'days').isBefore(moment()) && !user.prorrogacao;

                    if (req.user === 'Samantha Maciel Giazzon' && passouQuarentaECincoDias) {
                        itens.push({
                            nome: user.name,
                            acao: `É necessário assinar o Contrato de Prorrogação para o Colaborador ${user.name} no dia ${moment(user.dataAdmissao).add(45, 'days').format('DD/MM/YYYY')}`,
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

    filterTableAdmissional: async (req, res) => {
        try {

            const { status, responsavel, acao } = req.body

            if (Object.values(responsavel).every(e => e === false) && Object.values(status).every(e => e === false)) {
                if (acao.length !== 0) {
                    const result = await User.find().lean()

                    let filtrado = result.map(user => {
                        const admissao = user?.admissao?.find((item) => item.acao === acao[0])
                        const response = { ...user, admissao: admissao ? [admissao] : [] }
                        console.log(response);
                        return response
                    })

                    filtrado = filtrado.filter((item) => {
                        return item.admissao.length !== 0
                    })

                    return res.json({ result: filtrado })


                } else {
                    const result = await User.find()
                    return res.json({ result })
                }
            }

            let filter = {

                $and: []
            }

            let filterConditions = []

            if (status.naoSeAplica) {
                filterConditions.push({ 'admissao.status': 'naoSeAplica' })
            }

            if (status.pendente) {
                filterConditions.push({
                    '$or': [
                        { 'admissao.status': 'pendente' },
                        { 'admissao.status': '' }
                    ]
                })
            }

            if (status.emAndamento) {
                filterConditions.push({ 'admissao.status': 'emAndamento' })
            }

            if (status.concluido) {
                filterConditions.push({ 'admissao.status': 'concluido' })
            }

            if (responsavel.samanthaMacielGiazzon) {
                filterConditions.push({ 'admissao.responsavel': 'Samantha Maciel Giazzon' })
            }

            if (responsavel.administrador) {
                filterConditions.push({ 'admissao.responsavel': 'Administrador' })
            }

            if (responsavel.gersonDouglas) {
                filterConditions.push({ 'admissao.responsavel': 'Gerson Douglas' })
            }

            if (filterConditions.length > 0) {
                filter.$and = filterConditions
            }

            const result = await User.find(filter).lean()

            console.log(filter);

            let resultFiltrado = result.map(user => {
                const admissao = user.admissao.filter(item => {
                    let statusMatch = false;
                    let responsavelMatch = false;

                    if (status.naoSeAplica && item.status === 'naoSeAplica' ||
                        status.pendente && item.status === 'pendente' ||
                        status.pendente && item.status === '' ||
                        status.emAndamento && item.status === 'emAndamento' ||
                        status.concluido && item.status === 'concluido' ||
                        Object.values(status).every(e => e === false)
                    ) {
                        statusMatch = true;
                    }

                    if (responsavel.samanthaMacielGiazzon && item.responsavel === 'Samantha Maciel Giazzon' ||
                        responsavel.administrador && item.responsavel === 'Administrador' ||
                        responsavel.gersonDouglas && item.responsavel === 'Gerson Douglas' ||
                        Object.values(responsavel).every(e => e === false)
                    ) {
                        responsavelMatch = true;
                    }

                    return statusMatch && responsavelMatch;
                })

                return {
                    ...user,
                    admissao
                }
            })

            if (acao.length !== 0) {
                resultFiltrado = resultFiltrado.map(user => {
                    const admissao = user?.admissao?.find((item) => item.acao === acao[0])
                    const response = { ...user, admissao: admissao ? [admissao] : [] }
                    console.log(response);
                    return response
                })
            }

            resultFiltrado = resultFiltrado.filter((item) => {
                return item.admissao.length !== 0
            })

            console.log(resultFiltrado);

            return res.json({ result: resultFiltrado })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    filterTableDemissional: async (req, res) => {
        try {

            const { status, responsavel, acao } = req.body

            if (Object.values(responsavel).every(e => e === false) && Object.values(status).every(e => e === false)) {
                if (acao.length !== 0) {
                    const result = await User.find().lean()

                    let filtrado = result.map(user => {
                        const demissao = user?.demissao?.find((item) => item.acao === acao[0])
                        const response = { ...user, demissao: demissao ? [demissao] : [] }
                        console.log(response);
                        return response
                    })

                    filtrado = filtrado.filter((item) => {
                        return item.demissao.length !== 0
                    })

                    return res.json({ result: filtrado })

                } else {
                    const result = await User.find()
                    return res.json({ result })
                }
            }

            let filter = {

                $and: []
            }

            let filterConditions = []

            if (status.naoSeAplica) {
                filterConditions.push({ 'demissao.status': 'naoSeAplica' })
            }

            if (status.pendente) {
                // filterConditions.push({ 'demissao.status': 'pendente' })
                // filterConditions.push({ 'demissao.status': '' })
                filterConditions.push({
                    '$or': [
                        { 'demissao.status': 'pendente' },
                        { 'demissao.status': '' }
                    ]
                })
            }

            if (status.emAndamento) {
                filterConditions.push({ 'demissao.status': 'emAndamento' })
            }

            if (status.concluido) {
                filterConditions.push({ 'demissao.status': 'concluido' })
            }

            if (responsavel.samanthaMacielGiazzon) {
                filterConditions.push({ 'demissao.responsavel': 'Samantha Maciel Giazzon' })
            }

            if (responsavel.administrador) {
                filterConditions.push({ 'demissao.responsavel': 'Administrador' })
            }

            if (responsavel.gersonDouglas) {
                filterConditions.push({ 'demissao.responsavel': 'Gerson Douglas' })
            }

            if (filterConditions.length > 0) {
                filter.$and = filterConditions
            }

            const result = await User.find(filter).lean()

            let resultFiltrado = result.map(user => {
                const demissao = user.demissao.filter(item => {
                    let statusMatch = false;
                    let responsavelMatch = false;

                    if (status.naoSeAplica && item.status === 'naoSeAplica' ||
                        status.pendente && item.status === 'pendente' ||
                        status.pendente && item.status === '' ||
                        status.emAndamento && item.status === 'emAndamento' ||
                        status.concluido && item.status === 'concluido' ||
                        Object.values(status).every(e => e === false)
                    ) {
                        statusMatch = true;
                    }

                    if (responsavel.samanthaMacielGiazzon && item.responsavel === 'Samantha Maciel Giazzon' ||
                        responsavel.administrador && item.responsavel === 'Administrador' ||
                        responsavel.gersonDouglas && item.responsavel === 'Gerson Douglas' ||
                        Object.values(responsavel).every(e => e === false)
                    ) {
                        responsavelMatch = true;
                    }

                    return statusMatch && responsavelMatch;
                })

                return {
                    ...user,
                    demissao
                }
            })

            if (acao.length !== 0) {
                resultFiltrado = resultFiltrado.map(user => {
                    const demissao = user?.demissao?.find((item) => item.acao === acao[0])
                    const response = { ...user, demissao: demissao ? [demissao] : [] }
                    console.log(response);
                    return response
                })
            }

            resultFiltrado = resultFiltrado.filter((item) => {
                return item.demissao.length !== 0
            })

            return res.json({ result: resultFiltrado })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    findAcoesAdmissional: async (req, res) => {
        try {
            const result = await User.findOne({ name: 'Thays Bispo' })

            let acoes = result.admissao.map(item => {
                return [item.acao]
            })

            return res.status(200).json({ acoes })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error })
        }
    },

    findAcoesDemissional: async (req, res) => {
        try {
            const result = await User.findOne({ name: 'Michelle Jonsson' })

            let acoes = result.demissao.map(item => {
                return [item.acao]
            })

            return res.status(200).json({ acoes })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error })
        }
    },
}