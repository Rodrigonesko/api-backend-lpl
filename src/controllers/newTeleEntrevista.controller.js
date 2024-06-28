const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const finalizarEntrevistaUsecase = require('../usecases/finalizarEntrevista.usecase')
const migrarCidsUsecase = require('../usecases/migrarCids.usecase')

router.post('/finalizarEntrevista', auth, async (req, res) => {
    const { id, respostas, cids, cidsDs, pessoa, divergencia, qualDivergencia, motivoBeneficiario, tea } = req.body
    try {
        await finalizarEntrevistaUsecase.execute(id, respostas, cids, cidsDs, pessoa, divergencia, qualDivergencia, motivoBeneficiario, tea)
        res.status(200).json({ message: 'Entrevista finalizada com sucesso' })
    } catch (error) {
        res.status(500).json({ message: 'Erro ao finalizar entrevista' })
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