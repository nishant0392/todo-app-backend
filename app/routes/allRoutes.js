const userProfileController = require('../controllers/userProfileController')
const todoListController = require('../controllers/todoListController')
const friendsListController = require('../controllers/friendsListController')
const deleteAccountController = require('../controllers/deleteAccountController')
const appConfig = require("../config/appConfiguration")
const multer = require('multer')

// Authorization Middlewares
const authMiddleware = require('../middlewares/authorization')


let setRouter = (app) => {
    let baseUrl = appConfig.apiVersion;   // apiVersion = "/api/v1"

    /* Routes related to Friends List Management */
    app.post(baseUrl+'/users/friend-request/send', authMiddleware.isUserAuthorized, friendsListController.sendFriendRequest);

    app.post(baseUrl+'/users/friend-request/accept-reject', authMiddleware.isUserAuthorized, friendsListController.acceptOrRejectRequest);

    app.get(baseUrl+'/users/friend-request/all', authMiddleware.isUserAuthorized, friendsListController.getAllRequests);

    app.get(baseUrl+'/users/allFriends', authMiddleware.isUserAuthorized, friendsListController.getAllFriends);

    app.get(baseUrl+'/users/allNonFriends', authMiddleware.isUserAuthorized, friendsListController.getAllNonFriends);

    app.post(baseUrl+'/users/removeFriend', authMiddleware.isUserAuthorized, friendsListController.removeFriend);

    app.post(baseUrl+'/users/getAvatars', friendsListController.getAvatarsByIDs);


    /* Routes related to TODO Application */    

    app.get(baseUrl+'/users/todo/lists', authMiddleware.isAuthorized, todoListController.getTodo);

    app.get(baseUrl+'/users/todo/allLists', authMiddleware.isAuthorized, todoListController.getAllLists);

    app.post(baseUrl+'/users/todo/savelist', authMiddleware.isAuthorized, todoListController.saveList);

    app.post(baseUrl+'/users/todo/lists', authMiddleware.isAuthorized, todoListController.saveTodo);

    app.post(baseUrl+'/users/todo/deletelist', authMiddleware.isAuthorized, todoListController.deleteList);


    /* Routes related to User Management */

  //  app.post(baseUrl+'/users/deleteFriends', deleteAccountController.deleteUserFriends);

    app.post(baseUrl+'/users/signup', userProfileController.signup);

    app.post(baseUrl+'/users/login', userProfileController.login);

    app.post(baseUrl+'/users/logout', authMiddleware.isAuthorized, userProfileController.logout);

    app.post(baseUrl+'/users/forgot-password', userProfileController.forgotPassword);

    app.post(baseUrl+'/users/reset-password/:userId/:authToken', authMiddleware.isUserAuthorized, userProfileController.resetPassword);
    
    app.post(baseUrl+'/users/account/delete', authMiddleware.isUserAuthorized, deleteAccountController.deleteUserAccount);

}

module.exports = {
    setRouter: setRouter
}
