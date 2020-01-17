const mongoose = require('mongoose')
const Response = require('../lib/generateResponseLib')
const logger = require('../lib/loggerLib')
const util = require('../lib/utilityLib')
const socketLib = require('../lib/socketLib')

const FriendsList = mongoose.model('FriendsList');
const UserModel = mongoose.model('User');

let sendFriendRequest = (req, res) => {
    console.log("START sendFriendRequest()")
    if (util.isObjectEmpty(req.body)) {
        let apiResponse = Response.generate(true, 'Failed to save Sent Friend Request!! One or More Parameters are missing ', 400, null);
        res.send(apiResponse);
        return;
    }

    /* Saving Sent Request for the Sender */
    FriendsList.findOne({ userId: req.body.senderId }, (err, senderDetails) => {
        if (err) {
            console.log(err);
            logger.error("Failed to save Sent Request for the sender", "friendsListController: sendFriendRequest()", 10);
            let apiResponse = Response.generate(true, 'Failed to Save !! Some internal error occurred.', 500, err);
            res.send(apiResponse);
            return;
        }
        else if (util.isEmpty(senderDetails)) {
            let newFriendRequestSent = new FriendsList({
                userId: req.body.senderId,
                sentRequest: [{ userId: req.body.receiverId, userName: req.body.receiverName }],
                request: [],
                friendsList: [],
                totalRequest: 0
            });

            newFriendRequestSent.save((error, doc) => {
                if (error) {
                    console.log(error);
                    logger.error("Failed to save Sent Request for the sender", "friendsListController: sendFriendRequest()", 10);
                    let apiResponse = Response.generate(true, 'Failed to Save !! Some internal error occurred.', 500, error);
                    res.send(apiResponse);
                    return;
                }
                else {
                    let apiResponse = Response.generate(false, 'New Friend Request Saved!!', 200, doc);
                    console.log(apiResponse);
                }
            }) // new friend request saved
        }
        else {
            // Return if already present
            let arr = senderDetails.sentRequest;
            if (util.findObjectByProperty(arr, "userId", req.body.receiverId) !== -1) return;

            senderDetails.sentRequest.push({ userId: req.body.receiverId, userName: req.body.receiverName });

            senderDetails.save((error, doc) => {
                if (error) {
                    console.log(error);
                    logger.error("Failed to save Sent Request for the sender", "friendsListController: sendFriendRequest()", 10);
                    let apiResponse = Response.generate(true, 'Failed to Save !! Some internal error occurred.', 500, error);
                    res.send(apiResponse);
                    return;
                }
                else {
                    let apiResponse = Response.generate(false, 'New Friend Request Saved!!', 200, doc);
                    console.log(apiResponse);
                }
            }) // new friend request saved
        }
    })


    /* Saving Request for the Receiver */
    FriendsList.findOne({ userId: req.body.receiverId }, (err, receiverDetails) => {
        if (err) {
            console.log(err);
            logger.error("Failed to save Sent Request for the receiver", "friendsListController: sendFriendRequest()", 10);
            let apiResponse = Response.generate(true, 'Failed to Save !! Some internal error occurred.', 500, err);
            res.send(apiResponse);
            return;
        }
        else if (util.isEmpty(receiverDetails)) {
            let newFriendRequestReceived = new FriendsList({
                userId: req.body.receiverId,
                sentRequest: [],
                request: [{ userId: req.body.senderId, userName: req.body.senderName }],
                friendsList: [],
                totalRequest: 1
            });

            newFriendRequestReceived.save((error, doc) => {
                if (error) {
                    console.log(error);
                    logger.error("Failed to save Sent Request for the receiver", "friendsListController: sendFriendRequest()", 10);
                    let apiResponse = Response.generate(true, 'Failed to Save !! Some internal error occurred.', 500, error);
                    res.send(apiResponse);
                    return;
                }
                else {
                    let apiResponse = Response.generate(false, 'New Friend Request Saved!!', 200, doc);
                    console.log(apiResponse);
                }
            }) // new friend request saved
        }
        else {
            // Return if already present
            let arr = receiverDetails.request;
            if (util.findObjectByProperty(arr, "userId", req.body.senderId) !== -1) return;

            receiverDetails.request.push({ userId: req.body.senderId, userName: req.body.senderName });
            receiverDetails.totalRequest += 1;

            receiverDetails.save((error, doc) => {
                if (error) {
                    console.log(error);
                    logger.error("Failed to save Sent Request for the receiver", "friendsListController: sendFriendRequest()", 10);
                    let apiResponse = Response.generate(true, 'Failed to Save !! Some internal error occurred.', 500, error);
                    res.send(apiResponse);
                    return;
                }
                else {
                    let apiResponse = Response.generate(false, 'New Friend Request Saved!!', 200, doc);
                    console.log(apiResponse);
                }
            }) // new friend request saved
        }
    })

    // Calling notificationsSystem from socketLib
    socketLib.notificationsSystem(req, res, 'SEND');
    console.log("END sendFriendRequest()")

} // END saveFriendRequest()

