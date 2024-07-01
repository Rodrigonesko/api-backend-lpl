const { default: mongoose } = require('mongoose');
const DadosEntrevista = require('../models/TeleEntrevista/DadosEntrevista');

class MigrarPropostaIdsUsecase {
    async execute() {
        try {
            const dadosEntrevista = await DadosEntrevista.find({
                idProposta: { $exists: true }
            });
            console.log('DadosEntrevista:', dadosEntrevista.length);
            const updates = dadosEntrevista.map((entrevista, index) => {
                console.log(index);
                return DadosEntrevista.updateOne(
                    { _id: entrevista._id },
                    {
                        idProposta: mongoose.Types.ObjectId(entrevista.idProposta),
                        motivoBeneficiario: entrevista.patologias
                    }
                );
            });

            await Promise.all(updates);

            console.log('Atualização concluída para', dadosEntrevista.length, 'documentos.');
        } catch (error) {
            console.error('Erro ao migrar proposta ids:', error);
            throw new Error('Erro ao migrar proposta ids:', error);
        }

    }
}

module.exports = new MigrarPropostaIdsUsecase();
