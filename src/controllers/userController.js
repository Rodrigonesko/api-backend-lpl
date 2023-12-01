const User = require('../models/User/User')
const Celula = require('../models/User/Celula')
const bcrypt = require('bcrypt')
const moment = require('moment')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { Mongoose, default: mongoose } = require('mongoose')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = `./uploads/profilePic/`
        if (!fs.existsSync(dir)) {
            fs.mkdir(dir, (err) => {
                if (err) {
                    console.log(err);
                    return;
                }
                console.log('diretório criado com sucesso');
            });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, `${req.user}.jpg`)
    }
})

const upload = multer({ storage: storage }).single('file')

module.exports = {

    create: async (req, res) => {
        try {

            const { email, name, accessLevel, atividade, nomeCompleto, dataAdmissao } = req.body

            const user = await User.findOne({ email })

            if (user) {
                return res.status(422).json({ message: `O email ${email} ja foi registrado` })
            }

            const encryptedPassword = await bcrypt.hash('123', 8)

            const newUser = await User.create({
                email,
                name,
                password: encryptedPassword,
                accessLevel,
                firstAccess: 'Sim',
                atividadePrincipal: atividade,
                nomeCompleto,
                dataAdmissao
            })
            return res.status(201).json(newUser)

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    index: async (req, res) => {
        try {
            const users = await User.find()

            return res.json(users)
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    infoUser: async (req, res) => {
        try {

            const user = await User.findOne({ email: req.email })

            return res.status(200).json({
                user
            })

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    firstAccess: async (req, res) => {
        try {

            const { password, confirmPassword } = req.body

            if (password !== confirmPassword) {
                return res.status(401).json({ message: `As senhas não conferem` })
            }

            console.log(req.email);

            const encryptedPassword = await bcrypt.hash(password, 8)

            const updatePass = await User.findOneAndUpdate({
                email: req.email
            }, {
                password: encryptedPassword,
                firstAccess: 'Não'
            })

            return res.status(200).json({
                message: 'A senha foi atualizada com sucesso!',
                updatePass
            })


        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    searchEmail: async (req, res) => {
        try {
            const { email } = req.params

            console.log(email);

            const user = await User.findOne({ email: email })

            return res.status(200).json({
                user
            })
        } catch (error) {
            return res.status(500).json({
                error: "Internal server error.",
                error
            })
        }
    },

    modules: async (req, res) => {
        try {

            const { email, enfermeiro, elegibilidade, entrada1, saida1, entrada2, saida2, atividadePrincipal, coren, rsd, nomeCompleto, dataAdmissao, administrador, agendamento, dataAniversario } = req.body

            const acessos = {
                agendamento,
                administrador
            }

            const result = await User.findOneAndUpdate({ email: email }, {
                enfermeiro,
                elegibilidade,
                horarioEntrada1: entrada1,
                horarioSaida1: saida1,
                horarioEntrada2: entrada2,
                horarioSaida2: saida2,
                rsd,
                atividadePrincipal,
                coren,
                nomeCompleto,
                dataAdmissao,
                dataAniversario,
                $set: {
                    acessos
                }
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

    enfermeiros: async (req, res) => {
        try {
            const enfermeiros = await User.find({
                enfermeiro: 'true'
            })

            return res.status(200).json({
                enfermeiros
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    analistasElegi: async (req, res) => {
        try {
            const analistas = await User.find({
                elegibilidade: 'true'
            })

            return res.status(200).json({
                analistas
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    analistasRsd: async (req, res) => {
        try {

            const analistas = await User.find({
                rsd: true
            })

            return res.json(analistas)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    resetPassword: async (req, res) => {
        try {

            const { email } = req.body

            const encryptedPassword = await bcrypt.hash('123', 8)

            const update = await User.updateOne({
                email
            }, {
                password: encryptedPassword,
                firstAccess: 'Sim'
            })

            return res.status(200).json({
                update
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    coren: async (req, res) => {
        try {

            const { name } = req.params

            const result = await User.findOne({
                name
            })

            const coren = result.coren

            return res.json(coren)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    lerPolitica: async (req, res) => {
        try {

            const { id } = req.body

            await User.updateOne({
                name: req.user
            }, {
                $push: { politicasLidas: id }
            })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    getAllCelulas: async (req, res) => {
        try {
            const result = await Celula.find()
            return res.json(result)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    createCelula: async (req, res) => {
        try {
            const { celula } = req.body
            await Celula.create({
                celula
            })
            return res.json({
                msg: 'ok'
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    deleteCelula: async (req, res) => {
        try {
            const { celula } = req.params
            await Celula.deleteOne({
                celula
            })
            return res.json({
                msg: 'ok'
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    updateBancoHoras: async (req, res) => {
        try {

            const { dados } = req.body

            for (const item of dados) {

                if (!item.Nome) {
                    continue
                }

                await User.updateOne({
                    nomeCompleto: item.Nome
                }, {
                    bancoHoras: item.BTotal || '',
                    dataBancoHoras: moment().format('YYYY-MM-DD')
                })
            }

            return res.json(dados)
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    updateHorarioPonto: async (req, res) => {
        try {

            const { dados } = req.body

            for (const item of dados) {
                const entrada1 = moment(item['ENTRADA 1'], 'HH:mm')
                const saida1 = moment(item['SAÍDA 1'], 'HH:mm')
                const entrada2 = moment(item['ENTRADA 2'], 'HH:mm')

                const horasTrabalhadas = calcularDiferencaEntreHorarios(entrada1, saida1)

                const horasFaltantes = calcularDiferencaEntreHorarios(horasTrabalhadas, '08:00')

                const horarioSaida = entrada2.add(moment(horasFaltantes, 'HH:mm').hours(), 'hours').add(moment(horasFaltantes, 'HH:mm').minutes(), 'minutes').format('YYYY-MM-DD HH:mm');

                await User.updateOne({
                    nomeCompleto: item.NOME
                }, {
                    horarioSaida
                })

                console.log(horasTrabalhadas, horasFaltantes, horarioSaida, item.NOME);
            }

            return res.json(dados)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    getFeriasElegiveis: async (req, res) => {
        try {

            const users = await User.find()

            const feriasElegiveis = []

            for (const user of users) {
                if (user.vencimentoFerias.length) {
                    for (const item of user.vencimentoFerias) {
                        if (!item.tirouFerias) {
                            feriasElegiveis.push({
                                nome: user.nomeCompleto || user.name,
                                anoFerias: moment(user.dataAdmissao).year(item.anoVencimento).format('YYYY-MM-DD'),
                                vencimento: moment(user.dataAdmissao).year(item.anoVencimento + 1).format('YYYY-MM-DD')
                            })
                        }
                    }
                }
            }

            feriasElegiveis.sort((a, b) => {
                const dataA = moment(a.vencimento);
                const dataB = moment(b.vencimento);
                return dataA - dataB;
            });

            return res.json(feriasElegiveis)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    getAllAniversariantes: async (req, res) => {
        try {
            const result = await User.find()

            const aniversarios = []

            for (const user of result) {
                if (user.dataAniversario) { // Verifique se o usuário possui uma data de aniversário definida
                    aniversarios.push({
                        nome: user.name,
                        dataAniversario: moment(user.dataAniversario).format('YYYY-MM-DD'),
                    })
                }
            }

            return res.json(aniversarios)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error',
                error: error.message // Melhor captura do erro, pegando a mensagem de erro
            });
        }
    },

    updateProfilePic: async (req, res) => {
        try {

            upload(req, res, async (err) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        error: "Internal server error."
                    })
                }

                const { filename } = req.file

                const result = await User.updateOne({
                    email: req.email
                }, {
                    profilePic: `${req.user}.jpg`
                })

                return res.status(200).json({
                    result
                })
            })

        } catch (error) {
            return res.status(500).json({
                msg: 'Internal Server Error',
                error: error.message // Melhor captura do erro, pegando a mensagem de erro
            });
        }
    },

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
                    responsavel: 'Rodrigo Onesko Dias',
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

}

function calcularDiferencaEntreHorarios(horaString1, horaString2) {

    const hora1 = moment(horaString1, "HH:mm:ss");
    const hora2 = moment(horaString2, "HH:mm:ss");

    const diferencaEmMilissegundos = hora2.diff(hora1);

    const diferencaEmMinutos = moment.duration(diferencaEmMilissegundos).asMinutes();

    const horas = Math.floor(diferencaEmMinutos / 60);
    const minutos = Math.floor(diferencaEmMinutos % 60);

    const diferencaFormatada = moment({ hours: horas, minutes: minutos }).format("HH:mm");

    return diferencaFormatada;
}