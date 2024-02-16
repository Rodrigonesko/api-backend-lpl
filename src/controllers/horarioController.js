const Horario = require('../models/TeleEntrevista/Horario')
const User = require('../models/User/User')
const Rn = require('../models/TeleEntrevista/Rn')
const CloseSchedule = require('../models/TeleEntrevista/CloseSchedule')
const moment = require('moment')
const timzezone = require('moment-timezone')
const { Axios, default: axios } = require('axios')
const Log = require('../models/Logs/LogTele')
const NextCloseSchedule = require('../models/TeleEntrevista/NextCloseSchedule')


const HORARIOS = [
    '08:00', '08:20', '08:40', '09:00', '09:20', '09:40', '10:00', '10:20', '10:40', '11:00',
    '11:20', '11:40', '12:00', '12:20', '12:40', '13:00', '13:20', '13:40', '14:00', '14:20',
    '14:40', '15:00', '15:20', '15:40', '16:00', '16:20', '16:40', '17:00', '17:20', '17:40', '18:00'
];

const criarHorario = async (item, data) => {
    const { horarioEntrada1: entrada1, horarioSaida1: saida1, horarioEntrada2: entrada2, horarioSaida2: saida2 } = item;
    const horarios = HORARIOS.filter(horario => {
        return entrada1 <= horario && ((saida1 > horario || entrada2 <= horario) && saida2 > horario);
    });
    const agendaFechada = await CloseSchedule.findOne({ analista: item.name, data: moment(data).format('YYYY-MM-DD') });
    if (agendaFechada) {
        return;
    }
    const horarioPromises = horarios.map(horario => Horario.create({
        enfermeiro: item.name,
        horario,
        dia: moment(data).format('YYYY-MM-DD')
    }));
    return Promise.all(horarioPromises);
};

