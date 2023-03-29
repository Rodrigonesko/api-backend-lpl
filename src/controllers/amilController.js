const Amil = require('../models/Amil/Amil')
const Pedido = require('../models/Rsd/Pedido')

const fs = require('fs')
const multer = require('multer')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads/rsd/agds/'
        if (!fs.existsSync(dir)) {
            //Efetua a criação do diretório
            fs.mkdir(dir, (err) => {
                if (err) {
                    console.log("Deu ruim...");
                    return
                }
                console.log("Diretório criado!")
            });
        }

        cb(null, dir)
    },
    filename: (req, file, cb) => {
        cb(null, `amil.csv`)
    }
})

const uploadAgd = multer({ storage }).single('file')

module.exports = {

    removeAll: async (req, res) => {
        try {

            const remove = await Amil.remove({})

            return res.status(200).json(remove)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    upload: async (req, res) => {
        try {

            uploadAgd(req, res, async (err) => {

                let file = fs.readFileSync(req.file.path, { encoding: 'latin1' })

                console.log(req.file.size);

                let linhas = file.split('\n')
                let arr = linhas.map(elem => {
                    return elem.split(';')
                })

                for (const item of arr) {

                    let reembolso = item[0]

                    const obj = {
                        reembolso: item[0],
                        situacao: item[1],
                        aguardandoDoc: item[2],
                        dataPedido: item[3],
                        dataPrevistaPagamento: item[4],
                        dataPagamento: item[5],
                        numeroTitulo: item[6],
                        tipoTitulo: item[7],
                        tipoCobranca: item[8],
                        empresaEmitente: item[9],
                        filial: item[10],
                        nomeFavorecido: item[11],
                        cpfFavorecido: item[12],
                        beneficiario: item[13],
                        valorApresentado: item[14],
                        valorReembolsado: item[15],
                        tipoEnvelope: item[16],
                        numeroEnvelope: item[17],
                        modalidade: item[18],
                        origem: item[19],
                        protocolo: item[20],
                        grupoEncaminhamento: item[21],
                        situacaoEncaminhamento: item[22],
                        tipoComprovante: item[23],
                        numeroReciboNota: item[24],
                        linkNota: item[25],
                        tipoContrato: item[26]
                    };

                    await Amil.create(obj)

                    // await Amil.findOneAndUpdate({
                    //     reembolso
                    // }, obj, {
                    //     upsert: true
                    // })
                }
            })

            return res.json({ msg: 'oii' })

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    },

    agd: async (req, res) => {
        try {

            const pedidos = await Pedido.find({
                $or: [
                    { statusGerencial: 'Aguardando Comprovante' },
                    { statusGerencial: 'Aguardando Retorno Contato' }
                ]
            })

            const consultas = pedidos.map(async (pedido) => {
                const consulta = await Amil.findOne({
                    reembolso: pedido.numero
                })
                const obj = pedido.toObject()
                obj.situacao = consulta?.situacao
                return obj
            })

            let arrAux = await Promise.all(consultas)

            console.log(arrAux.length);

            arrAux = arrAux.filter(e => {
                return (
                    e.situacao == 'Confirmação de pagamento' ||
                    e.situacao == 'Devolução de pedido' ||
                    e.situacao == 'Indeferido' ||
                    e.situacao == 'Interface financeiro' ||
                    e.situacao == 'Liberada' ||
                    e.situacao == 'Pagamento Não Efetuado AF' ||
                    e.situacao == 'Pedido Cancelado' ||
                    e.situacao == undefined
                )
            }).map(e => {
                if (
                    e.situacao == 'Confirmação de pagamento' ||
                    e.situacao == 'Interface Financeiro' ||
                    e.situacao == 'Liberada'
                ) {
                    e.lplXamil = 'Pago pela Amil, Avaliar se Baixar como Comprovante Correto ou Pago sem Comprovante'
                }

                if (e.situacao == 'Devolução de pedido') {
                    e.lplXamil = 'Analisar o Status no SisAmil, esta como Devolução de Pedido'
                }

                if (e.situacao == 'Pagamento Não Efetuado AF') {
                    e.lplXamil = 'Analisar se não foi pago pela Amil'
                }

                if (e.situacao == 'Indeferido') {
                    e.lplXamil = 'Analisar se foi Indeferido pela Amil'
                }

                if (e.situacao == 'Pedido Cancelado') {
                    e.lplXamil = 'Cancelado, Baixar como "CANCELAMENTO - Comprovante não Recebido"'
                }

                if (!e.situacao) {
                    e.lplXamil = 'Não localizado no SisAmil pelo N° do pedido, verificar manual'
                }

                return e
            })

            return res.json(arrAux)

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error: "Internal server error."
            })
        }
    }

}