/**
 *  Function to ACCEPT/REJECT a Friend Request
 */
let acceptOrRejectRequest = (req, res) => {
    if (util.isObjectEmpty(req.body)) {
        let apiResponse = Response.generate(true, 'Failed to accept/reject Friend Request!! One or More Parameters are missing ', 400, null);
        res.send(apiResponse);
        return;
    }

    let OPCODE = req.query.OPCODE;

    /* *****************************   START: Accept/Reject Request for the Sender  ***************************** */
    FriendsList.findOne({ userId: req.body.senderId }, (err, senderDetails) => {
        if (err) {
            console.log(err);
            logger.error("Failed to Accept/Reject Request for the sender", "friendsListController: acceptOrRejectRequest()", 10);
            let apiResponse = Response.generate(true, 'Failed to Save !! Some internal error occurred.', 500, err);
            res.send(apiResponse);
            return;
        }
        else if (util.isEmpty(senderDetails)) {
            let apiResponse = Response.generate(true, 'No User Found!!', 404, null);
            res.send(apiResponse);
            return;
        }
        else {
            /* Delete the sent Request for the Sender */
            let arr = senderDetails.toObject();
            util.spliceWithKey(arr.sentRequest, { userId: req.body.receiverId, userName: req.body.receiverName, _id: 'dummyId' });
            senderDetails.sentRequest = arr.sentRequest;

            // If NOT a friend, ADD receiver to friends List of Sender 
            if (OPCODE === 'ACCEPT' && util.findObjectByProperty(senderDetails.friendsList, "friendId", req.body.receiverId) === -1)
                senderDetails.friendsList.push({ friendId: req.body.receiverId, friendName: req.body.receiverName });

            senderDetails.save((error, doc) => {
                if (error) {
                    console.log(error);
                    logger.error("Failed to add receiver to friends List of the Sender", "friendsListController: acceptOrRejectRequest()", 10);
                    let apiResponse = Response.generate(true, 'Failed to Save !! Some internal error occurred.', 500, error);
                    res.send(apiResponse);
                    return;
                }
                else {
                    console.log("saved doc="); console.log(doc)
                    logger.info('Receiver added to friends List of the Sender!!', "friendsListController: acceptOrRejectRequest()", 10);
                }
            }); // Changes saved for Sender
        }
    })
    /* *****************************   END: Accept/Reject Request for the Sender  ***************************** */

    /* *****************************   START: Accept/Reject Request for the Receiver  ************************* */

    /* First Delete the sent Request for the Receiver and then Add to friends List of Receiver */
    FriendsList.findOne({ userId: req.body.receiverId }, (err, receiverDetails) => {
        if (err) {
            console.log(err);
            logger.error("Failed to reject Request for the receiver", "friendsListController: acceptOrRejectRequest()", 10);
            let apiResponse = Response.generate(true, 'Failed to Save !! Some internal error occurred.', 500, err);
            res.send(apiResponse);
            return;
        }
        else if (util.isEmpty(receiverDetails)) {
            let apiResponse = Response.generate(true, 'No User Found!!', 404, null);
            res.send(apiResponse);
            return;
        }
        else {
            /* Delete the sent Request for the Receiver */
            let arr = receiverDetails.toObject();
            util.spliceWithKey(arr.request, { userId: req.body.senderId, userName: req.body.senderName, _id: 'dummyId' });
            receiverDetails.request = arr.request;

            // If NOT a friend, ADD sender to friends List of Receiver 
            if (OPCODE === 'ACCEPT' && util.findObjectByProperty(receiverDetails.friendsList, "friendId", req.body.senderId) === -1)
                receiverDetails.friendsList.push({ friendId: req.body.senderId, friendName: req.body.senderName });

            // Save the changes to the document
            receiverDetails.save((error, doc) => {
                if (error) {
                    console.log(error);
                    logger.error("Failed to add sender to friends List of the Receiver", "friendsListController: acceptOrRejectRequest()", 10);
                    let apiResponse = Response.generate(true, 'Failed to Process Request !! Some internal error occurred.', 500, error);
                    res.send(apiResponse);
                    return;
                }
                else {
                    logger.info('Sender added to friends List of the Receiver!!', "friendsListController: acceptOrRejectRequest()", 10);
                }
            }); // Changes Saved for Receiver
        }
    });
    /* *****************************   END: Accept/Reject Request for the Receiver  ************************* */

    /* Calling notificationsSystem() from socketLib */
    socketLib.notificationsSystem(req, res, OPCODE);

}  // END acceptOrRejectRequest()

