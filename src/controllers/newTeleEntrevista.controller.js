const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const dadosEntrevistaService = require('../services/dadosEntrevista.service')
const finalizarEntrevistaUsecase = require('../usecases/finalizarEntrevista.usecase')
const migrarCidsUsecase = require('../usecases/migrarCids.usecase')
const CancelarEntrevistaUsecase = require('../usecases/cancelarEntrevista.usecase')

router.get('/id/:id', auth, async (req, res) => {
    const { id } = req.params
    try {
        const entrevista = await dadosEntrevistaService.findById(id)
        res.status(200).json(entrevista)
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar entrevista' })
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

router.get('/migrarCids', async (req, res) => {
    try {
        await migrarCidsUsecase.execute()
        res.status(200).json({ message: 'Cids migrados com sucesso' })
    } catch (error) {
        res.status(500).json({ message: 'Erro ao migrar cids' })
    }
})

module.exports = router