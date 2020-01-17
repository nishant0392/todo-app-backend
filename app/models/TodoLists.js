const mongoose = require('mongoose')
let Schema = mongoose.Schema;

let TodosListSchema = new Schema({
    listNames: {
        type: Array,
        default: []
    },
    userId: {
        type: String,
        default: '',
    },
    lastModified: {
        type: Date,
        default: new Date()
    },
    createdOn: {
        type: Date,
        default: new Date()
    }
})

mongoose.model('TodosList', TodosListSchema);