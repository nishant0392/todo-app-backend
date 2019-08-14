const mongoose = require('mongoose')
let Schema = mongoose.Schema;

let friendsSchema = new Schema({
    userId: { type: String, default: '' },
    sentRequest: [{
        userId: { type: String, default: '' },
        userName: { type: String, default: '' }
    }],
    request: [{
        userId: { type: String, default: '' },
        userName: { type: String, default: '' }
    }],
    friendsList: [{
        friendId: { type: String, default: '' },
        friendName: { type: String, default: '' }
    }],
    totalRequest: { type: Number, default: 0 }
});

mongoose.model('FriendsList', friendsSchema);


