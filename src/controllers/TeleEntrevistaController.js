mongoose = require('mongoose')
const Pergunta = mongoose.model('Pergunta')
const Propostas = mongoose.model('PropostaEntrevista')

module.exports = {
    mostrarPerguntas: async (req, res) => {
        try {

            const perguntas = await Pergunta.find()

            return res.status(200).json({
                perguntas
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    mostrarPessoaEntrevista: async (req, res) => {
        try {

            const { id } = req.params

            const pessoa = await Propostas.findById({
                _id: id
            })

            return res.status(200).json({
                pessoa
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    },

    enviarDadosFormulario: async (req, res) => {
        try {

            const { respostas, subRespostas, pessoa, simOuNao } = req.body

            // let subRespostasArr = Object.keys(subRespostas).map(key => {
            //     return [key, subRespostas[key]]
            // })

            // console.log(subRespostasArr);

            console.log(simOuNao);

            let respostasConc = {

            }

            console.log(respostas, subRespostas);

            Object.keys(simOuNao).forEach(key => {
                respostasConc[`${key}`] += `\n ${simOuNao[key]}`
            })


            Object.keys(subRespostas).forEach(key => {
                let split = key.split('-')

                respostasConc[`${split[0]}`] += ` \n ${split[1]} ${subRespostas[key]}`

            })

            Object.keys(respostas).forEach(key => {
                respostasConc[`${key}`] += `\n Observações: ${respostas[key]}`
            })

            console.log(respostasConc);

            return res.status(200).json({
                msg: 'oi'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error'
            })
        }
    }

}