/* Get all the friend requests for a User */
let getAllRequests = (req, res) => {
    if (!req.query.userId) {
        let apiResponse = Response.generate(true, 'Failed to retrieve Requests!! userId parameter is missing ', 400, null);
        res.send(apiResponse);
        return;
    }

    FriendsList.findOne({ userId: req.query.userId }, (err, userDetails) => {
        if (err) {
            console.log(err);
            logger.error("Failed to retrieve Requests", "friendsListController: getAllRequests()", 10);
            let apiResponse = Response.generate(true, 'Failed to Retrieve Requests !! Some internal error occurred.', 500, err);
            res.send(apiResponse);
            return;
        }
        else if (util.isEmpty(userDetails)) {
            let apiResponse = Response.generate(true, 'No Friends Yet!!', 404, null);
            res.send(apiResponse);
            return;
        }
        else {
            let requests = userDetails.request;
            if (requests.length === 0) {
                let apiResponse = Response.generate(true, 'No Requests!!', 404, null);
                res.send(apiResponse);
                return;
            }
            else {
                let apiResponse = Response.generate(false, 'List of Requests!!', 200, requests);
                res.send(apiResponse);
            }
        }
    })
}

/**
 * function to get all friends for a User.
 */
let getAllFriends = (req, res) => {

    if (!req.query.userId) {
        let apiResponse = Response.generate(true, 'Failed to retrieve List of Users!! userId parameter is missing ', 400, null);
        res.send(apiResponse);
        return;
    }

    FriendsList.findOne({ userId: req.query.userId }, (err, result) => {
        if (err) {
            console.log(err);
            logger.error("Failed to retrieve Users", "friendsListController: getAllFriends()", 10);
            let apiResponse = Response.generate(true, 'Failed to Retrieve Users !! Some internal error occurred.', 500, null);
            res.send(apiResponse);
            return;
        }
        else if (util.isEmpty(result)) {
            let apiResponse = Response.generate(true, 'No User Found', 404, null);
            res.send(apiResponse);
            return;
        }
        else {
            let apiResponse = Response.generate(false, 'List of all friends', 200, result.friendsList);
            res.send(apiResponse);
        }
    })

} // END getAllFriends()

/**
 * function to get all other Users excluding friends.
 */
let getAllNonFriends = (req, res) => {

    if (!req.query.userId) {
        let apiResponse = Response.generate(true, 'Failed to retrieve List of Users!! userId parameter is missing ', 400, null);
        res.send(apiResponse);
        return;
    }

    let friends = [];
    let sentRequests = [];
    FriendsList.findOne({ userId: req.query.userId }, (err, result) => {
        if (err) {
            console.log(err);
            logger.error("Failed to retrieve Users", "friendsListController: getAllNonFriends()", 10);
            let apiResponse = Response.generate(true, 'Failed to Retrieve Users !! Some internal error occurred.', 500, null);
            res.send(apiResponse);
            return;
        }
        else if (util.isEmpty(result)) {
            console.log("No Friends Found");
        }
        else {
            friends = result.friendsList;
            sentRequests = result.sentRequest;
        }
    })


    UserModel.find().exec()
        .then((allUsers) => {
            let data = [];
            for (let i = 0; i < allUsers.length; i++) {
                let tempId = allUsers[i].userId;
                let tempName = allUsers[i].firstName + " " + allUsers[i].lastName;
                let avatarPath = allUsers[i].avatarPath;
                if (tempId !== req.query.userId && util.findObjectByProperty(friends, 'friendId', tempId) === -1) {
                    if (util.findObjectByProperty(sentRequests, 'userId', tempId) === -1)
                        data.push({ 'userId': tempId, 'userName': tempName, 'avatarPath': avatarPath, status: 'enabled' });
                    else
                        data.push({ 'userId': tempId, 'userName': tempName, 'avatarPath': avatarPath, status: 'disabled' });
                }
            }
            let apiResponse = Response.generate(false, 'List of all Users excluding friends', 200, data);
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err)
            logger.error(err.message, 'friendsListController: getAllNonFriends', 10)
            let apiResponse = Response.generate(true, `Error occurred: ${err.message}`, 500, null)
            res.send(apiResponse)
        })
}

