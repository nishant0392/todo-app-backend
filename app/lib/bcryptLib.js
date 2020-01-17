const bcrypt = require('bcryptjs');
const saltRounds = 10;

let hashPasswordSync = (plainTextPassword) => {
    let salt = bcrypt.genSaltSync(saltRounds);
    let hash = bcrypt.hashSync(plainTextPassword, salt);
    return hash;
}

let comparePassword = (plainTextPassword, hashPassword, cb) => {
    bcrypt.compare(plainTextPassword, hashPassword, (err, result) => {
        if (err) {
            console.log(err.message)
            // logger.error(err.message, 'Comparison Error', 5)
            cb(err, null)
        } else {
            cb(null, result)
        }
    })
}

let comparePasswordSync = (plainTextPassword, hashPassword) => {
    return bcrypt.compareSync(plainTextPassword, hashPassword);
}

module.exports = {
    hashPassword: hashPasswordSync,
    comparePassword: comparePassword,
    comparePasswordSync: comparePasswordSync
}
