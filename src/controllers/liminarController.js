const mongoose = require('mongoose')
const Liminar = mongoose.model('Liminar')
const moment = require('moment')

module.exports = {
    upload: async (req, res) => {
        try {

            const { result } = req.body

            const liminares = await Liminar.find({
                situacao: 'andamento'
            })

            let quantidade = 0


            for (const item of result) {
                const analista = 'A definir'
                const agente = item.NomeAgente
                const idLiminar = item.IdWorkFlow
                const mo = item.CodIdentificacao
                const beneficiario = item.NomeIdentificacao
                const situacao = 'andamento'
                let dataVigencia = item.DtHrFimPrevisao.split(' ')
                let diaSplit = dataVigencia[0].split('/')
                dataVigencia = `${diaSplit[2]}-${diaSplit[1]}-${diaSplit[0]} ${dataVigencia[1]}`


                if (agente == 'Claudia Rodio Padilha Rieth') {

                    const resultado = {
                        analista,
                        idLiminar,
                        mo,
                        beneficiario,
                        dataVigencia,
                        situacao
                    }

                    let flag = 0

                    liminares.forEach(e => {
                        if (e.idLiminar == idLiminar) {
                            flag++
                        }
                    })

                    if (flag === 0) {
                        const insert = await Liminar.create(resultado)
                        quantidade++
                    }

                }

            }

            return res.status(200).json({
                message: `Foram adicionadas ${quantidade} novas Liminares`
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },
    show: async (req, res) => {
        try {
            const liminares = await Liminar.find()

            return res.status(200).json({
                liminares
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    }
}