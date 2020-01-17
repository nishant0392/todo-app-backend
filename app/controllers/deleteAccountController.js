const mongoose = require('mongoose')
const Response = require('../lib/generateResponseLib')
const util = require('../lib/utilityLib')
const bcryptLib = require('../lib/bcryptLib')
const logger = require('../lib/loggerLib')
const friendsListController = require('../controllers/friendsListController')

//Importing the models here 
const UserModel = mongoose.model('User')
const AuthModel = mongoose.model('Auth')
const TodoModel = mongoose.model('Todo')
const TodosListModel = mongoose.model('TodosList')
const FriendsListModel = mongoose.model('FriendsList')

/* Get all friends of a User */
let getAllFriends = (userId) => {
    return new Promise((resolve, reject) => {
        FriendsListModel.findOne({ userId: userId }, (err, result) => {
            if (err) {
                console.log(err);
                logger.error("Failed to retrieve Users", "deleteAccountController: getAllFriends()", 10);
                let apiResponse = Response.generate(true, 'Failed to Retrieve Users !! Some internal error occurred.', 500, null);
                reject(apiResponse);
            }
            else if (util.isEmpty(result)) {
                let apiResponse = Response.generate(true, 'No User Found', 404, null);
                reject(apiResponse)
            }
            else {
                let apiResponse = Response.generate(false, 'List of all friends', 200, result.friendsList);
                console.log('friendsList:', apiResponse.data)
                resolve(apiResponse.data);
            }
        })
    })

} // END getAllFriends()

/*
** Function to Delete User Friends
*/
let deleteUserFriends = (req, res) => {

    let removeSelfFromFriendsList = () => {
        return new Promise((resolve, reject) => {

            getAllFriends(req.body.userId)
                .then((friendsList) => {
                    console.log("friendsList received:", friendsList)
                    for (let i = 0; i < friendsList.length; i++) {
                        friendsListController.removeFriendById(friendsList[i].friendId, req.body.userId)
                            .then((resolveVal) => {
                                console.log('Removed friend: ' + friendsList[i].friendName)
                            },
                                (rejectVal) => {
                                    console.log('Some Error occurred while removing friend: ' + friendsList[i].friendName)
                                    reject(rejectVal)
                                })
                    } // END for loop
                    resolve(friendsList)
                },
                    (rejectionResp) => {
                        console.log("getAllFriends() -> Reason of rejection:", rejectionResp)
                        reject(rejectionResp)
                    }
                )
        });

    } // END removeSelfFromFriendsList()

    let deleteMyFriendsList = () => {
        return new Promise((resolve, reject) => {
            console.log("Inside deleteMyFriendsList: About to delete friends of userId = " + req.body.userId)
            FriendsListModel.deleteOne({ userId: req.body.userId }, (err) => {
                if (err) {
                    console.log(err);
                    logger.error('Deletion Failed!! Had Queried to database', "deleteAccountController: deleteUserFriends()", 10);
                    let apiResponse = Response.generate(true, 'Deletion Failed!!', 500, null);
                    reject(apiResponse)
                }
                else {
                    let apiResponse = Response.generate(false, 'User Friends Deletion Successful!!', 200, null);
                    resolve(apiResponse)
                }
            });
        }) // END Promise
    } // END deleteMyFriendsList()

    
    removeSelfFromFriendsList()
        .then(deleteMyFriendsList)
        .then((resolve) => {
            let apiResponse = Response.generate(false, 'User Friends Deletion Successful!!', 200, null);
            console.log('apiResponse:', apiResponse)
            return apiResponse;
        },(error) => {
            console.log('Inside deleteUserFriends(main function) - Error while deleting friends', error)
            let apiResponse = Response.generate(true, 'Could not delete User Friends', 500, error);
            return apiResponse;
        })

} // deleteUserFriends()