module.exports = {

    gerar: async (req, res) => {
        try {
            const data = req.body.dataGerar;
            const find = await Horario.findOne({ dia: data }).lean();

            if (find) {
                return res.status(500).json({ msg: 'Ja foi gerado horario para este dia!' });
            }

            const users = await User.find({
                enfermeiro: 'true',
                inativo: { $ne: true },
                deFerias: { $ne: true }
            });

            await Promise.all(users.map(user => criarHorario(user, data)));

            await Log.create({
                nome: req.user,
                acao: 'Gerou horarios',
                data: moment().format('DD/MM/YYYY HH:mm:ss')
            });

            return res.status(200).json({ msg: 'Horarios Gerados com Sucesso!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal server error." });
        }
    },

    gerarHorarioIndividual: async (req, res) => {
        try {

            const { enfermeiro, data } = req.body

            const horarios = [
                '08:00',
                '08:20',
                '08:40',
                '09:00',
                '09:20',
                '09:40',
                '10:00',
                '10:20',
                '10:40',
                '11:00',
                '11:20',
                '11:40',
                '12:00',
                '12:20',
                '12:40',
                '13:00',
                '13:20',
                '13:40',
                '14:00',
                '14:20',
                '14:40',
                '15:00',
                '15:20',
                '15:40',
                '16:00',
                '16:20',
                '16:40',
                '17:00',
                '17:20',
                '17:40',
                '18:00'
            ]

            const find = await Horario.findOne({
                dia: data,
                enfermeiro: enfermeiro
            }).lean()

            if (find) {
                return res.status(500).json({
                    msg: 'Ja foi gerado horario para este dia!'
                })
            }

            const user = await User.findOne({
                name: enfermeiro
            })

            const entrada1 = user.horarioEntrada1
            const saida1 = user.horarioSaida1
            const entrada2 = user.horarioEntrada2
            const saida2 = user.horarioSaida2

            for (const horario of horarios) {
                if (entrada1 <= horario) {
                    if (saida1 <= horario && entrada2 >= horario) {
                        continue
                    }
                    if (saida2 <= horario) {
                        break
                    }

                    await Horario.create({
                        enfermeiro: enfermeiro,
                        horario: horario,
                        dia: moment(data).format('YYYY-MM-DD')
                    })
                }
            }

            return res.status(200).json({
                msg: 'Horarios Gerados com Sucesso!'
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    search: async (req, res) => {
        try {
            const { enfermeiro } = req.params

            //Preciso de um find com apenas o enfermeiro e os dias a partir de hoje

            const result = await Horario.find({
                enfermeiro: enfermeiro
            })

            const arr = result.map(e => {
                const today = new Date()

                if (moment(today).tz('America/Sao_Paulo').format('YYYY-MM-DD') <= moment(e.dia).tz('America/Sao_Paulo').format('YYYY-MM-DD')) {
                    return moment(e.dia).tz('America/Sao_Paulo').format('DD/MM/YYYY')
                }
            })

            const dias = [...new Set(arr)]

            return res.status(200).json({
                dias
            })

        } catch (error) {
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    searchHorarios: async (req, res) => {
        try {
            const { data, enfermeiro } = req.params

            const result = await Horario.find({
                enfermeiro: enfermeiro,
                dia: moment(data).format('YYYY-MM-DD'),
                agendado: { $ne: 'Agendado' }
            })

            const horarios = result.map(e => e.horario)

            return res.status(200).json({
                horarios
            })
        } catch (error) {
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    verificarAgendamento: async (req, res) => {
        try {

            const { data, horario, enfermeiro } = req.params


            const result = await Horario.findOne({
                enfermeiro,
                dia: moment(data).format('YYYY-MM-DD'),
                horario
            })

            if (result?.agendado == 'Agendado') {
                return res.status(500).json({
                    msg: 'Horario já agendado'
                })
            }

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

    agendar: async (req, res) => {
        try {

            const { id, responsavel, data, horario, canal } = req.body

            const dataAjustada = ajustarData(data)

            const dataEHora = `${dataAjustada} ${horario}`

            await Horario.findOneAndUpdate({
                enfermeiro: responsavel,
                dia: dataAjustada,
                horario: horario
            }, {
                agendado: 'Agendado',
                nome: id
            })

            const updateRn = await Rn.findByIdAndUpdate({
                _id: id
            }, {
                responsavel: responsavel,
                agendado: 'Agendado',
                dataEntrevista: dataEHora
            })

            if (!updateRn) {

                await axios.put(`${process.env.API_TELE}/agendar`, {
                    id,
                    dataEHora,
                    responsavel,
                    quemAgendou: req.user,
                    canal
                }, {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${req.cookies['token']}`
                    }
                })

            } else {
                console.log('tem rn');
            }

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
    fecharDia: async (req, res) => {
        try {

            const { data, responsavel, motivo } = req.body

            await Horario.updateMany({
                $and: [
                    {
                        dia: data
                    }, {
                        enfermeiro: responsavel
                    }
                ]
            }, {
                agendado: 'Agendado',
                nome: 'Fechado'
            })

            await CloseSchedule.create({
                analista: responsavel,
                data: data,
                fechadoPor: req.user,
                motivo: motivo
            })

            await Log.create({
                nome: req.user,
                acao: `Fechou o dia ${data} do analista ${responsavel}`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
            })

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

    getAgendasFechadas: async (req, res) => {
        try {

            const today = moment().format('YYYY-MM-DD')

            const result = (await CloseSchedule.find({}).lean()).filter(e => {
                return e.data >= today
            })

            return res.status(200).json(
                result
            )
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    fecharHorarios: async (req, res) => {
        try {

            const { responsavel, data, horarios } = req.body


            let horariosFiltrados = horarios.filter(e => {
                return e != null
            })

            const result = await Promise.all(horariosFiltrados.map(async e => {
                return await Horario.findOneAndUpdate({
                    $and: [
                        {
                            dia: moment(data).format('YYYY-MM-DD')
                        }, {
                            enfermeiro: responsavel
                        }, {
                            horario: e
                        }, {
                            nome: { $ne: 'Fechado' }
                        }
                    ]
                }, {
                    agendado: 'Agendado',
                    nome: 'Fechado'
                })
            }))

            await Log.create({
                nome: req.user,
                acao: `Fechou os horarios ${horarios} do dia ${data} do analista ${responsavel}`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
            })


            return res.status(200).json({
                msg: 'oii'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    reabrirHorarios: async (req, res) => {
        try {

            const { horarios, data, responsavel } = req.body

            let horariosFiltrados = horarios.filter(e => {
                return e != null
            })

            const result = await Promise.all(horariosFiltrados.map(async e => {
                return await Horario.findOneAndUpdate({
                    $and: [
                        {
                            dia: moment(data).format('YYYY-MM-DD')
                        }, {
                            enfermeiro: responsavel
                        }, {
                            horario: e
                        }
                    ]
                }, {
                    agendado: 'Reaberto',
                    nome: '',
                    quemReabriu: req.user
                })
            }))

            await Log.create({
                nome: req.user,
                acao: `Reabriu os horarios ${horarios} do dia ${data} do analista ${responsavel}`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
            })


            return res.status(200).json({
                result
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },
    buscarHorariosNaoDisponiveis: async (req, res) => {
        try {

            const { responsavel, data } = req.params

            const result = await Horario.find({
                $and: [
                    {
                        enfermeiro: responsavel
                    }, {
                        dia: moment(data).format('YYYY-MM-DD')
                    }
                ]
            })

            const horariosObj = result.filter(e => {
                return e.agendado == 'Agendado'
            })
            const horarios = horariosObj.map(e => e.horario)

            return res.status(200).json({
                horarios
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },
    buscarHorarioDisponiveis: async (req, res) => {
        try {


            let horarios = await Horario.find({  //Buscando horarios filtrados
                $or: [
                    { agendado: 'Reaberto' },
                    { agendado: undefined }
                ]
            })

            const today = new Date()

            horarios = horarios.filter(e => {
                return moment(today).tz('America/Sao_Paulo').format('YYYY-MM-DD') <= moment(e.dia).tz('America/Sao_Paulo').format('YYYY-MM-DD') === true
            })

            let obj = {}

            horarios.forEach((e) => {  //Agrupando horarios por data
                const dateKey = moment(e.dia).format('DD/MM/YYYY');
                if (!obj.hasOwnProperty(dateKey)) {
                    obj[dateKey] = [];
                }
                obj[dateKey].push(e.horario);
            });

            Object.keys(obj).forEach((e) => {   //Removendo duplicatas e ordenando
                obj[e] = [...new Set(obj[e])].filter((el) => el !== undefined).sort();
            });

            Object.keys(obj).forEach((e) => {   //Filtrando horarios de acordo com a data de hj
                if (e === today) {
                    obj[e] = obj[e].filter((el) => {
                        const date1 = moment(`${today} ${el}`, 'YYYY-MM-DD HH:mm').tz('America/Sao_Paulo');
                        return date1.isAfter(moment(), 'minute');
                    });
                }
            });

            const analistasDisponiveis = {};

            // Itere sobre o array de horários e organize-os no objeto
            horarios.forEach((horario) => {
                const data = moment(horario.dia).format('DD/MM/YYYY');
                const horarioObj = {
                    horarios: [horario.horario],
                    analista: horario.enfermeiro // Inicialmente, adicione o enfermeiro atual
                };

                if (!analistasDisponiveis[data]) {
                    analistasDisponiveis[data] = [];
                }

                // Verifique se já existe um horário com a mesma data, e se sim, adicione o analista atual
                const index = analistasDisponiveis[data].findIndex((item) => item.analista === horario.enfermeiro);
                if (index !== -1) {
                    analistasDisponiveis[data][index].horarios.push(horario.horario);
                } else {
                    analistasDisponiveis[data].push(horarioObj);
                }
            });

            return res.status(200).json({
                obj,
                analistasDisponiveis
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },
    abrirNovoHorario: async (req, res) => {
        try {

            const { responsavel, dia, horario } = req.body

            const find = await Horario.findOne({
                enfermeiro: responsavel,
                dia,
                horario
            })

            if (!find) {
                const create = await Horario.create({
                    enfermeiro: responsavel,
                    dia,
                    horario
                })
                return res.status(200).json({
                    create
                })
            }

            await Log.create({
                nome: req.user,
                acao: `Abriu o horario ${horario} do dia ${dia} do analista ${responsavel}`,
                data: moment().format('DD/MM/YYYY HH:mm:ss')
            })

            return res.status(500).json({
                msg: 'Esse horário já existe'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    diasDisponiveis: async (req, res) => {
        try {
            const result = await Horario.find()

            const arr = result.map(e => {
                const today = new Date()

                if (moment(today).tz('America/Sao_Paulo').format('YYYY-MM-DD') <= moment(e.dia).tz('America/Sao_Paulo').format('YYYY-MM-DD')) {
                    return moment(e.dia).tz('America/Sao_Paulo').format('DD/MM/YYYY')
                }
            })

            const dias = [...new Set(arr)]

            return res.status(200).json(dias)
        } catch (error) {
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    buscarHorariosDisponiveis: async (req, res) => {
        try {
            const { data } = req.params

            const result = await Horario.find({
                dia: data,
                agendado: { $ne: 'Agendado' }
            })

            let arr = []

            result.forEach(e => {
                if (e.dia != moment().format('YYYY-MM-DD')) {
                    arr.push(e.horario)
                }
                if (e.horario >= moment().format('HH:mm:ss')) {
                    arr.push(e.horario)
                }
            })

            const uniqueArr = [...new Set(arr)]

            uniqueArr.sort()

            return res.json(uniqueArr)
        } catch (error) {
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },
    buscarAnalistasDisponiveis: async (req, res) => {
        try {
            const { data, horario } = req.params

            const result = await Horario.find({
                horario,
                dia: data,
                agendado: { $ne: 'Agendado' }
            })

            const arr = result.map(e => e.enfermeiro)

            return res.json(arr)
        } catch (error) {
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    verificarReaberto: async (req, res) => {
        try {

            const { enfermeiro, dia, horario } = req.query

            const result = await Horario.findOne({
                enfermeiro,
                dia,
                horario
            })

            if (result?.quemReabriu) {
                console.log('reaberto');
                return res.json({
                    quemReabriu: result.quemReabriu
                })
            }

            return res.json({
                quemReabriu: false
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    createNextCloseSchedule: async (req, res) => {
        try {
            const { analista, data } = req.body
            const result = await NextCloseSchedule.findOne({ analista, data })
            if (result) {
                return res.status(500).json({ msg: 'Data já cadastrada' })
            }
            await NextCloseSchedule.create({ analista, data })
            return res.status(200).json({ msg: 'Data fechada com sucesso' })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ msg: 'Internal Server Error', error })
        }
    },

    deleteNextCloseSchedule: async (req, res) => {
        try {
            const { id } = req.params
            await NextCloseSchedule.findByIdAndDelete(id)
            return res.status(200).json({ msg: 'Data deletada com sucesso' })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ msg: 'Internal Server Error', error })
        }
    },

    getCloseSchedule: async (req, res) => {
        try {
            const result = await NextCloseSchedule.find({
                data: { $gte: moment().subtract(1, 'days').format('YYYY-MM-DD') }
            }).sort({ data: 1 })
            return res.status(200).json(result)
        } catch (error) {
            console.log(error);
            return res.status(500).json({ msg: 'Internal Server Error', error })
        }
    },
}

function ajustarData(data) {
    const arr = data.split('/')
    return `${arr[2]}-${arr[1]}-${arr[0]}`
}