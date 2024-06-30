const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const dadosEntrevistaService = require('../services/dadosEntrevista.service')
const finalizarEntrevistaUsecase = require('../usecases/finalizarEntrevista.usecase')
const migrarCidsUsecase = require('../usecases/migrarCids.usecase')
const CancelarEntrevistaUsecase = require('../usecases/cancelarEntrevista.usecase')
const cancelarEntrevistaUsecase = require('../usecases/cancelarEntrevista.usecase')
const migrarPropostaIdsUsecase = require('../usecases/migrarPropostaIds.usecase')
const voltarEntrevistaUsecase = require('../usecases/voltarEntrevista.usecase')

router.post('/cancelar', auth, async (req, res) => {
    const { id, motivo } = req.body
    try {
        const dadosEntrevista = await cancelarEntrevistaUsecase.execute(id, motivo, req.user)
        res.status(200).json(dadosEntrevista)
    } catch (error) {
        res.status(500).json({ message: 'Erro ao cancelar entrevista' })
    }
})


router.get('/id/:id', auth, async (req, res) => {
    const { id } = req.params
    try {
        const entrevista = await dadosEntrevistaService.findById(id)
        res.status(200).json(entrevista)
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar entrevista' })
    }
})

router.get('/proposta/:id', auth, async (req, res) => {
    const { id } = req.params
    try {
        const entrevista = await dadosEntrevistaService.findByPropostaId(id)
        res.status(200).json(entrevista)
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar entrevista' })
    }
})

router.get('/details/:details', auth, async (req, res) => {
    const { details } = req.params
    try {
        const entrevistas = await dadosEntrevistaService.findByDetails(details)
        res.status(200).json(entrevistas)
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar entrevistas' })
    }
})

router.post('/finalizarEntrevista', auth, async (req, res) => {
    const { id, respostas, cids, cidsDs, divergencia, qualDivergencia, motivoBeneficiario, tea } = req.body
    try {
        const entrevista = await finalizarEntrevistaUsecase.execute(id, respostas, cids, cidsDs, divergencia, qualDivergencia, motivoBeneficiario, tea, req.user)
        res.status(200).json(entrevista)
    } catch (error) {
        res.status(500).json({ message: 'Erro ao finalizar entrevista' })
    }
})

router.post('/cancelarEntrevista', auth, async (req, res) => {
    const { id, motivo } = req.body
    try {
        const entrevista = await CancelarEntrevistaUsecase.execute(id, motivo, req.user)
        res.status(200).json(entrevista)
    } catch (error) {
        res.status(500).json({ message: 'Erro ao cancelar entrevista' })
    }
})

router.patch('/voltarEntrevista/:id', auth, async (req, res) => {
    const { id } = req.params
    try {
        const entrevista = await voltarEntrevistaUsecase.execute(id)
        res.status(200).json(entrevista)
    } catch (error) {
        res.status(500).json({ message: 'Erro ao voltar entrevista' })
    }
})

router.put('/update/:id', auth, async (req, res) => {
    const { id } = req.params
    const data = req.body
    try {
        const entrevista = await dadosEntrevistaService.update(id, data)
        res.status(200).json(entrevista)
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar entrevista', error })
    }
})

router.get('/migrarCids', async (req, res) => {
    try {
        await migrarCidsUsecase.execute()
        res.status(200).json({ message: 'Cids migrados com sucesso' })
    } catch (error) {
        res.status(500).json({ message: 'Erro ao migrar cids' })
    }
})

router.get('/migrarPropostaIds', async (req, res) => {
    try {
        await migrarPropostaIdsUsecase.execute()
        res.status(200).json({ message: 'Propostas migradas com sucesso' })
    } catch (error) {
        res.status(500).json({ message: 'Erro ao migrar propostas' })
    }
})

module.exports = router