/*
** function to delete User Account
*/
let deleteUserAccount = (req, res) => {

    let validatePassword = () => {
        return new Promise((resolve, reject) => {

            if (util.isEmpty(req.body)) {
                let apiResponse = Response.generate(true, 'Deletion Failed !! One or More Parameters are missing!!', 400, null);
                reject(apiResponse);
            }
            else {
                UserModel.findOne({ userId: req.body.userId }, (err, userDetails) => {
                    if (err) {
                        console.log(err);
                        logger.error("Error while querying to database", "deleteAccountController: deleteAccount", 5)
                        let apiResponse = Response.generate(true, 'Some internal error occurred!!', 500, null);
                        res.send(apiResponse);
                        reject(apiResponse);
                    }
                    else if (util.isEmpty(userDetails)) {
                        logger.error('No User Found!!', "deleteAccountController: deleteAccount", 5)
                        let apiResponse = Response.generate(true, "No User Found.", 404, null);
                        res.send(apiResponse);
                        reject(apiResponse);
                    }
                    else {
                        bcryptLib.comparePassword(req.body.password, userDetails.password, (error, isMatched) => {
                            if (error) {
                                logger.error("Error occurred while comparing password", "deleteAccountController: deleteAccount()", 10);
                                let apiResponse = Response.generate(true, 'Password Validation Failed !! Some error occurred. Please try again or later. ', 500, null);
                                res.send(apiResponse);
                                reject(apiResponse);
                            }
                            else if (isMatched) {
                                let userDetailsObj = userDetails.toObject();
                                delete userDetailsObj.password;
                                delete userDetailsObj.__v;
                                delete userDetailsObj._id;
                                delete userDetailsObj.createdOn;
                                logger.info("Password validation successful.", "deleteAccountController: deleteAccount()", 10);
                                resolve(userDetailsObj);
                            }
                            else {
                                logger.info("Password did not match !!", "deleteAccountController: deleteAccount()", 10);
                                let apiResponse = Response.generate(true, 'The password you entered was incorrect. Please try again. ', 404, null);
                                res.send(apiResponse);
                                reject(apiResponse);
                            }
                        }) // END comparePassword()
                    }
                })
            }
        }) // END Promise
    } // END validatePassword()

    let deleteUserInfo = () => {
        return new Promise((resolve, reject) => {
            UserModel.deleteOne({ userId: req.body.userId }, (err) => {
                if (err) {
                    console.log(err);
                    logger.error('Deletion Failed!! Had Queried to database', "deleteAccountController: deleteAccount()", 10);
                    let apiResponse = Response.generate(true, 'Deletion Failed!!', 500, null);
                    res.send(apiResponse);
                    reject(apiResponse)
                }
                else {
                    let apiResponse = Response.generate(false, 'User Info Deletion Successful!!', 200, null);
                    resolve(apiResponse)
                }
            });
        }) // END Promise
    } // END deleteUserInfo()

    let deleteUserAuth = () => {
        return new Promise((resolve, reject) => {
            AuthModel.deleteOne({ userId: req.body.userId }, (err) => {
                if (err) {
                    console.log(err);
                    logger.error('Deletion Failed!! Had Queried to database', "deleteAccountController: deleteUserAuth()", 10);
                    let apiResponse = Response.generate(true, 'Deletion Failed!!', 500, null);
                    res.send(apiResponse);
                    reject(apiResponse)
                }
                else {
                    let apiResponse = Response.generate(false, 'User Auth Deletion Successful!!', 200, null);
                    resolve(apiResponse)
                }
            });
        }) // END Promise
    } // END deleteUserAuth()


    let deleteTodosLists = () => {
        return new Promise((resolve, reject) => {
            TodosListModel.deleteOne({ userId: req.body.userId }, (err) => {
                if (err) {
                    console.log(err);
                    logger.error('Deletion Failed!! Had Queried to database', "deleteAccountController: deleteTodosLists()", 10);
                    let apiResponse = Response.generate(true, 'Deletion Failed!!', 500, null);
                    res.send(apiResponse);
                    reject(apiResponse)
                }
                else {
                    let apiResponse = Response.generate(false, 'User Todos Lists Deletion Successful!!', 200, null);
                    resolve(apiResponse)
                }
            });
        }) // END Promise
    } // END deleteTodosLists()

    let deleteTodos = () => {
        return new Promise((resolve, reject) => {
            TodoModel.deleteMany({ userId: req.body.userId }, (err) => {
                if (err) {
                    console.log(err);
                    logger.error('Deletion Failed!! Had Queried to database', "deleteAccountController: deleteTodos()", 10);
                    let apiResponse = Response.generate(true, 'Deletion Failed!!', 500, null);
                    res.send(apiResponse);
                    reject(apiResponse)
                }
                else {
                    let apiResponse = Response.generate(false, 'User Todos Deletion Successful!!', 200, null);
                    resolve(apiResponse)
                }
            });
        }) // END Promise
    } // END deleteTodos()

    validatePassword()
        .then(deleteUserInfo)
        .then(deleteUserAuth)
        .then(deleteTodosLists)
        .then(deleteTodos)
        .then(deleteUserFriends(req, res))
        .then((resolve) => {
            logger.info('User Account Deleted Successfully !!', 'deleteAccountController: deleteUserAccount()', 10)
            let apiResponse = Response.generate(false, 'User Account Deleted Successfully !!', 200, null)
            res.send(resolve);
        })
        .catch((error) => {
            logger.error('User Account could not be deleted !!', 'deleteAccountController: deleteUserAccount()', 10)
            console.log(error)
        })
} // END deleteUserAccount()

module.exports = {
    deleteUserAccount: deleteUserAccount,
    deleteUserFriends: deleteUserFriends
}