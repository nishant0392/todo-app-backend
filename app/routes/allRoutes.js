const userProfileController = require('../controllers/userProfileController')
const todoListController = require('../controllers/todoListController')
const appConfig = require("../config/appConfiguration")

// Authorization Middleware
const authMiddleware = require('../middlewares/authorization')


let setRouter = (app) => {
    let baseUrl = appConfig.apiVersion;   // apiVersion = "/api/v1"

    /* Routes related to TODO Application */    

    app.get(baseUrl+'/users/todo/lists', todoListController.getTodo);

    app.get(baseUrl+'/users/todo/allLists', todoListController.getAllLists);

    app.post(baseUrl+'/users/todo/savelist', todoListController.saveList);

    app.post(baseUrl+'/users/todo/lists', todoListController.saveTodo);


    /* Routes related to User Management */

    app.post(baseUrl+'/users/signup', userProfileController.signup);

    app.post(baseUrl+'/users/login', userProfileController.login);

    app.post(baseUrl+'/users/logout', authMiddleware.isAuthorized, userProfileController.logout);

    app.post(baseUrl+'/users/forgot-password', userProfileController.forgotPassword);

    app.post(baseUrl+'/users/reset-password/:userId/:authToken', userProfileController.resetPassword);
    
    app.post(baseUrl+'/users/:userId/delete/:userId', authMiddleware.isAuthorized, userProfileController.deleteAccount);

}

module.exports = {
    setRouter: setRouter
}