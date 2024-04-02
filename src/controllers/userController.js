const User = require('../models/User/User')
const Celula = require('../models/User/Celula')
const bcrypt = require('bcrypt')
const moment = require('moment')
const multer = require('multer')
const fs = require('fs')
const Treinamentos = require('../models/Treinamentos/Treinamento')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log(req.user);
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

const upload = multer({ storage }).single('file')

module.exports = {

    create: async (req, res) => {
        try {

            const { email, name, accessLevel, atividade, nomeCompleto, dataAdmissao, matricula, administrador } = req.body


            let emailAutomatico = '';

            if (email === '') {
                let nome = name.split(' ').join('.').toLowerCase().replace(/\s/g, '');
                // Remover acentos
                nome = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "") + '@lplseguros.com.br';
                // Construir o e-mail automático com o nome da pessoa
                emailAutomatico = `${nome}`;
            } else {
                emailAutomatico = email;
            }

            const user = await User.findOne({ email: email || emailAutomatico })

            if (user) {
                console.log(user);
                return res.status(422).json({ msg: 'Email ja cadastrado' })
            }

            const saltRounds = 10; // Aumente o número de rodadas de hashing
            const plainPassword = '123';

            let encryptedPassword = await bcrypt.hash(plainPassword, saltRounds);

            let acessos = {
                agendamento: false,
                administrador: false
            }

            if (administrador) {
                acessos.administrador = true
            }

            const newUser = await User.create({
                email: email || emailAutomatico,
                name,
                password: encryptedPassword,
                accessLevel,
                firstAccess: 'Sim',
                atividadePrincipal: atividade,
                nomeCompleto,
                dataAdmissao,
                matricula,
                acessos
            })

            const treinamentos = await Treinamentos.find()

            for (const treinamento of treinamentos) {
                const treinamentoRealizado = {
                    nome: newUser.name,
                    realizado: false,
                    id: newUser._id,
                    data: null,
                    ativo: true
                }

                await Treinamentos.updateOne({
                    _id: treinamento._id
                }, {
                    $push: {
                        realizados: treinamentoRealizado
                    }
                })
            }

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

    getUsersByFilter: async (req, res) => {
        try {
            // Obter parâmetros de consulta
            let query = req.body;

            console.log(query);

            // Converter parâmetros de consulta em uma matriz
            let dbQuery = Object.keys(query).map(key => {
                return {
                    [key]: query[key]
                }
            });

            // Obter usuários que correspondem à consulta
            let users = await User.find({ $and: dbQuery });

            return res.json(users);
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                error: "Internal server error."
            });
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

            const saltRounds = 10

            const encryptedPassword = await bcrypt.hash(password, saltRounds)

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

    update: async (req, res) => {
        try {

            const { data } = req.body

            await User.updateOne({ _id: data._id }, data)

            return res.status(200).json({
                msg: 'ok'
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

            const saltRounds = 10

            const encryptedPassword = await bcrypt.hash('123', saltRounds)

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
                if (user.inativo) { // Verifique se o usuario está ativo
                    continue
                }
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

                return res.status(200).json({
                    msg: 'ok'
                })
            })

        } catch (error) {
            return res.status(500).json({
                msg: 'Internal Server Error',
                error: error.message // Melhor captura do erro, pegando a mensagem de erro
            });
        }
    },

    getAnalistasAgendamento: async (req, res) => {
        try {

            const result = await User.find({
                atividadePrincipal: 'Agendamento'
            })

            return res.json(result)

        } catch (error) {
            return res.status(500).json({
                msg: 'Internal Server Error',
                error: error.message // Melhor captura do erro, pegando a mensagem de erro
            });
        }
    }
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