let removeFriendById = (userId, friendId) => {

    return new Promise((resolve, reject) => {
        let apiResponse = {};

        FriendsList.findOne({ userId: userId }, (err, userDetails) => {
            if (err) {
                console.log(err);
                logger.error("Failed to remove friend !", "friendsListController: removeFriend()", 10);
                apiResponse = Response.generate(true, 'Failed to remove your friend !! Some internal error occurred.', 500, null);
                reject(apiResponse)
            }
            else if (util.isEmpty(userDetails)) {
                apiResponse = Response.generate(true, 'No User Found', 404, null);
                reject(apiResponse)
            }
            else {
                /* Delete the friend from User's friendsList */
                let arr = userDetails.toObject();
                util.spliceWithKeyAndProperty(arr.friendsList, friendId, 'friendId');
                userDetails.friendsList = arr.friendsList;

                // Save the changes to the document
                userDetails.save((error, doc) => {
                    if (error) {
                        console.log(error);
                        logger.error("Failed to save", "friendsListController: removeFriend()", 10);
                        apiResponse = Response.generate(true, 'Failed during save at database !! Some internal error occurred.', 500, null);
                        reject(apiResponse)
                    }
                    else {
                        logger.info('Friend removed from User List !!', "friendsListController: removeFriend()", 10);
                        apiResponse = Response.generate(false, 'Friend removed from User List !!', 200, doc);
                        resolve(apiResponse)
                    }
                }); // Changes Saved for User 
            }
        })
    }) // END Promise 

} // END removeFriendById()

/**
 * function to remove a friend.
 */
let removeFriend = (req, res) => {

    if (util.isObjectEmpty(req.body)) {
        let apiResponse = Response.generate(true, 'Failed to remove !! One or more parameters are missing. ', 400, null);
        res.send(apiResponse);
        return;
    }

    removeFriendById(req.body.userId, req.body.friendId)
        .then(removeFriendById(req.body.friendId, req.body.userId))
        .then((resolve) => {
            console.log("resolve:", resolve)
            socketLib.notificationsSystem(req, res, 'REMOVE_FRIEND');
        }, (reject) => {
            let apiResponse = Response.generate(true, 'Your Friend could not be removed !! Some error occurred.', 500, null);
            res.send(apiResponse);
        })
        .catch((err) => {
            console.log(err)
            logger.error("Failed to remove friend", "friendsListController: removeFriend()", 10);
            let apiResponse = Response.generate(true, 'Your Friend could not be removed !! Some error occurred.', 500, null);
            res.send(apiResponse);
        })

}  // END removeFriend()


let getAvatarsByIDs = (req, res) => {
    
    if(!req.body.listOfIDs) {
         let apiResponse = Response.generate(true, 'Failed to remove !! One or more parameters are missing. ', 400, null);
        res.send(apiResponse);
        return; 
    }

    let listOfIDs = JSON.parse(req.body.listOfIDs);
    
     UserModel.find().exec()
        .then((allUsers) => {
            let data = [];
            for (let i = 0; i < allUsers.length; i++) {
                let tempId = allUsers[i].userId;
                let tempName = allUsers[i].firstName + " " + allUsers[i].lastName;
                let avatarPath = allUsers[i].avatarPath;
                if (util.findObjectByProperty(listOfIDs, 'userId', tempId) !== -1) 
                    data.push({ 'userId': tempId, 'userName': tempName, 'avatarPath': avatarPath });
                else if (util.findObjectByProperty(listOfIDs, 'friendId', tempId) !== -1) 
                    data.push({ 'friendId': tempId, 'friendName': tempName, 'avatarPath': avatarPath });
            }

            let apiResponse = Response.generate(false, 'List of avatarPaths', 200, data);
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log(err)
            logger.error(err.message, 'friendsListController: getAvatarsByIDs', 10)
            let apiResponse = Response.generate(true, `Error occurred: ${err.message}`, 500, null)
            res.send(apiResponse)
        })
}

module.exports = {
    sendFriendRequest: sendFriendRequest,
    acceptOrRejectRequest: acceptOrRejectRequest,
    getAllRequests: getAllRequests,
    getAllFriends: getAllFriends,
    getAllNonFriends: getAllNonFriends,
    removeFriendById: removeFriendById,
    removeFriend: removeFriend,
    getAvatarsByIDs: getAvatarsByIDs
}
