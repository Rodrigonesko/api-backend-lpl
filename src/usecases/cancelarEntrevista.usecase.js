const DadosEntrevista = require('../models/TeleEntrevista/DadosEntrevista');
const PropostaEntrevista = require('../models/TeleEntrevista/PropostaEntrevista');

class CancelarEntrevistaUsecase {
    async execute(id, motivo, responsavel) {
        try {
            await PropostaEntrevista.findOneAndUpdate({
                _id: id
            }, {
                status: 'Cancelado',
                motivoCancelamento: motivo,
                enfermeiro: responsavel,
                newStatus: 'Cancelado'
            })

            return await DadosEntrevista.create({
                idProposta: id,
                cancelado: true,
                divergencia: motivo,
                houveDivergencia: 'Não'
            })

        } catch (error) {
            console.error('Erro ao cancelar entrevista:', error);
            throw new Error('Erro ao cancelar entrevista:', error);
        }
    }
}

module.exports = new CancelarEntrevistaUsecase();