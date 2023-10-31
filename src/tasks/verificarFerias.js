const moment = require('moment')
const User = require('../models/User/User')

async function verificarFerias() {

    const users = await User.find()

    const anoAtual = moment().year(); // Obtém o ano atual

    for (const user of users) {
        if (!user.dataAdmissao) {
            continue
        }
        const dataAdmissao = moment(user.dataAdmissao);
        const anoDeAdmissao = dataAdmissao.year(); // Obtém o ano de admissão do usuário

        const indexVenc = user.vencimentoFerias.length - 1
        const ultimoAnoVencimento = (user.vencimentoFerias[indexVenc]?.anoVencimento);

        const isMaiorSeisMeses = moment().year(anoAtual) - dataAdmissao.year(anoDeAdmissao) >= 15768000000

        let isProxVencimento = moment() - moment(dataAdmissao).year(ultimoAnoVencimento) >= 15768000000

        if (!ultimoAnoVencimento) {
            isProxVencimento = false
        }

        let anoVencimento = ultimoAnoVencimento + 1

        if (isMaiorSeisMeses && !ultimoAnoVencimento) {
            anoVencimento = dataAdmissao.add(1, 'year').year()
        }

        if (isMaiorSeisMeses && (isProxVencimento || !ultimoAnoVencimento)) {
            const obj = {
                tirouFerias: false,
                dataDesejada: '',
                dataDesejada2: '',
                anoVencimento
            }
            console.log(`entrou`, obj);
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