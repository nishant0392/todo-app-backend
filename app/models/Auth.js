const mongoose = require('mongoose')
const Schema = mongoose.Schema
const time = require('../lib/timeLib')

const AuthSchema = new Schema({
  userId: {
    type: String
  },
  authToken: {
    type: String
  },
  tokenSecret: {
    type: String
  },
  tokenGenerationTime: {
    type: Date,
    default: time.now()
  }
})

module.exports = mongoose.model('Auth', AuthSchema)