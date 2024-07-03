const { default: mongoose } = require('mongoose');
const DadosEntrevista = require('../models/TeleEntrevista/DadosEntrevista');
const PropostaEntrevista = require('../models/TeleEntrevista/PropostaEntrevista');

class MigrarPropostaIdsUsecase {
    async execute() {
        try {

            const dadosEntrevista = await DadosEntrevista.find({
                proposta: { $exists: false }
            })
 
            console.log('DadosEntrevista:', dadosEntrevista.length);

            for (const entrevista of dadosEntrevista) {
                const proposta = await PropostaEntrevista.findOne({ _id: entrevista.idProposta });
                if (!proposta) {
                    console.log('Proposta não encontrada para:', entrevista.nome);
                    continue;
                }
                await DadosEntrevista.updateOne(
                    { _id: entrevista._id },
                    {
                        tipoFormulario: proposta.formulario,
                        cpf: proposta.cpf,
                        nome: proposta.nome,
                        proposta: proposta.proposta,
                        dataNascimento: proposta.dataNascimento,
                        tipoContrato: proposta.tipoContrato,
                        sexo: proposta.sexo,
                        idade: proposta.idade,
                        vigencia: proposta.vigencia,
                        dataRecebimento: proposta.dataRecebimento,
                        filial: proposta.filial,
                        administradora: proposta.administradora,
                    }
                );
            }

            // const dadosEntrevista = await DadosEntrevista.find({
            //     idProposta: { $exists: true }
            // }, {
            //     idProposta: 1,
            //     patologias: 1,
            //     nome: 1,
            //     proposta: 1
            // });
            // console.log('DadosEntrevista:', dadosEntrevista.length);
            // const updates = dadosEntrevista.map((entrevista, index) => {
            //     console.log(index);
            //     if (!entrevista.idProposta) {
            //         const proposta = PropostaEntrevista.findOne({ nome: entrevista.nome, proposta: entrevista.nome });
            //         if (!proposta) {
            //             console.log('Proposta não encontrada para:', entrevista.nome);
            //             return;
            //         }
            //         return DadosEntrevista.updateOne(
            //             { _id: entrevista._id },
            //             {
            //                 idProposta: mongoose.Types.ObjectId(proposta._id),
            //                 motivoBeneficiario: entrevista.patologias
            //             }
            //         );
            //     }
            //     return DadosEntrevista.updateOne(
            //         { _id: entrevista._id },
            //         {
            //             idProposta: mongoose.Types.ObjectId(entrevista.idProposta),
            //             motivoBeneficiario: entrevista.patologias
            //         }
            //     );
            // });

            // await Promise.all(updates);

            console.log('Atualização concluída para', dadosEntrevista.length, 'documentos.');
        } catch (error) {
            console.error('Erro ao migrar proposta ids:', error);
            throw new Error('Erro ao migrar proposta ids:', error);
        }

    }
}

module.exports = new MigrarPropostaIdsUsecase();
