const DadosEntrevista = require('../models/TeleEntrevista/DadosEntrevista');
const PropostaEntrevista = require('../models/TeleEntrevista/PropostaEntrevista');

class VoltarEntrevistaUsecase {
    constructor() { }

    async execute(id) {
        try {

            const dadosEntrevista = await DadosEntrevista.findOneAndUpdate({
                _id: id
            }, {
                retrocedido: true
            }, { new: true }).populate('idProposta')

            await PropostaEntrevista.findOneAndUpdate({
                proposta: dadosEntrevista.idProposta.proposta,
                nome: dadosEntrevista.idProposta.nome
            }, {
                status: '',
                newStatus: 'Agendar',
                retrocedido: 'Ret'
            })

            return dadosEntrevista

        } catch (error) {
            console.error('Erro ao voltar entrevista:', error);
            throw new Error('Erro ao voltar entrevista:', error);
        }
    }
}

module.exports = new VoltarEntrevistaUsecase();