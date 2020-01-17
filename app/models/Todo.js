const mongoose = require('mongoose')
let Schema = mongoose.Schema;

let TodoSchema = new Schema({
    listName: {
        type: String,
        default: ""
    },
    userId: {
        type: String,
        default: '',
    },
    TodoList: {
        type: Array,
        default: []
    },
    createdOn: {
        type: Date,
        default: new Date()
    }
})

mongoose.model('Todo', TodoSchema);