const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET
const User = require('../models/User/User')

const auth = async (req, res, next) => {
    let token = req.cookies['token'] ? req.cookies['token'] : ""

    if (!token) {
        token = req.headers['authorization'].split(' ')[1]
    }

    try {
        const data = jwt.verify(token, secret)

        const userData = await User.findOne({
            email: data.email
        })

        req.user = data.username
        req.email = data.email
        req.userAcessLevel = data.accessLevel
        req.acessos = userData.acessos

        next()
    } catch (error) {
        return res.status(400).json({ message: error })
    }
}

module.exports = auth