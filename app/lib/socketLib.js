const socketIO = require('socket.io')
const JWT = require('./tokenLib')
const logger = require('./loggerLib')
const Response = require('./generateResponseLib')

let global_HTTP_Server;
let myIO;

let set_http_server = (HTTP_Server) => {
    global_HTTP_Server = HTTP_Server;
    socketService();
}

let get_http_server = () => {
    return global_HTTP_Server;
}

let socketService = () => {
    let allOnlineUsers = [];

    let io = socketIO.listen(global_HTTP_Server);

    myIO = io.of('');

    myIO.on("connection", (socket) => {
        console.log("On connection --> Emitting verify-user event");

        socket.emit("verify-user");

        // Code to verify the user and make him online
        socket.on("set-user", (authToken) => {
            JWT.verifyClaimWithoutSecret(authToken, (err, decoded) => {
                if (err) {
                    socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' })
                }
                else {
                    console.log("User verified --> Setting details");
                    let currentUser = decoded.data;
                    // Setting socket user id 
                    socket.userId = currentUser.userId
                    let fullName = `${currentUser.firstName} ${currentUser.lastName}`
                    console.log(`${fullName} is online`);
                }
            })
        }) // END set-user event

    }) // END socket connection

}  // END socketService()


/* Notifications using SOCKET.IO */

let notificationsSystem = (req, res, OPCODE) => {
    console.log("----START notifications----")

    switch (OPCODE) {
        case 'SEND': {
            console.log("After saving sent Request --> Emitting receiverId");
            myIO.emit(req.body.receiverId, { opcode: 'REQUEST', message: 'New Friend Request', senderId: req.body.senderId, senderName: req.body.senderName });
            let apiResponse = Response.generate(false, 'Friend Request Sent !!', 200, null)
            res.send(apiResponse);
            break;
        }
        case 'ACCEPT': {
            console.log("After saving accepted Request --> Emitting senderId");
            myIO.emit(req.body.senderId, { opcode: 'ACCEPTED', message: 'Friend Request Accepted', receiverId: req.body.receiverId, receiverName: req.body.receiverName });
            let apiResponse = Response.generate(false, 'Friend Request Accepted !!', 200, null)
            res.send(apiResponse);
            break;
        }
        case 'REJECT': {
            console.log("After rejecting sent Request --> Emitting senderId");
            myIO.emit(req.body.senderId, { opcode: 'REJECTED', message: 'Friend Request Rejected', receiverId: req.body.receiverId, receiverName: req.body.receiverName });
            let apiResponse = Response.generate(false, 'Friend Request Rejected !!', 200, null)
            res.send(apiResponse);
            break;
        }
        case 'REMOVE_FRIEND': {
            console.log("After removing Friend --> Emitting friendId");
            myIO.emit(req.body.friendId, { opcode: 'REMOVED', message: 'Friend Removed', friendId: req.body.userId, friendName: req.body.userName });
            let apiResponse = Response.generate(false, 'Your Friend has been removed !!', 200, null);
            res.send(apiResponse);
            break;
        }
        case 'SAVE_TODO': {
            console.log("After saving Friend TODO Item --> Emitting friendId");
            myIO.emit(req.body.userId, { opcode: 'TODO_MODIFIED', message: 'TODO modified by a Friend', friendId: req.body.userId, friendName: req.body.userName, listName: req.body.listName });
            break;
        }
        case 'SAVE_LIST': {
            console.log("After saving Friend TODO Lists --> Emitting friendId");
            myIO.emit(req.body.userId, { opcode: 'TODOLISTS_MODIFIED', message: 'TODO Lists modified by a Friend', friendId: req.body.userId, friendName: req.body.userName });
            break;
        }
        default: {
            logger.error('Invalid OPCODE', 'socketLib: notificationsSystem', 5)
            throw new Error('Invalid OPCODE');
        }
    }

    console.log("----END notifications----")
} // END notificationsSystem()


module.exports = {
    set_http_server: set_http_server,
    get_http_server: get_http_server,
    notificationsSystem: notificationsSystem
}