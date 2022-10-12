const mongoose = require('mongoose')
const Horario = mongoose.model('Horario')
const User = mongoose.model('User')
const PropostaEntrevista = mongoose.model('PropostaEntrevista')
const moment = require('moment')
const timezone = require('moment-timezone')


module.exports = {
    gerar: async (req, res) => {
        try {

            const data = req.body.dataGerar

            console.log(data);

            const horarios = [
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
                '19:20'
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

                        const insert = await Horario.create({
                            enfermeiro: item.name,
                            horario: horario,
                            dia: data
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

            console.log(enfermeiro);

            const result = await Horario.find({
                enfermeiro: enfermeiro
            })

            const arr = result.map(e => {

                const today = new Date()

                if (moment(today).tz('America/Sao_Paulo').format('YYYY-MM-DD') <= moment(e.dia).add(1, 'days').tz('America/Sao_Paulo').format('YYYY-MM-DD')) {
                    //console.log();
                    //return moment(e.dia).add(1, 'days').format('DD/MM/YYYY')
                    console.log(moment(e.dia).tz('America/Sao_Paulo').format('YYYY-MM-DD'));
                    return moment(e.dia).add(1, 'days').tz('America/Sao_Paulo').format('DD/MM/YYYY')
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
                dia: data
            })

            const horariosObj = result.filter(e => {
                return e.agendado == undefined
            })

            const horarios = horariosObj.map(e => e.horario)

            console.log(horarios);

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

            const { beneficiario, enfermeiro, data, horario } = req.body

            console.log(beneficiario, enfermeiro, data, horario);

            const dataAjustada = ajustarData(data)

            const dataEHora = `${dataAjustada} ${horario}`

            const update = await Horario.findOneAndUpdate({
                enfermeiro: enfermeiro,
                dia: dataAjustada,
                horario: horario
            }, {
                agendado: 'Agendado',
                nome: beneficiario
            })

            const update2 = await PropostaEntrevista.findOneAndUpdate({
                nome: beneficiario
            }, {
                dataEntrevista: dataEHora,
                agendado: 'agendado',
                enfermeiro:  enfermeiro
            })

            return res.status(200).json({
                msg: update,
                msg2: update2
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

}

function ajustarData(data) {
    const arr = data.split('/')

    return `${arr[2]}-${arr[1]}-${arr[0]}`
}