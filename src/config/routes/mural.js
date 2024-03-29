const express = require('express')
const router = express.Router()
const muralController = require('../../controllers/muralController')
const auth = require('../../middlewares/auth')

router.post('/', auth, muralController.create)
router.get('/', auth, muralController.getAllRecados)
router.delete(`/:id`, auth, muralController.destroy)

module.exports = router