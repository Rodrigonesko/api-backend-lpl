const DadosEntrevista = require('../models/TeleEntrevista/DadosEntrevista');
const PropostaEntrevista = require('../models/TeleEntrevista/PropostaEntrevista');

class CancelarEntrevistaUsecase {
    async execute(id, motivo, responsavel) {
        try {

            const dadosEntrevista = await DadosEntrevista.create({
                idProposta: id,
                cancelado: true,
                divergencia: motivo,
                houveDivergencia: 'Não'
            })

            console.log(id);

           const proposta = await PropostaEntrevista.findOneAndUpdate({
                _id: id
            }, {
                status: 'Cancelado',
                motivoCancelamento: motivo,
                enfermeiro: responsavel,
                newStatus: 'Cancelado',
                dadosEntrevista: dadosEntrevista._id
            })

            console.log('Entrevista cancelada com sucesso:', proposta);

            return dadosEntrevista
        } catch (error) {
            console.error('Erro ao cancelar entrevista:', error);
            throw new Error('Erro ao cancelar entrevista:', error);
        }
    }
}

module.exports = new CancelarEntrevistaUsecase();