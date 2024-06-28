const DadosEntrevista = require('../models/TeleEntrevista/DadosEntrevista');
const Cids = require('../models/TeleEntrevista/Cid');

class MigrarCidsUsecase {
    async execute() {
        const dadosEntrevista = await DadosEntrevista.find({
            cids: { $exists: true }
        }, {
            cids: 1,
            cidsAjustados: 1
        }).limit(100).sort({ createdAt: -1 });

        // Inicializa o array para armazenar todos os códigos CIDs extraídos

        console.log(dadosEntrevista);

        // for (const dados of dadosEntrevista) {
        //     const cids = dados.cids;
        //     const regex = /\b[A-Z]\d{2,3}(\.\d)?\b/g;
        //     const cidsEncontrados = cids.match(regex);
        //     if (!cidsEncontrados) continue;
        //     const todosCids = [];
        //     for (const cid of cidsEncontrados) {
        //         const cidEncontrado = await Cids.findOne({ subCategoria: { $regex: cid } }).lean()
        //         if (!cidEncontrado) {
        //             console.log('Cid não encontrado:', cid);
        //             continue;
        //         }
        //         todosCids.push({
        //             codigo: cidEncontrado.subCategoria,
        //             descricao: cidEncontrado.descricao,
        //             ano: '0000'
        //         });
        //     }
        //     await DadosEntrevista.updateOne({ _id: dados._id }, { cidsAjustados: todosCids });
        //     console.log(todosCids.length, cidsEncontrados.length);
        // }

        // dadosEntrevista.forEach(async entrevista => {
        //     // Define a expressão regular para encontrar os códigos CIDs
        //     const regex = /\b[A-Z]\d{2,3}(\.\d)?\b/g;
        //     // Extrai os códigos CIDs usando a expressão regular
        //     const cidsEncontrados = entrevista.cids.match(regex);

        //     // Adiciona os códigos CIDs encontrados ao array global, se existirem
        //     if (cidsEncontrados) {
        //         todosCids = [...todosCids, ...cidsEncontrados];
        //     }
        // });
    }
}

module.exports = new MigrarCidsUsecase();