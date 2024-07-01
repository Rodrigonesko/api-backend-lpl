const DadosEntrevista = require('../models/TeleEntrevista/DadosEntrevista');
const Cids = require('../models/TeleEntrevista/Cid');
const moment = require('moment');

class MigrarCidsUsecase {
    async execute() {
        try {
            const dadosEntrevista = await DadosEntrevista.find({
                cids: { $exists: true },
                cidsAjustados: { $exists: false }
            }, {
                cids: 1,
                cidsAjustados: 1,
                createdAt: 1
            }).lean();

            // Inicializa o array para armazenar todos os códigos CIDs extraídos

            console.log(dadosEntrevista.length);

            for (const dados of dadosEntrevista) {
                const cids = dados.cids;
                const regex = /\b[A-Z]\d{2,3}(\.\d)?\b/g;
                const cidsEncontrados = cids.match(regex);
                if (!cidsEncontrados) continue;

                // Transforma cada busca de CID em uma promessa
                const promessasCids = cidsEncontrados.map(cid =>
                    Cids.findOne({ subCategoria: { $regex: cid } }).lean().then(cidEncontrado => {
                        if (!cidEncontrado) {
                            console.log('Cid não encontrado:', cid);
                            return null; // Retorna null para cids não encontrados
                        }
                        return {
                            codigo: cidEncontrado.subCategoria,
                            descricao: cidEncontrado.descricao,
                            ano: '0000'
                        };
                    })
                );

                // Espera todas as promessas serem resolvidas
                const todosCids = (await Promise.all(promessasCids)).filter(cid => cid !== null);

                await DadosEntrevista.updateOne({ _id: dados._id }, { cidsAjustados: todosCids });
                console.log(moment(dados.createdAt).format('DD/MM/YYYY'));
            }
        } catch (error) {
            console.error('Erro ao migrar cids:', error);
            throw new Error('Erro ao migrar cids:', error);
        }

    }
}

module.exports = new MigrarCidsUsecase();