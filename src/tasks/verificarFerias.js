const moment = require('moment')
const User = require('../models/User/User')

async function verificarFerias() {

    const users = await User.find()

    const anoAtual = moment().year(); // Obtém o ano atual

    for (const user of users) {
        const dataAdmissao = moment(user.dataAdmissao);
        const anoDeAdmissao = dataAdmissao.year(); // Obtém o ano de admissão do usuário

        const indexVenc = user.vencimentoFerias.length - 1
        const anoVencimento = (user.vencimentoFerias[indexVenc]?.anoVencimento);

        if (anoAtual - anoDeAdmissao >= 1 && anoVencimento < anoAtual) {
            const obj = {
                tirouFerias: false,
                dataDesejada: '',
                dataDesejada2: '',
                anoVencimento: anoAtual
            }

            await User.updateOne({
                _id: user._id
            }, {
                $push: {
                    vencimentoFerias: obj
                }
            })

        }
    }

}

module.exports = verificarFerias