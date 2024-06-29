const PropostaEntrevista = require('../models/TeleEntrevista/PropostaEntrevista')

class MigrarEnfermeirosParaResponsavel {
    async execute() {
        const propostas = await PropostaEntrevista.find({
            enfermeiro: { $exists: true }
        });

        const promisse = propostas.map(async (proposta) => {
            await PropostaEntrevista.updateOne({ _id: proposta._id }, {
                responsavel: proposta.enfermeiro
            });
        });

        await Promise.all(promisse);

        console.log(propostas);
    }
}

module.exports = new MigrarEnfermeirosParaResponsavel();