const User = require('../models/User/User')

module.exports = {

    newToDo: async (req, res) => {
        try {

            const { _id } = req.body
            //Crie uma solicitação

            const body = req.body

            const find = await User.findOne({
                $or: [
                    { nomeCompleto: body.colaborador },
                    { name: body.colaborador }
                ]
            })
            const criarRequisicao = [
                {
                    nome: body.nome,
                    dataConclusao: body.dataConclusao,
                    tarefa: body.tarefa,
                    tipoCriacao: body.tipoCriacao,
                },
            ]

            return res.json({
                msg: 'OK'
            })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    }
}
