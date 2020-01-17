const mongoose = require('mongoose')
const Auth = mongoose.model('Auth')

const logger = require('../lib/loggerLib')
const Response = require('../lib/generateResponseLib')
const JWT = require('../lib/tokenLib')
const util = require('../lib/utilityLib')

let isAuthorized = (req, res, next) => {

    let authToken = req.params.authToken || req.query.authToken || req.body.authToken || req.header('authToken');

    if (authToken) {

        Auth.findOne({ authToken: authToken }, (err, authDetails) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'AuthorizationMiddleware', 10)
                let apiResponse = Response.generate(true, 'Failed To Authorize', 500, null)
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
                        let apiResponse = Response.generate(true, 'Failed To Authorize', 500, null)
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

let isUserAuthorized = (req, res, next) => {
    let authToken = req.params.authToken || req.query.authToken || req.body.authToken || req.header('authToken');
    let userId = req.params.userId || req.query.userId || req.body.userId || req.header('userId')
        || req.params.senderId || req.query.senderId || req.body.senderId || req.header('senderId');

    if (authToken && userId) {
        Auth.findOne({ authToken: authToken, userId: userId }, (err, authDetails) => {
            if (err) {
                console.log(err)
                logger.error(err.message, 'AuthorizationMiddleware', 10)
                let apiResponse = Response.generate(true, 'Failed To Authorize', 500, null)
                res.send(apiResponse)
            }
            else if (util.isEmpty(authDetails)) {
                console.log()
                logger.error('No AuthorizationKey Is Present', 'AuthorizationMiddleware', 10)
                let apiResponse = Response.generate(true, 'Invalid Or Expired Authorization Key', 404, null)
                res.send(apiResponse)
            }
            else {
                JWT.verifyToken(authDetails.authToken, authDetails.tokenSecret, (err, decoded) => {

                    if (err) {
                        logger.error(err.message, 'Authorization Middleware', 10)
                        let apiResponse = Response.generate(true, 'Failed To Authorize', 500, null)
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
    else if (!userId) {
        logger.error('UserId Missing', 'AuthorizationMiddleware', 5)
        let apiResponse = Response.generate(true, 'UserId Is Missing In Request', 400, null)
        res.send(apiResponse)
    }
    else {
        logger.error('AuthorizationToken Missing', 'AuthorizationMiddleware', 5)
        let apiResponse = Response.generate(true, 'AuthorizationToken Is Missing In Request', 400, null)
        res.send(apiResponse)
    }
}


module.exports = {
    isAuthorized: isAuthorized,
    isUserAuthorized: isUserAuthorized
}