const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth')
const propostaEntrevistaService = require('../services/propostasEntrevista.service')

router.get('/id/:id', auth, async (req, res) => {
    const { id } = req.params
    try {
        const proposta = await propostaEntrevistaService.getPropostaById(id)
        res.status(200).json(proposta)
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar proposta' })
    }
})

router.get('/status/:status', auth, async (req, res) => {
    const { status } = req.params
    try {
        const propostas = await propostaEntrevistaService.getPropostasByStatus(status)
        res.status(200).json(propostas)
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar propostas' })
    }
})

router.get('/agendamento', auth, async (req, res) => {
    const { agendado, sort, pesquisa, responsavel, tipoContrato, limit, page } = req.query
    try {
        const propostas = await propostaEntrevistaService.getPropostasByAgendamento(agendado, sort, pesquisa, responsavel, tipoContrato, limit, page)
        res.status(200).json(propostas)
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar propostas' })
    }
})

router.get('/enfermeiro/:enfermeiro', auth, async (req, res) => {
    const { enfermeiro } = req.params
    try {
        const propostas = await propostaEntrevistaService.getPropostasByEnfermeiro(enfermeiro)
        res.status(200).json(propostas)
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar propostas' })
    }
})


router.put('/:id', auth, async (req, res) => {
    const { id } = req.params
    try {
        const proposta = await propostaEntrevistaService.update(id, req.body)
        res.status(200).json(proposta)
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar proposta' })
    }
})

router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params
    try {
        await propostaEntrevistaService.delete(id)
        res.status(200).json({ message: 'Proposta deletada com sucesso' })
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar proposta' })
    }
})


module.exports = router