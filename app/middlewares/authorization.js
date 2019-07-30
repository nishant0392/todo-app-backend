const mongoose = require('mongoose')
const Auth = mongoose.model('Auth')

const logger = require('../lib/loggerLib')
const Response = require('../lib/generateResponseLib')
const JWT = require('../lib/tokenLib')
const util = require('../lib/utilityLib')

let isAuthorized = (req, res, next) => {


    if (req.params.authToken || req.query.authToken || req.body.authToken || req.header('authToken')) {
        Auth.findOne({ authToken: req.header('authToken') || req.params.authToken || req.body.authToken || req.query.authToken }, (err, authDetails) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'AuthorizationMiddleware', 10)
                let apiResponse = Response.generate(true, 'Failed To Authorized', 500, null)
                res.send(apiResponse)
            }
            else if (util.isEmpty(authDetails)) {
                logger.error('No AuthorizationKey Is Present', 'AuthorizationMiddleware', 10)
                let apiResponse = Response.generate(true, 'Invalid Or Expired Authorization Key', 404, null)
                res.send(apiResponse)
            }
            else {
                JWT.verifyToken(authDetails.authToken, authDetails.tokenSecret, (err, decoded) => {

                    if (err) {
                        logger.error(err.message, 'Authorization Middleware', 10)
                        let apiResponse = Response.generate(true, 'Failed To Authorized', 500, null)
                        res.send(apiResponse)
                    }
                    else {

                        req.user = { userId: decoded.data.userId }
                        next()
                    }
                });// end verify token
            }
        })
    }
    else {
        logger.error('AuthorizationToken Missing', 'AuthorizationMiddleware', 5)
        let apiResponse = Response.generate(true, 'AuthorizationToken Is Missing In Request', 400, null)
        res.send(apiResponse)
    }
}


module.exports = {
    isAuthorized: isAuthorized
}