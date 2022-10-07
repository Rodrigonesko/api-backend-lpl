const mongoose = require('mongoose')
const Horario = mongoose.model('Horario')
const User = mongoose.model('User')
moment = require('moment')

module.exports = {
    gerar: async (req, res) => {
        try {
            
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

            const data = moment(new Date()).format('YYYY-MM-DD')

            const find = await Horario.find({
                dia: data
            })

            if(find){
                return res.status(500).json({
                    msg: 'Ja foi gerado horario para este dia!'
                })
            }

            const users = await User.find({
                enfermeiro: 'true'
            })

            users.forEach(e=>{
                console.log(e);
            })

            return res.status(200).json({
                msg: 'deu certo!'
            })


        } catch (error) {
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    }
}