const mongoose = require('mongoose')
const logger = require('./loggerLib')
const Response = require('./generateResponseLib')
const util = require('./utilityLib')
const fs = require('fs')

//Importing the models here 
const UserModel = mongoose.model('User')

let putOrGetFilePath = (req, res, request_type) => {

    if (!req.query.userId) {
        let apiResponse = Response.generate(true,
            'File/Image Retrieval Unsuccessful !! UserId field missing.', 400, null);
        res.send(apiResponse); return;
    }

    UserModel.findOne({ userId: req.query.userId }, (err, userDetails) => {

        let tempMsg = request_type === 'PUT' ? 'Upload' : 'Retrieval';

        if (err) {
            logger.error(err.message, 'uploadFile: putOrGetFilePath()', 10)
            let apiResponse = Response.generate(true, `File/Image ${tempMsg} Unsuccessful !! Error occurred while querying`, 500, null)
            res.send(apiResponse)
        }
        else if (util.isEmpty(userDetails)) {
            let apiResponse = Response.generate(true, `File/Image ${tempMsg} Unsuccessful !! No User found`, 404, null)
            res.send(apiResponse)
        }
        else {
            if (request_type === 'GET') {

                let responseBody = {
                    userId: userDetails.userId,
                    avatarPath: userDetails.avatarPath,

                };
        
                let apiResponse = Response.generate(false, 'File/Image Path Retrieved !!', 200, responseBody)
                res.send(apiResponse)
                return;
            }

            userDetails.avatarPath = req.file.path;
            userDetails.save((error, newUserDetails) => {
                if (error) {
                    console.log(error)
                    logger.error(error.message, 'uploadFile: putFilePath()', 10)
                    let apiResponse = Response.generate(true, 'Failed To update Path', 500, null)
                    res.send(apiResponse)
                }
                else {
                    let responseBody = {
                        userId: newUserDetails.userId,
                        avatarPath: newUserDetails.avatarPath
                    };
                    let apiResponse = Response.generate(false, 'File/Image Uploaded Successfully !!', 200, responseBody)
                    res.send(apiResponse)
                }
            })
        }
    })

}  // END putFilePath()


/**
 * Function to upload a File
 * @param {*} app 
 */
let uploadFile = (app) => {

    const multer = require('multer');

    const storage = multer.diskStorage({
        // destination is wrt where 'app' is located(here it's index.js)
        destination: function (req, file, cb) {
            console.log('file = ', file)
            cb(null, './userAvatars')
        },
        filename: function (req, file, cb) {
            cb(null, new Date().valueOf() + file.originalname)
        }
    });

    let isFormatSupported = true;
    const fileFilter = (req, file, cb) => {
        // exclude a file
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png')
            cb(null, true);
        else {
            console.log('File Format not supported')
            isFormatSupported = false;
            cb(null, false);
        }
    }

    const upload = multer({
        storage: storage,
        limits: {
            fileSize: 1024 * 1024 * 2
        },
        fileFilter: fileFilter
    });

    /* Upload User Avatar */
    app.post('/api/v1/users/uploadAvatar', upload.single('avatar'), function (req, res) {
        console.log('Uploaded file:', req.file)
        console.log('req.body:', req.body)
        console.log('req.query:', req.query)
        if (isFormatSupported === false) {
            let apiResponse = Response.generate(true,
                'File/Image Upload Unsuccessful !! File Format not supported.', 400, null);
            res.send(apiResponse)
        }

        else if (req.file === undefined || req.file === null) {
            let apiResponse = Response.generate(true,
                'File/Image Upload Unsuccessful !! Some Error Occurred.', 500, null);
            res.send(apiResponse)
        }

        else
            putOrGetFilePath(req, res, 'PUT')
    });

    /* Get User Avatar */
    app.get('/api/v1/users/getAvatar', function (req, res) {

        putOrGetFilePath(req, res, 'GET')
    })

}

module.exports = {
    uploadFile: uploadFile
}
