const sql = require('mssql')
const Demanda = require('../models/Sindicancia/Demanda')
const { getAreaEmpresa, getTipoServico, getStatus, getUsuarioExecao, getDemandaById, getTipoIrregularidade } = require('../services/sindicancia.service')
const moment = require('moment')

const SERVER = process.env.MSSQL_SERVER
const DATABASE = process.env.MSSQL_DATABASE
const USERNAME = process.env.MSSQL_USER
const PASSWORD = process.env.MSSQL_PASSWORD

let connection;

async function ensureConnection() {
    if (!connection) {
        const connStr = `Server=${SERVER};Database=${DATABASE};User Id=${USERNAME};Password=${PASSWORD};TrustServerCertificate=true`
        connection = await sql.connect(connStr)
    }
}

module.exports = {
    getDemandas: async (req, res) => {
        try {

            let { limit, page, areaEmpresa, status, servico, analista, codigo, data } = req.query

            if (limit === undefined) limit = 10
            if (page === undefined) page = 1

            const dataInicio = '2023-12-31'
            if (!data) data = moment().format('YYYY-MM-DD')

            await ensureConnection()

            const skip = (page - 1) * limit

            let filter = '';
            if (areaEmpresa) filter += ` AND Demanda.id_area_empresa = ${areaEmpresa}`;
            if (status) filter += ` AND Demanda.status_id = ${status}`;
            if (servico) filter += ` AND Demanda.tipo_servico_id = ${servico}`;
            if (analista) filter += ` AND usuario_distribuicao_id = ${analista}`;
            if (data) filter += ` AND (CONVERT(date, Demanda.data_demanda) BETWEEN '${dataInicio}' AND '${data}' OR CONVERT(date, Pacote.data_finalizacao) BETWEEN '${dataInicio}' AND '${data}')`;
            if (codigo) filter += ` AND Demanda.codigo LIKE '%${codigo}%'`;

            let result = await new sql.query(`
            SELECT Demanda.*, TipoServico.nome AS tipo_servico_nome, Status.nome as status_nome, Empresa.razao_social as empresa_nome, Usuario.nome as usuario_criador_nome, UsuarioDistribuicao.nome as usuario_distribuicao_nome, AreaEmpresa.nome as area_empresa_nome, TipoInvestigado.nome as tipo_investigado_nome, Finalizacao.data as data_finalizacao, Finalizacao.justificativa as justificativa_finalizacao, Pacote.data_finalizacao as data_finalizacao_sistema, UsuarioExecutor.nome as usuario_executor_nome, UsuarioExecutor.id as usuario_executor_id, Complementacao.motivo as motivo, Complementacao.data as data_complementacao, Complementacao.complementacao as complementacao, Pacote.data_criacao as data_criacao_pacote
            FROM Demanda
            RIGHT JOIN TipoServico ON Demanda.tipo_servico_id = TipoServico.id
            RIGHT JOIN Status ON Demanda.status_id = Status.id
            RIGHT JOIN Empresa ON Demanda.empresa_id = Empresa.id
            RIGHT JOIN Usuario ON Demanda.usuario_criador_id = Usuario.id
            LEFT JOIN Usuario UsuarioDistribuicao ON Demanda.usuario_distribuicao_id = UsuarioDistribuicao.id
            RIGHT JOIN [LPLSeguros].[Admin].[AreaEmpresa] ON Demanda.id_area_empresa = AreaEmpresa.id
            RIGHT JOIN TipoInvestigado ON Demanda.tipo_investigado_id = TipoInvestigado.id
            LEFT JOIN Finalizacao ON Demanda.id = Finalizacao.id_demanda
            LEFT JOIN Pacote ON Demanda.id = Pacote.demanda_id
            LEFT JOIN Usuario UsuarioExecutor ON Pacote.usuario_id = UsuarioExecutor.id
            LEFT JOIN Complementacao ON Demanda.id = Complementacao.id_demanda
            WHERE 1=1 ${filter}
            ORDER BY id DESC
            OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY
            `)

            let idsUnicos = []

            result = result.recordset.filter(demanda => {
                if (idsUnicos.includes(demanda.id)) {
                    return false
                } else {
                    idsUnicos.push(demanda.id)
                    return true
                }
            })

            const count = await new sql.query(`
            SELECT COUNT(*) as count
            FROM Demanda
            RIGHT JOIN TipoServico ON Demanda.tipo_servico_id = TipoServico.id
            RIGHT JOIN Status ON Demanda.status_id = Status.id
            RIGHT JOIN Empresa ON Demanda.empresa_id = Empresa.id
            RIGHT JOIN Usuario ON Demanda.usuario_criador_id = Usuario.id
            LEFT JOIN Usuario UsuarioDistribuicao ON Demanda.usuario_distribuicao_id = UsuarioDistribuicao.id
            RIGHT JOIN [LPLSeguros].[Admin].[AreaEmpresa] ON Demanda.id_area_empresa = AreaEmpresa.id
            RIGHT JOIN TipoInvestigado ON Demanda.tipo_investigado_id = TipoInvestigado.id
            LEFT JOIN Finalizacao ON Demanda.id = Finalizacao.id_demanda
            LEFT JOIN Pacote ON Demanda.id = Pacote.demanda_id
            LEFT JOIN Usuario UsuarioExecutor ON Pacote.usuario_id = UsuarioExecutor.id
            WHERE 1=1 ${filter}
            `)

            // await sql.close()
            return res.json({
                demandas: result,
                count: count.recordset[0].count
            })

        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getAreaEmpresa: async (req, res) => {
        try {
            const areas = await getAreaEmpresa()
            return res.json(areas)
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },
    getTipoServico: async (req, res) => {
        try {
            const tipos = await getTipoServico()
            return res.json(tipos)
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getStatus: async (req, res) => {
        try {
            const status = await getStatus()
            return res.json(status)
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getAnalistasExecucao: async (req, res) => {
        try {
            let analistas = await getUsuarioExecao()
            analistas = analistas.map(analista => {
                return {
                    id: analista.id,
                    nome: analista.nome,
                    email: analista.email
                }
            })
            return res.json(analistas)
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    createBeneficiario: async (req, res) => {
        try {

            const { id, beneficiario } = req.body

            await ensureConnection()

            const create = await sql.query(`INSERT INTO Beneficiario (id_demanda, nome) OUTPUT INSERTED.id VALUES (${id}, '${beneficiario}')`)

            if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar beneficiário' })

            const newId = create.recordset[0].id; // Aqui está o novo ID

            return res.json({
                msg: 'ok',
                id: newId // Retornando o novo ID na resposta
            })

        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    createPrestador: async (req, res) => {
        try {

            const { id, prestador } = req.body

            await ensureConnection()

            const create = await sql.query(`INSERT INTO Prestador (id_demanda, nome) OUTPUT INSERTED.id VALUES (${id}, '${prestador}')`)

            if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar prestador' })

            const newId = create.recordset[0].id; // Aqui está o novo ID

            return res.json({
                msg: 'ok',
                id: newId // Retornando o novo ID na resposta
            })

        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    deleteBeneficiario: async (req, res) => {
        try {

            const { id } = req.body

            await ensureConnection()

            const remove = await sql.query(`DELETE FROM Beneficiario WHERE id = ${id}`)

            if (remove.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao deletar beneficiário' })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    deletePrestador: async (req, res) => {
        try {

            const { id } = req.body

            await ensureConnection()

            console.log(id);

            const remove = await sql.query(`DELETE FROM Prestador WHERE id = ${id} `)

            if (remove.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao deletar prestador' })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);

            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getBeneficiarios: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const result = await new sql.query(`SELECT * FROM Beneficiario WHERE id_demanda = ${id}`)

            return res.json(result.recordset)

        } catch (error) {
            console.log(error);

            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getPrestadores: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const result = await new sql.query(`SELECT * FROM Prestador WHERE id_demanda = ${id}`)

            return res.json(result.recordset)

        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getDemandaById: async (req, res) => {
        try {
            const { id } = req.params

            const find = await Demanda.findById(id)

            const demanda = await getDemandaById(id)

            return res.json({
                demanda,
                dadosDemanda: find
            })

        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    relatorioDemanda: async (req, res) => {

        const { dataInicio, dataFim, status } = req.body

        await ensureConnection()

        const irregularidades = await new sql.query(`SELECT * FROM Irregularidade`)
        const tipoIrregularidade = await getTipoIrregularidade()

        tipoIrregularidade.sort((a, b) => a.nome.localeCompare(b.nome));

        tipoIrregularidade.unshift({ nome: 'Sem Irregularidade', id: 0 })

        let filter = ''

        if (dataInicio && dataFim) filter += ` AND CONVERT(date, Demanda.data_demanda) BETWEEN '${dataInicio}' AND '${dataFim}'`
        if (status) filter += ` AND Demanda.status_id = ${status}`

        const result = await new sql.query(`
        SELECT demanda.id, demanda.codigo, demanda.nome, demanda.cpf_cnpj, demanda.cep, demanda.uf, demanda.cidade, demanda.bairro, demanda.logradouro, demanda.numero, demanda.telefone, demanda.especialidade, demanda.tipo_servico_id, demanda.observacao, demanda.status_id, demanda.data_atualizacao, demanda.empresa_id, demanda.tipo_investigado_id, demanda.data_demanda, demanda.escolha_anexo, demanda.usuario_criador_id, demanda.usuario_distribuicao_id, demanda.id_area_empresa, TipoServico.nome as tipo_servico_nome, Status.nome as status_nome, Empresa.razao_social as empresa_nome, Usuario.nome as usuario_criador_nome, UsuarioDistribuicao.nome as usuario_distribuicao_nome, AreaEmpresa.nome as area_empresa_nome, TipoInvestigado.nome as tipo_investigado_nome, Finalizacao.data as data_finalizacao, Finalizacao.justificativa as justificativa_finalizacao, Valor.valor as valor, Valor.periodo as periodo, Pacote.data_finalizacao as data_finalizacao_sistema, UsuarioExecutor.nome as usuario_executor_nome, Complementacao.motivo as motivo, Complementacao.data as data_complementacao, Complementacao.complementacao as complementacao, Agenda.observacao as observacoes, Pacote.data_criacao as data_criacao_pacote,
        (SELECT COUNT(*) FROM Beneficiario WHERE Beneficiario.id_demanda = demanda.id) as num_beneficiarios,
        (SELECT COUNT(*) FROM Prestador WHERE Prestador.id_demanda = demanda.id) as num_prestadores
        FROM Demanda
        RIGHT JOIN TipoServico ON Demanda.tipo_servico_id = TipoServico.id
        RIGHT JOIN Status ON Demanda.status_id = Status.id
        RIGHT JOIN Empresa ON Demanda.empresa_id = Empresa.id
        RIGHT JOIN Usuario ON Demanda.usuario_criador_id = Usuario.id
        LEFT JOIN Usuario UsuarioDistribuicao ON Demanda.usuario_distribuicao_id = UsuarioDistribuicao.id
        RIGHT JOIN [LPLSeguros].[Admin].[AreaEmpresa] ON Demanda.id_area_empresa = AreaEmpresa.id
        RIGHT JOIN TipoInvestigado ON Demanda.tipo_investigado_id = TipoInvestigado.id
        LEFT JOIN Finalizacao ON Demanda.id = Finalizacao.id_demanda
        LEFT JOIN Valor ON Demanda.id = Valor.id_demanda
        LEFT JOIN Pacote ON Demanda.id = Pacote.demanda_id
        LEFT JOIN Usuario UsuarioExecutor ON Pacote.usuario_id = UsuarioExecutor.id
        LEFT JOIN Complementacao ON Demanda.id = Complementacao.id_demanda
        LEFT JOIN Agenda ON Demanda.id = Agenda.id_demanda
        WHERE 1=1 ${filter}
        `)

        let demandas = result.recordset.map(demanda => {
            const irregularidadesDemanda = irregularidades.recordset.filter(irregularidade => irregularidade.id_demanda === demanda.id)
            let irregularidadesObj = {}
            tipoIrregularidade.forEach(tipo => {
                irregularidadesObj[tipo.nome] = irregularidadesDemanda.some(irregularidade => irregularidade.nome === tipo.nome) ? 1 : 0
            })
            irregularidadesObj = Object.entries(irregularidadesObj).map(([key, value]) => {
                return {
                    nome: key,
                    value
                }
            })
            return {
                ...demanda,
                irregularidadesObj
            }
        })

        let observacoesAgrupadas = {}

        demandas.forEach(demanda => {
            if (observacoesAgrupadas[demanda.id]) {
                observacoesAgrupadas[demanda.id].push(demanda.observacoes)
            } else {
                observacoesAgrupadas[demanda.id] = [demanda.observacoes]
            }
        })

        demandas = demandas.map(demanda => {
            return {
                ...demanda,
                observacoes: observacoesAgrupadas[demanda.id]
            }
        })

        let idsUnicos = []

        demandas = demandas.filter(demanda => {
            if (idsUnicos.includes(demanda.id)) {
                return false
            } else {
                idsUnicos.push(demanda.id)
                return true
            }
        })

        console.log(demandas);

        return res.json(demandas)
    },

    createTipoIrregularidade: async (req, res) => {
        try {

            const { irregularidade } = req.body

            await ensureConnection()

            const create = await sql.query(`INSERT INTO TipoIrregularidade (nome) OUTPUT INSERTED.id VALUES ('${irregularidade}')`)

            if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar irregularidade' })

            const newId = create.recordset[0].id; // Aqui está o novo ID

            return res.json({
                msg: 'ok',
                id: newId // Retornando o novo ID na resposta
            })

        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getTipoIrregularidade: async (req, res) => {
        try {

            await ensureConnection()

            const irregularidades = await getTipoIrregularidade()

            return res.json(irregularidades)

        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    deleteTipoIrregularidade: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const remove = await sql.query(`DELETE FROM TipoIrregularidade WHERE id = ${id}`)

            if (remove.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao deletar irregularidade' })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    createIrregularidade: async (req, res) => {

        try {
            const { id_demanda, nome } = req.body

            await ensureConnection()

            const find = await new sql.query(`SELECT * FROM Irregularidade WHERE id_demanda = ${id_demanda} AND nome = '${nome}'`)

            if (find.recordset.length !== 0) return res.json({ msg: 'Irregularidade ja existe dentro da demanda' })

            const create = await sql.query(`INSERT INTO Irregularidade (id_demanda, nome) OUTPUT INSERTED.id VALUES (${id_demanda}, '${nome}')`)

            if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar irregularidade' })

            const newId = create.recordset[0].id; // Aqui está o novo ID

            console.log(create);

            return res.json({
                msg: 'ok',
                id: newId // Retornando o novo ID na resposta
            })
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getIrregularidade: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const result = await new sql.query(`SELECT * FROM Irregularidade WHERE id_demanda = ${id}`)

            return res.json(result.recordset)
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    deleteIrregularidade: async (req, res) => {
        try {

            const { id } = req.params

            console.log(id);

            await ensureConnection()

            const remove = await sql.query(`DELETE FROM Irregularidade WHERE id = ${id}`)

            console.log(remove);

            if (remove.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao deletar irregularidade' })


            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    createAgenda: async (req, res) => {

        try {
            const { id_demanda, observacao } = req.body

            await ensureConnection()

            console.log(id_demanda, observacao, req.user);

            const create = await sql.query(`INSERT INTO Agenda (id_demanda, data, observacao, analista) OUTPUT INSERTED.id VALUES (${id_demanda}, '${moment().format('YYYY-MM-DD HH:mm:ss')}', '${observacao}', '${req.user}')`)

            if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar agenda' })

            const newId = create.recordset[0].id; // Aqui está o novo ID

            return res.json({
                msg: 'ok',
                result: {
                    id: newId,
                    data: moment().format('YYYY-MM-DD HH:mm:ss'),
                    observacao,
                    analista: req.user,
                    id_demanda
                }
            })
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getAgenda: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const result = await new sql.query(`SELECT * FROM Agenda WHERE id_demanda = ${id}`)

            return res.json(result.recordset)
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    deleteAgenda: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const remove = await sql.query(`DELETE FROM Agenda WHERE id = ${id}`)

            if (remove.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao deletar agenda' })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    createValor: async (req, res) => {

        try {
            const { id_demanda, valor, periodo } = req.body

            await ensureConnection()

            const find = await new sql.query(`SELECT * FROM Valor WHERE id_demanda = ${id_demanda}`)

            if (find.recordset.length !== 0) {
                const update = await sql.query(`UPDATE Valor SET valor = ${valor}, periodo = '${periodo}' WHERE id_demanda = ${id_demanda}`)
                if (update.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao atualizar valor' })
                return res.json({
                    msg: 'ok',
                    result: {
                        id: find.recordset[0].id,
                        valor,
                        periodo,
                        id_demanda
                    }
                })
            }

            const create = await sql.query(`INSERT INTO Valor (id_demanda, valor, periodo) OUTPUT INSERTED.id VALUES (${id_demanda}, ${valor}, '${periodo}')`)

            if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar valor' })

            const newId = create.recordset[0].id; // Aqui está o novo ID

            return res.json({
                msg: 'ok',
                result: {
                    id: newId,
                    valor,
                    periodo,
                    id_demanda
                }
            })
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getValor: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const result = await new sql.query(`SELECT * FROM Valor WHERE id_demanda = ${id}`)

            if (result.recordset.length === 0) return res.json({ msg: 'Nenhum valor encontrado' })

            return res.json(result.recordset[0])
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    deleteValor: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const remove = await sql.query(`DELETE FROM Valor WHERE id = ${id}`)

            if (remove.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao deletar valor' })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    finalizarDemanda: async (req, res) => {
        try {

            const { id_demanda, justificativa, data, checklist } = req.body

            await ensureConnection()

            // console.log(id_demanda, justificativa, data, checklist);

            const create = await sql.query(`INSERT INTO Finalizacao (id_demanda, justificativa, data) OUTPUT INSERTED.id VALUES (${id_demanda}, '${justificativa}', '${data}')`)

            if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar finalização' })

            const newId = create.recordset[0].id; // Aqui está o novo ID

            console.log(checklist);

            for (const item of checklist) {
                const createChecklist = await sql.query(`INSERT INTO Checklist (id_demanda, item, resposta, justificativa, observacao) VALUES (${id_demanda}, '${item.item}', '${item.resposta}', '${item.justificativa}', '${item.observacao}')`)
                if (createChecklist.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar checklist' })
            }

            return res.json({
                msg: 'ok',
                result: {
                    id: newId,
                    justificativa,
                    id_demanda,
                    data: moment().format('YYYY-MM-DD HH:mm:ss')
                }
            })
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    deleteFinalizacao: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            console.log(id);

            if (!id) return res.json({ msg: 'Erro ao deletar finalização' })

            const remove = await sql.query(`DELETE FROM Finalizacao WHERE id_demanda = ${id}`)
            await sql.query(`DELETE FROM Checklist WHERE id_demanda = ${id}`)

            if (remove.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao deletar finalização' })

            return res.json({
                msg: 'ok'
            })

        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getChecklist: async (req, res) => {
        try {

            const { id } = req.params

            await ensureConnection()

            const result = await new sql.query(`SELECT * FROM Checklist WHERE id_demanda = ${id}`)

            return res.json(result.recordset)
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    quantidadeDemandasResponsaveis: async (req, res) => {
        try {

            const { mes } = req.params

            const dataInicio = moment(mes).startOf('month').toDate();
            const dataFim = moment(mes).endOf('month').toDate();

            const dataInicioMesPassado = moment(mes).subtract(1, 'months').startOf('month').toDate();
            const dataFimMesPassado = moment(mes).subtract(1, 'months').endOf('month').toDate();


            await ensureConnection()

            let filter = ''

            if (dataInicio && dataFim) filter += ` Demanda.data_demanda BETWEEN '${dataInicio.toISOString()}' AND '${dataFim.toISOString()}'`

            let filterMesPassado = ''

            if (dataInicioMesPassado && dataFimMesPassado) filterMesPassado += `Demanda.data_demanda BETWEEN '${dataInicioMesPassado.toISOString()}' AND '${dataFimMesPassado.toISOString()}'`

            const find = await sql.query(`
            SELECT Demanda.*, Usuario.nome as usuario_criador_nome, UsuarioDistribuicao.nome as usuario_distribuicao_nome, Status.nome as status_nome
            FROM Demanda
            JOIN Usuario ON Demanda.usuario_criador_id = Usuario.id
            JOIN Status ON Demanda.status_id = Status.id
            LEFT JOIN Usuario UsuarioDistribuicao ON Demanda.usuario_distribuicao_id = UsuarioDistribuicao.id
            WHERE ${filter}
            `)
            const arrayFind = Array.isArray(find.recordset) ? find.recordset : []
            const countArrayFind = arrayFind.length
            console.log(countArrayFind);

            const findMesPassado = await sql.query(`
            SELECT Demanda.*, Usuario.nome as usuario_criador_nome, UsuarioDistribuicao.nome as usuario_distribuicao_nome, Status.nome as status_nome
            FROM Demanda
            JOIN Usuario ON Demanda.usuario_criador_id = Usuario.id
            JOIN Status ON Demanda.status_id = Status.id
            LEFT JOIN Usuario UsuarioDistribuicao ON Demanda.usuario_distribuicao_id = UsuarioDistribuicao.id
            WHERE ${filterMesPassado}
            `)
            const arrayFindMesPassado = Array.isArray(findMesPassado.recordset) ? findMesPassado.recordset : []
            const countArrayFindMesPassado = arrayFindMesPassado.length
            console.log(countArrayFindMesPassado);

            const findConcluidas = await sql.query(`
            SELECT Demanda.status_id as status_id, Status.nome as status_nome, Demanda.usuario_distribuicao_id as usuario_distribuicao_identificacao
            FROM Demanda
            LEFT JOIN Usuario UsuarioDistribuicao ON Demanda.usuario_distribuicao_id = UsuarioDistribuicao.id
            JOIN Status ON Demanda.status_id = 6
            WHERE ${filter}
            `)
            const arrayFindConcluidas = Array.isArray(findConcluidas.recordset) ? findConcluidas.recordset : []
            const countArrayFindConcluidas = arrayFindConcluidas.length
            console.log(countArrayFindConcluidas);

            const findConcluidasMesPassado = await sql.query(`
            SELECT Demanda.status_id as status_id, Status.nome as status_nome, Demanda.usuario_distribuicao_id as usuario_distribuicao_identificacao
            FROM Demanda
            LEFT JOIN Usuario UsuarioDistribuicao ON Demanda.usuario_distribuicao_id = UsuarioDistribuicao.id
            JOIN Status ON Demanda.status_id = 6
            WHERE ${filterMesPassado}
            `)
            const arrayFindConcluidasMesPassado = Array.isArray(findConcluidasMesPassado.recordset) ? findConcluidasMesPassado.recordset : []
            const countArrayFindConcluidasMesPassado = arrayFindConcluidasMesPassado.length
            console.log(countArrayFindConcluidasMesPassado);

            return res.json({
                msg: 'ok',
                find: countArrayFind,
                findMesPassado: countArrayFindMesPassado,
                findConcluidas: countArrayFindConcluidas,
                findConcluidasMesPassado: countArrayFindConcluidasMesPassado,
            })
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    quantidadeDemandasSindicancia: async (req, res) => {
        try {

            const { mes } = req.params

            const dataInicio = moment(mes).startOf('month').toDate();
            const dataFim = moment(mes).endOf('month').toDate();

            const dataInicioMesPassado = moment(mes).subtract(1, 'months').startOf('month').toDate();
            const dataFimMesPassado = moment(mes).subtract(1, 'months').endOf('month').toDate();

            await ensureConnection()

            let filter = ''

            if (dataInicio && dataFim) filter += ` Demanda.data_demanda BETWEEN '${dataInicio.toISOString()}' AND '${dataFim.toISOString()}'`

            let filterMesPassado = ''

            if (dataInicioMesPassado && dataFimMesPassado) filterMesPassado += `Demanda.data_demanda BETWEEN '${dataInicioMesPassado.toISOString()}' AND '${dataFimMesPassado.toISOString()}'`

            const findDistribuicao = await sql.query(`
            SELECT Demanda.usuario_distribuicao_id as usuario_distribuicao_identificacao, UsuarioDistribuicao.nome as usuario_distribuicao_nome, Status.nome as status_nome
            FROM Demanda
            JOIN Status ON Demanda.status_id = Status.id
            LEFT JOIN Usuario UsuarioDistribuicao ON Demanda.usuario_distribuicao_id = UsuarioDistribuicao.id
            WHERE ${filter}
            `)
            // console.log(findDistribuicao);

            const findDistribuicaoMesPassado = await sql.query(`
            SELECT Demanda.usuario_distribuicao_id as usuario_distribuicao_identificacao, UsuarioDistribuicao.nome as usuario_distribuicao_nome, Status.nome as status_nome
            FROM Demanda
            JOIN Status ON Demanda.status_id = Status.id
            LEFT JOIN Usuario UsuarioDistribuicao ON Demanda.usuario_distribuicao_id = UsuarioDistribuicao.id
            WHERE ${filterMesPassado}
            `)
            // console.log(findDistribuicaoMesPassado);

            const findAbertas = await sql.query(`
            SELECT Demanda.status_id as status_identificacao, Status.nome as status_nome
            FROM Demanda
            JOIN Status ON Demanda.status_id = Status.id
            WHERE ${filter} AND Demanda.status_id NOT IN (6, 7)
            `)
            // console.log(findAbertas);

            const findAbertasMesPassado = await sql.query(`
            SELECT Demanda.status_id as status_identificacao, Status.nome as status_nome
            FROM Demanda
            JOIN Status ON Demanda.status_id = Status.id
            WHERE ${filterMesPassado} AND Demanda.status_id NOT IN (6, 7)
            `)
            // console.log(findAbertasMesPassado);

            return res.json({
                msg: 'ok',
                findDistribuicao: findDistribuicao.recordset,
                findDistribuicaoMesPassado: findDistribuicaoMesPassado.recordset,
                findAbertas: findAbertas.recordset,
                findAbertasMesPassado: findAbertasMesPassado.recordset,

            })
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    quantidadeIndividualSindicancia: async (req, res) => {
        try {

            const { mes } = req.params

            const dataInicio = moment(mes).startOf('month').toDate();
            const dataFim = moment(mes).endOf('month').toDate();

            const dataInicioMesPassado = moment(mes).subtract(1, 'months').startOf('month').toDate();
            const dataFimMesPassado = moment(mes).subtract(1, 'months').endOf('month').toDate();

            await ensureConnection()

            let filterPacotes = ''
            if (dataInicio && dataFim) filterPacotes += ` Pacote.data_criacao BETWEEN '${dataInicio.toISOString()}' AND '${dataFim.toISOString()}'`

            let filterPacotesMesPassado = ''
            if (dataInicioMesPassado && dataFimMesPassado) filterPacotesMesPassado += ` Pacote.data_criacao BETWEEN '${dataInicioMesPassado.toISOString()}' AND '${dataFimMesPassado.toISOString()}'`

            let filterDemandas = ''
            if (dataInicio && dataFim) filterDemandas += ` Demanda.data_demanda BETWEEN '${dataInicio.toISOString()}' AND '${dataFim.toISOString()}'`

            const findPacotes = await sql.query(`
            SELECT Pacote.*, Usuario.nome as usuario_criador_nome
            FROM Pacote
            JOIN Usuario ON Pacote.usuario_id = Usuario.id
            WHERE ${filterPacotes}
            `)
            const arrayFindPacote = Array.isArray(findPacotes.recordset) ? findPacotes.recordset : []
            const countByUsuarioCriadorNome = arrayFindPacote.reduce((acc, curr) => {
                const usuarioCriadorNome = curr.usuario_criador_nome;
                acc[usuarioCriadorNome] = (acc[usuarioCriadorNome] || 0) + 1;
                return acc;
            }, {});
            const sortedCount = Object.entries(countByUsuarioCriadorNome)
                .sort(([, countA], [, countB]) => countB - countA)
                .reduce((acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                }, {});
            // console.log(countByUsuarioCriadorNome);

            const findPacotesMesPassado = await sql.query(`
            SELECT Pacote.*, Usuario.nome as usuario_criador_nome
            FROM Pacote
            JOIN Usuario ON Pacote.usuario_id = Usuario.id
            WHERE ${filterPacotesMesPassado}
            `)
            const arrayFindMesPassado = Array.isArray(findPacotesMesPassado.recordset) ? findPacotesMesPassado.recordset : []
            const countByUsuarioCriadorNomeMesPassado = arrayFindMesPassado.reduce((acc, curr) => {
                const usuarioCriadorNome = curr.usuario_criador_nome;
                acc[usuarioCriadorNome] = (acc[usuarioCriadorNome] || 0) + 1;
                return acc;
            }, {});
            // console.log(countByUsuarioCriadorNomeMesPassado);

            const findDemandaIndividual = await sql.query(`
            SELECT Demanda.*, Usuario.nome as usuario_criador_nome, UsuarioDistribuicao.nome as usuario_distribuicao_nome, Status.nome as status_nome
            FROM Demanda
            JOIN Usuario ON Demanda.usuario_criador_id = Usuario.id
            JOIN Status ON Demanda.status_id = Status.id
            LEFT JOIN Usuario UsuarioDistribuicao ON Demanda.usuario_distribuicao_id = UsuarioDistribuicao.id
            WHERE ${filterDemandas}
            `)
            const arrayFind = Array.isArray(findDemandaIndividual.recordset) ? findDemandaIndividual.recordset : []
            const countByUsuarioDemandas = arrayFind.reduce((acc, curr) => {
                const usuarioDistribuicaoNome = curr.usuario_distribuicao_nome;
                acc[usuarioDistribuicaoNome] = (acc[usuarioDistribuicaoNome] || 0) + 1;
                return acc;
            }, {});
            // console.log(countByUsuarioDemandas);

            return res.json({
                msg: 'ok',
                findDemandaIndividual: countByUsuarioDemandas,
                findPacote: sortedCount,
                findPacoteMesPassado: countByUsuarioCriadorNomeMesPassado,
            })
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    quantidadeDemandasMensal: async (req, res) => {
        try {

            const { mes } = req.params

            const dataInicio = moment(mes).startOf('month').toDate();
            const dataFim = moment(mes).endOf('month').toDate();

            const dataInicioMesPassado = moment(mes).subtract(1, 'months').startOf('month').toDate();
            const dataFimMesPassado = moment(mes).subtract(1, 'months').endOf('month').toDate();

            await ensureConnection()

            let filterDemandas = ''
            if (dataInicio && dataFim) filterDemandas += ` Demanda.data_demanda BETWEEN '${dataInicio.toISOString()}' AND '${dataFim.toISOString()}'`

            let filterDemandasMesPassado = ''
            if (dataInicioMesPassado && dataFimMesPassado) filterDemandasMesPassado += ` Demanda.data_demanda BETWEEN '${dataInicioMesPassado.toISOString()}' AND '${dataFimMesPassado.toISOString()}'`

            const findDemanda = await sql.query(`
            SELECT CONVERT(date, data_demanda) as x, COUNT(*) as y
            FROM Demanda
            JOIN Usuario ON Demanda.usuario_distribuicao_id = Usuario.id
            WHERE ${filterDemandas}
            GROUP BY CONVERT(date, data_demanda)
            `)
            // console.log(findDemanda.recordset);


            const findDemandaMesPassado = await sql.query(`
            SELECT CONVERT(date, data_demanda) as x, COUNT(*) as y
            FROM Demanda
            JOIN Usuario ON Demanda.usuario_distribuicao_id = Usuario.id
            WHERE ${filterDemandasMesPassado}
            GROUP BY CONVERT(date, data_demanda)
            `)
            // console.log(findDemandaMesPassado.recordset);

            return res.json({
                msg: 'ok',
                findDemanda: findDemanda.recordset,
                findDemandaMesPassado: findDemandaMesPassado.recordset,
            })
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    producaoIndividualSindi: async (req, res) => {
        try {

            const { mes, analista } = req.params

            const dataInicio = moment(mes).startOf('month').toDate();
            const dataFim = moment(mes).endOf('month').toDate();

            const dataInicioMesPassado = moment(mes).subtract(1, 'months').startOf('month').toDate();
            const dataFimMesPassado = moment(mes).subtract(1, 'months').endOf('month').toDate();

            let filter = ''
            if (dataInicio && dataFim) filter += ` Pacote.data_finalizacao BETWEEN '${dataInicio.toISOString()}' AND '${dataFim.toISOString()}'`

            let filterMesPassado = ''
            if (dataInicioMesPassado && dataFimMesPassado) filterMesPassado += ` Pacote.data_finalizacao BETWEEN '${dataInicioMesPassado.toISOString()}' AND '${dataFimMesPassado.toISOString()}'`

            let filterDemanda = ''
            if (dataInicio && dataFim) filterDemanda += ` Demanda.data_demanda BETWEEN '${dataInicio.toISOString()}' AND '${dataFim.toISOString()}'`

            let filterDemandaMesPassado = ''
            if (dataInicioMesPassado && dataFimMesPassado) filterDemandaMesPassado += ` Demanda.data_demanda BETWEEN '${dataInicioMesPassado.toISOString()}' AND '${dataFimMesPassado.toISOString()}'`
            await ensureConnection()

            const totalPacotesIndividual = await sql.query(`
            SELECT COUNT(*) as quantidade_pacote, Usuario.nome as nome_usuario
            FROM Pacote
            JOIN Usuario ON Pacote.usuario_id = Usuario.id
            WHERE ${filter} AND Usuario.nome = '${analista}' AND Pacote.finalizado = 1
            GROUP BY Usuario.nome
            `)
            // console.log(totalPacotesIndividual.recordset);

            const totalPacotesIndividualMesPassado = await sql.query(`
            SELECT COUNT(*) as quantidade_pacote, Usuario.nome as nome_usuario
            FROM Pacote
            JOIN Usuario ON Pacote.usuario_id = Usuario.id
            WHERE ${filterMesPassado} AND Usuario.nome = '${analista}' AND Pacote.finalizado = 1
            GROUP BY Usuario.nome
            `)
            // console.log(totalPacotesIndividualMesPassado.recordset);

            const totalPacotesMelhorAnalista = await sql.query(`
            SELECT TOP 1 Usuario.nome as nome_usuario, COUNT(*) as quantidade_pacote 
            FROM Pacote
            JOIN Usuario ON Pacote.usuario_id = Usuario.id
            WHERE ${filter} AND Pacote.finalizado = 1
            GROUP BY Usuario.nome
            ORDER BY COUNT(*) DESC
            `)
            // console.log(totalPacotesMelhorAnalista.recordset);

            const totalDemandasGeral = await sql.query(`
            SELECT COUNT(*) as quantidade_demanda
            FROM Demanda
            WHERE ${filterDemanda}
            `)
            // console.log(totalDemandasGeral.recordset);

            const totalDemandasGeralMesPassado = await sql.query(`
            SELECT COUNT(*) as quantidade_demanda
            FROM Demanda
            WHERE ${filterDemandaMesPassado}
            `)
            // console.log(totalDemandasGeralMesPassado.recordset);

            return res.status(200).json({
                totalPacotesIndividual: totalPacotesIndividual.recordset,
                totalPacotesIndividualMesPassado: totalPacotesIndividualMesPassado.recordset,
                totalPacotesMelhorAnalista: totalPacotesMelhorAnalista.recordset,
                totalDemandasGeral: totalDemandasGeral.recordset,
                totalDemandasGeralMesPassado: totalDemandasGeralMesPassado.recordset,
            })
        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    comparativoProducaoSindi: async (req, res) => {
        try {

            const { mes, analista } = req.params

            const dataInicio = moment(mes).startOf('month').toDate();
            const dataFim = moment(mes).endOf('month').toDate();

            let filter = ''
            if (dataInicio && dataFim) filter += ` Pacote.data_criacao BETWEEN '${dataInicio.toISOString()}' AND '${dataFim.toISOString()}'`

            const verificarPorDia = await sql.query(`
            SELECT CONVERT(date, data_criacao) as x, COUNT(*) as y, Usuario.nome as usuario
            FROM Pacote
            JOIN Usuario ON Pacote.usuario_id = Usuario.id
            WHERE ${filter} AND Usuario.nome = '${analista}'
            GROUP BY CONVERT(date, data_criacao), Usuario.nome
            `);
            // console.log(verificarPorDia.recordset);
            const dadosPorAnalista = verificarPorDia.recordset.map(item => ({
                x: item.x,
                y: item.y
            }));
            // console.log(dadosPorAnalista);

            const todasAsDatas = [...new Set([...dadosPorAnalista.map(item => item.x)])];

            let series = [
                {
                    name: analista,
                    data: [],
                    type: 'bar'
                }
            ]
            for (const date of todasAsDatas) {
                const dadoPorAnalista = dadosPorAnalista.find(item => item.x === date);

                console.log(dadoPorAnalista);
                series[0].data.push({
                    x: moment(date).format('DD/MM/YYYY'),
                    y: dadoPorAnalista ? dadoPorAnalista.y : 0
                })
            }
            // console.log(series[0].data);

            return res.status(200).json({ series })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    createComplementacao: async (req, res) => {
        try {

            const { id_demanda, motivo, data, complementacao } = req.body

            await ensureConnection()

            console.log(id_demanda, motivo, data, complementacao);

            const find = await new sql.query(`SELECT * FROM Complementacao WHERE id_demanda = ${id_demanda}`)

            if (find.recordset.length === 0) {
                const create = await sql.query(`INSERT INTO Complementacao (id_demanda, motivo, data, complementacao) OUTPUT INSERTED.id VALUES (${id_demanda}, '${motivo}', '${data}', ${complementacao ? 1 : 0})`)

                if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar complementação' })

                const newId = create.recordset[0].id; // Aqui está o novo ID

                return res.json({
                    msg: 'ok',
                    result: {
                        id: newId,
                        complementacao,
                        id_demanda
                    }
                })
            } else {
                const update = await sql.query(`UPDATE Complementacao SET motivo = '${motivo}', data = '${data}', complementacao = ${complementacao ? 1 : 0}  WHERE id_demanda = ${id_demanda}`)

                if (update.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao atualizar complementação' })

                return res.json({
                    msg: 'ok',
                    result: {
                        id: find.recordset[0].id,
                        motivo,
                        id_demanda,
                        data,
                        complementacao: find.recordset[0].complementacao + 1
                    }
                })
            }

        } catch (error) {
            console.log(error);
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    createItemChecklist: async (req, res) => {
        try {
            const { item, descricao } = req.body
            await ensureConnection()
            const create = await sql.query(`INSERT INTO ItensChecklist (item, descricao) OUTPUT INSERTED.id VALUES ('${item}', '${descricao}')`)
            if (create.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao criar item de checklist' })
            const newId = create.recordset[0].id; // Aqui está o novo ID
            return res.json({
                msg: 'ok',
                id: newId
            })
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    getItemChecklist: async (req, res) => {
        try {
            await ensureConnection()
            const result = await new sql.query(`SELECT * FROM ItensChecklist`)
            return res.json(result.recordset)
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    },

    deleteItemChecklist: async (req, res) => {
        try {
            const { id } = req.params
            await ensureConnection()
            const remove = await sql.query(`DELETE FROM ItensChecklist WHERE id = ${id}`)
            if (remove.rowsAffected[0] === 0) return res.json({ msg: 'Erro ao deletar item de checklist' })
            return res.json({ msg: 'ok' })
        } catch (error) {
            return res.json({
                msg: 'Internal Server Error',
                error
            })
        }
    }


}