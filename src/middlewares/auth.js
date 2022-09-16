const jwt = require('jsonwebtoken')
const secret = process.env.JWT_SECRET

const auth = (req, res, next) => {
    const token = req.cookies['token'] ? req.cookies['token'] : ""
    try {
        const data = jwt.verify(token, secret)
        req.user = data.username
        req.email = data.email
        req.userAcessLevel = data.accessLevel

        next()
    } catch (error) {
        return res.status(400).json({message: error})
    }
}

module.exports = auth