const sql = require('mssql')
const { getAreaEmpresa, getTipoServico, getStatus, getAreaTipoServico, getAreaUsuario, getTipoInvestigado, getTipoReembolso, getUsuario } = require('../services/sindicancia.service')

const SERVER = process.env.MSSQL_SERVER
const DATABASE = process.env.MSSQL_DATABASE
const USERNAME = process.env.MSSQL_USER
const PASSWORD = process.env.MSSQL_PASSWORD

// const objDemanda = {
//     id: 3202,
//     codigo: '202400108',
//     nome: 'LEONARDO COHEN ZAIDE SCHLANGER - ANALISE PF',
//     cpf_cnpj: '161.014.857-65',
//     cep: '22421000',
//     uf: 'RJ',
//     cidade: 'Rio de Janeiro',
//     bairro: 'Ipanema',
//     logradouro: 'Rua Barão de Jaguaripe',
//     numero: '29 - COMPL 101',
//     telefone: '(21) 97698-9004',
//     especialidade: 'DIVERSAS',
//     tipo_servico_id: 23, // tabela TipoServico
//     observacao: 'Análise de beneficiário devido ao alto grau de custo médico',
//     status_id: 2, // tabela Status
//     data_atualizacao: 2024-02-16T16:50:42.337Z,
//     empresa_id: 3, // tabela Empresa
//     tipo_investigado_id: 7, // tabela TipoInvestigado
//     data_demanda: 2024-02-16T16:50:35.253Z,
//     escolha_anexo: null,
//     usuario_criador_id: 68, // tabela Usuario
//     usuario_distribuicao_id: null, // tabela Usuario
//     id_area_empresa: 1 // tabela AreaEmpresa
//   }

module.exports = {
    getDemandas: async (req, res) => {
        try {

            let { limit, page, servico, analista, data } = req.query

            if (limit === undefined) limit = 10
            if (page === undefined) page = 1

            const connStr = `Server=${SERVER};Database=${DATABASE};User Id=${USERNAME};Password=${PASSWORD};TrustServerCertificate=true`
            await sql.connect(connStr)
            const skip = (page - 1) * limit
            const result = await new sql.query(`
            SELECT demanda.id, demanda.codigo, demanda.nome, demanda.cpf_cnpj, demanda.cep, demanda.uf, demanda.cidade, demanda.bairro, demanda.logradouro, demanda.numero, demanda.telefone, demanda.especialidade, demanda.tipo_servico_id, demanda.observacao, demanda.status_id, demanda.data_atualizacao, demanda.empresa_id, demanda.tipo_investigado_id, demanda.data_demanda, demanda.escolha_anexo, demanda.usuario_criador_id, demanda.usuario_distribuicao_id, demanda.id_area_empresa, TipoServico.nome AS tipo_servico_nome
            FROM Demanda
            RIGHT JOIN TipoServico ON Demanda.tipo_servico_id = TipoServico.id
            ORDER BY id DESC
            OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY
            `)


            result.recordset.forEach(demanda => {
                console.log(demanda);
            })

            await sql.close()

            return res.json({
                result: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    }
}