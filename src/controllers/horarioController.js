const Horario = require('../models/TeleEntrevista/Horario')
const User = require('../models/User/User')
const Rn = require('../models/TeleEntrevista/Rn')
const moment = require('moment')
const timzezone = require('moment-timezone')
const { Axios, default: axios } = require('axios')

module.exports = {


    /**
*  Report das atividades em andamento.
*
* @route GET /controleAtividade/andamento
* @returns {object} Report das atividades em andamento.
* @throws {error} Erro.
*/

    gerar: async (req, res) => {
        try {

            const data = req.body.dataGerar

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
                '18:00',
                '18:20',
                '18:40',
                '19:00',
                '19:20',
                '19:40',
                '20:00',
                '20:20',
                '20:40',
                '21:00',
                '21:20',
            ]

            const find = await Horario.findOne({
                dia: data
            }).lean()

            if (find) {
                return res.status(500).json({
                    msg: 'Ja foi gerado horario para este dia!'
                })
            }

            const users = await User.find({
                enfermeiro: 'true'
            })

            for (const item of users) {

                const entrada1 = item.horarioEntrada1
                const saida1 = item.horarioSaida1
                const entrada2 = item.horarioEntrada2
                const saida2 = item.horarioSaida2

                for (const horario of horarios) {
                    if (entrada1 <= horario) {
                        if (saida1 <= horario && entrada2 >= horario) {
                            continue
                        }
                        if (saida2 <= horario) {
                            break
                        }

                        await Horario.create({
                            enfermeiro: item.name,
                            horario: horario,
                            dia: moment(data).format('YYYY-MM-DD')
                        })
                    }
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

            const result = await Horario.find({
                enfermeiro: enfermeiro
            })

            const arr = result.map(e => {

                const today = new Date()

                if (moment(today).tz('America/Sao_Paulo').format('YYYY-MM-DD') <= moment(e.dia).tz('America/Sao_Paulo').format('YYYY-MM-DD')) {
                    //console.log();
                    //return moment(e.dia).add(1, 'days').format('DD/MM/YYYY')
                    console.log(moment(e.dia).tz('America/Sao_Paulo').format('YYYY-MM-DD'));
                    return moment(e.dia).tz('America/Sao_Paulo').format('DD/MM/YYYY')
                }

            })

            const dias = arr.filter((el, i) => {
                return arr.indexOf(el) === i
            })

            return res.status(200).json({
                dias
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    searchHorarios: async (req, res) => {
        try {
            const { data, enfermeiro } = req.params

            console.log(data, enfermeiro);

            const result = await Horario.find({
                enfermeiro: enfermeiro,
                dia: moment(data).format('YYYY-MM-DD')
            })

            console.log(result);

            const horariosObj = result.filter(e => {
                return e.agendado != 'Agendado'
            })

            const horarios = horariosObj.map(e => e.horario)


            return res.status(200).json({
                horarios
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

            console.log(id, responsavel, data, horario);

            const dataAjustada = ajustarData(data)

            const dataEHora = `${dataAjustada} ${horario}`

            const find = await Horario.findOne({
                nome: id
            })

            if (find) {

                await Horario.findOneAndUpdate({
                    nome: id
                }, {
                    agendado: 'Reaberto',
                    nome: ''
                })
            }

            const update = await Horario.findOneAndUpdate({
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

                const updateTele = await axios.put(`${process.env.API_TELE}/agendar`, {
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

            const { data, responsavel } = req.body

            const update = await Horario.updateMany({
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

            console.log(update);

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
    fecharHorarios: async (req, res) => {
        try {

            const { responsavel, data, horarios } = req.body

            console.log(responsavel, horarios, data);

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

            console.log(result);

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

            console.log(horarios);

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

            console.log(analistasDisponiveis);

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

            console.log(responsavel, dia, horario);

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
                    //console.log();
                    //return moment(e.dia).add(1, 'days').format('DD/MM/YYYY')
                    console.log(moment(e.dia).tz('America/Sao_Paulo').format('YYYY-MM-DD'));
                    return moment(e.dia).tz('America/Sao_Paulo').format('DD/MM/YYYY')
                }

            })

            const dias = arr.filter((el, i) => {
                return arr.indexOf(el) === i
            })

            return res.status(200).json(dias)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    buscarHorariosDisponiveis: async (req, res) => {
        try {

            const { data } = req.params

            const result = await Horario.find({
                dia: data
            })

            let arr = []

            result.forEach(e => {
                if ((e.agendado !== 'Agendado')) {
                    if (e.dia != moment().format('YYYY-MM-DD')) {
                        arr.push(e.horario)
                    }
                    if (e.horario >= moment().format('HH:mm:ss')) {
                        arr.push(e.horario)
                    }
                }
            })

            const uniqueArr = [...new Set(arr)]

            uniqueArr.sort()

            return res.json(uniqueArr)

        } catch (error) {
            console.log(error);

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

            let arr = []

            result.forEach(e => {
                arr.push(e.enfermeiro)
            })

            return res.json(arr)

        } catch (error) {
            console.log(error);
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

            console.log(enfermeiro, dia, horario);

            if (result?.quemReabriu) {
                console.log('reaberto');
                return res.json({
                    quemReabriu: result.quemReabriu
                })
            }

            console.log('nao reaberto');

            return res.json({
                quemReabriu: false
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    }

}

function ajustarData(data) {
    const arr = data.split('/')

    return `${arr[2]}-${arr[1]}-${arr[0]}`
}
