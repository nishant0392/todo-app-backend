const mongoose = require('mongoose')
const shortid = require('shortid')
const Response = require('../lib/generateResponseLib')
const util = require('../lib/utilityLib')
const bcryptLib = require('../lib/bcryptLib')
const Mailer = require('../lib/sendMailLib')
const logger = require('../lib/loggerLib')
const time = require('../lib/timeLib')
const JWT = require('../lib/tokenLib')

//Importing the models here 
const UserModel = mongoose.model('User')
const AuthModel = mongoose.model('Auth')


/**
 * function for sign-up.
 */
let signup = (req, res) => {

    let validateUserInput = () => {
        return new Promise((resolve, reject) => {
            console.log(req.body)
            if (util.isObjectEmpty(req.body)) {
                let apiResponse = Response.generate(true, 'Signup Failed!! One or More Parameters were missing.', 400, null);
                res.send(apiResponse);
                reject(apiResponse);
            }

            else if (util.isEmailValid(req.body.email)) {
                if (!util.isPasswordValid(req.body.password)) {
                    let apiResponse = Response.generate(true, 'Signup Failed!! Invalid Password.', 400, null);
                    res.send(apiResponse);
                    reject(apiResponse);
                }
                else
                    resolve(req);
            }

            else {
                let apiResponse = Response.generate(true, 'Signup Failed!! Invalid Email address.', 400, null);
                res.send(apiResponse);
                reject(apiResponse);
            }
        })
    }

    let createUserAccount = () => {
        return new Promise((resolve, reject) => {
            UserModel.findOne({ email: req.body.email }, (err, document) => {
                if (err) {
                    logger.error('Error occurred at database.', 'userProfileController: createUserAccount()', 10);
                    let apiResponse = Response.generate(true, 'Failed to create User account!! Some internal error occurred.', 500, err);
                    res.send(apiResponse);
                    reject(apiResponse);
                }
                else if (!util.isEmpty(document)) {
                    let apiResponse = Response.generate(true, 'Signup Failed!! User already exists with this Email.', 403, null);
                    res.send(apiResponse);
                    reject(apiResponse);
                }
                else {
                    let newUser = new UserModel({

                        userId: shortid.generate(),
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        countryCode: req.body.countryCode,
                        mobileNumber: req.body.mobile,
                        email: req.body.email,
                        password: bcryptLib.hashPassword(req.body.password),
                        createdOn: time.now()

                    }) // end new User model

                    newUser.save((error, userAccount) => {
                        if (error) {
                            logger.error('Error occurred at database.', 'userProfileController: createUserAccount()', 10);
                            let apiResponse = Response.generate(true, 'Failed to create User account!! Some internal error occurred.', 500, err);
                            res.send(apiResponse);
                            reject(apiResponse);
                        } else {
                            let userAccountObj = userAccount.toObject();
                            delete userAccountObj.password;
                            delete userAccountObj.__v;
                            delete userAccountObj._id;
                            let apiResponse = Response.generate(false, 'Signup Successful!!', 200, userAccountObj);
                            res.send(apiResponse);
                            resolve(userAccountObj);
                        }
                    }) // saved new User in database
                }
            })
        })
    }

    validateUserInput().then(createUserAccount)
        .then((resolve) => {
            logger.info('New User Account Created.', 'userProfileController: createUserAccount()', 10);
            logger.info(resolve, 'Resolve from createUserAccount()', 5)
        })
        .catch((err) => {
            logger.error(err, 'userProfileController: createUserAccount()', 10);
        })
} // end signup()


/**
 * function for login.
 */
let login = (req, res) => {

    let validateLogin = () => {
        return new Promise((resolve, reject) => {
            if (util.isObjectEmpty(req.body)) {
                let apiResponse = Response.generate(true, 'Login Failed!! One or More Parameters were missing.', 400, null);
                res.send(apiResponse);
                reject(apiResponse);
            }
            else {
                UserModel.findOne({ email: req.body.email }, (err, userDetails) => {
                    if (err) {
                        logger.error('Error occurred while retrieving from database.', 'userProfileController: validateLogin()', 10);
                        let apiResponse = Response.generate(true, 'Failed to retrieve User details!! Some internal error occurred.', 500, err);
                        res.send(apiResponse);
                        reject(apiResponse);

                    } else if (util.isEmpty(userDetails)) {
                        logger.error("No User Found", "userProfileController: validateLogin()", 7);
                        let apiResponse = Response.generate(true, 'The email or password you entered was incorrect. Please try again. ', 404, null);
                        res.send(apiResponse);
                        reject(apiResponse);
                    } else {
                        console.log(userDetails);
                        bcryptLib.comparePassword(req.body.password, userDetails.password, (error, isMatched) => {
                            if (error) {
                                logger.error("Error occurred while comparing password", "userProfileController: validateLogin()", 10);
                                let apiResponse = Response.generate(true, 'Login Failed !! Some error occurred. Please try again or later. ', 500, null);
                                res.send(apiResponse);
                                reject(apiResponse);
                            }
                            else if (isMatched) {
                                let userDetailsObj = userDetails.toObject();
                                delete userDetailsObj.password;
                                delete userDetailsObj.__v;
                                delete userDetailsObj._id;
                                delete userDetailsObj.createdOn;
                                logger.info("Login validation successful.", "userProfileController: validateLogin()", 10);
                                //   let apiResponse = Response.generate(false, 'Login Successful!!', 200, userDetailsObj);
                                //   res.send(apiResponse);
                                resolve(userDetailsObj);
                            }
                            else {
                                logger.info("Invalid Login !!", "userProfileController: validateLogin()", 10);
                                let apiResponse = Response.generate(true, 'The email or password you entered was incorrect. Please try again. ', 404, null);
                                res.send(apiResponse);
                                reject(apiResponse);
                            }
                        })
                    }
                })
            }
        })
    }

    let generateToken = (userDetails) => {
        console.log("generate token");
        return new Promise((resolve, reject) => {
            JWT.generateToken(userDetails, (err, tokenDetails) => {
                if (err) {
                    console.log(err)
                    let apiResponse = Response.generate(true, 'Failed To Generate Token', 500, null);
                    reject(apiResponse)
                } else {
                    tokenDetails.userId = userDetails.userId;
                    tokenDetails.userDetails = userDetails;
                    resolve(tokenDetails)
                }
            })
        })
    } // END generateToken()

    let saveToken = (tokenDetails) => {
        console.log("save token");
        return new Promise((resolve, reject) => {
            AuthModel.findOne({ userId: tokenDetails.userId }, (err, retrievedTokenDetails) => {
                if (err) {
                    logger.error(err.message, 'userProfileController: saveToken()', 10)
                    let apiResponse = Response.generate(true, 'Failed To Generate Token', 500, null)
                    reject(apiResponse)
                }
                else if (util.isEmpty(retrievedTokenDetails)) {
                    let newAuthToken = new AuthModel({
                        userId: tokenDetails.userId,
                        authToken: tokenDetails.token,
                        tokenSecret: tokenDetails.tokenSecret,
                        tokenGenerationTime: time.now()
                    })
                    newAuthToken.save((err, newTokenDetails) => {
                        if (err) {
                            console.log(err)
                            logger.error(err.message, 'userProfileController: saveToken()', 10)
                            let apiResponse = Response.generate(true, 'Failed To Generate Token', 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                }
                else {
                    retrievedTokenDetails.authToken = tokenDetails.token
                    retrievedTokenDetails.tokenSecret = tokenDetails.tokenSecret
                    retrievedTokenDetails.tokenGenerationTime = time.now()
                    retrievedTokenDetails.save((err, newTokenDetails) => {
                        if (err) {
                            console.log(err)
                            logger.error(err.message, 'userProfileController: saveToken()', 10)
                            let apiResponse = Response.generate(true, 'Failed To Generate Token', 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            };
                            resolve(responseBody)
                        }
                    })
                }
            })
        })
    } // END saveToken()

    validateLogin()
        .then(generateToken)
        .then(saveToken)
        .then((resolve) => {
            let apiResponse = Response.generate(false, 'Login Successful', 200, resolve);
            res.status(200)
            res.send(apiResponse)
        })
        .catch((err) => {
            console.log("Errorhandler:");
            console.log(err);
            res.status(err.status);
        })

} // end login()

/**
 * function for Password Reset Mail.
 */
let forgotPassword = (req, res) => {

    // function for generating a AUTHTOKEN
    let generateToken = (userDetails) => {
        console.log("generate token");
        return new Promise((resolve, reject) => {
            JWT.generateToken(userDetails, (err, tokenDetails) => {
                if (err) {
                    console.log(err)
                    let apiResponse = Response.generate(true, 'Failed To Generate Token', 500, null);
                    reject(apiResponse)
                } else {
                    tokenDetails.userId = userDetails.userId;
                    tokenDetails.userDetails = userDetails;
                    resolve(tokenDetails)
                }
            })
        })
    } // END generateToken()

    // function for saving the AUTHTOKEN
    let saveToken = (tokenDetails) => {
        console.log("save token");
        return new Promise((resolve, reject) => {
            AuthModel.findOne({ userId: tokenDetails.userId }, (err, retrievedTokenDetails) => {
                if (err) {
                    logger.error(err.message, 'userProfileController: saveToken()', 10)
                    let apiResponse = Response.generate(true, 'Failed To Generate Token', 500, null)
                    reject(apiResponse)
                }
                else if (util.isEmpty(retrievedTokenDetails)) {
                    let newAuthToken = new AuthModel({
                        userId: tokenDetails.userId,
                        authToken: tokenDetails.token,
                        tokenSecret: tokenDetails.tokenSecret,
                        tokenGenerationTime: time.now()
                    })
                    newAuthToken.save((err, newTokenDetails) => {
                        if (err) {
                            console.log(err)
                            logger.error(err.message, 'userProfileController: saveToken()', 10)
                            let apiResponse = Response.generate(true, 'Failed To Generate Token', 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            }
                            resolve(responseBody)
                        }
                    })
                }
                else {
                    retrievedTokenDetails.authToken = tokenDetails.token
                    retrievedTokenDetails.tokenSecret = tokenDetails.tokenSecret
                    retrievedTokenDetails.tokenGenerationTime = time.now()
                    retrievedTokenDetails.save((err, newTokenDetails) => {
                        if (err) {
                            console.log(err)
                            logger.error(err.message, 'userProfileController: saveToken()', 10)
                            let apiResponse = Response.generate(true, 'Failed To Generate Token', 500, null)
                            reject(apiResponse)
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                userDetails: tokenDetails.userDetails
                            };
                            resolve(responseBody)
                        }
                    })
                }
            })
        })
    } // END saveToken()

    // function for sending Email - SendEmail()
    let SendEmail = (emailOptions) => {
        let MailerResponse = Mailer.SendMail(emailOptions);

        MailerResponse.then((resolve) => {  // Mail sent successfully
            let successResponse = Response.generate(false, 'Password Reset mail sent', 200, resolve);
            res.send(successResponse);
            console.log("----resolve value----")
            console.log(resolve);

        }, (reject) => {
            console.log('Reason of rejection:- ' + reject);
            if (reject.code === 'EAUTH') {    // Invalid login from the Admin using NodeMailer
                let errorResponse = Response.generate(true, 'Error occurred while sending email', 'EAUTH', reject);
                res.send(errorResponse);
            }
            else if (reject.code === 'EENVELOPE') {   // No recipients defined(Invalid Email Address)
                let errorResponse = Response.generate(true, 'Invalid Email address', 'EENVELOPE', reject);
                res.send(errorResponse);
            }
        }).catch((err) => console.log("Errorhandler caught: " + err))

    } // end SendEmail()

    if (!util.isEmailValid(req.body.email)) {
        let apiResponse = Response.generate(true, 'Invalid Email address!!', 404, null);
        res.send(apiResponse);
        return;
    }

    UserModel.findOne({ email: req.body.email }, (err, userDetails) => {
        if (err) {
            console.log(err);
            let apiResponse = Response.generate(true, 'Some internal error occurred!!', 500, err);
            res.send(apiResponse);
        } else if (util.isEmpty(userDetails)) {
            console.log("No User with this Email Found")
            let apiResponse = Response.generate(true, "No account associated with that Email exists.", 404, null);
            res.send(apiResponse);
        } else {
            console.log(userDetails);
            generateToken(userDetails).then(saveToken)
                .then((responseBody) => {
                    let emailOptions = {
                        emailAddress: req.body.email,
                        subject: "Reset Your Password",
                        text: "ToDo List Web Application",
                        html: `<div style="background-color:#17a2b8; color:white; padding:5px; border:solid 2px green; width:50%; text-align:center; margin-left:auto; margin-right:auto;">
                    <h1 style="text-align:center;">Reset your password</h1>
                    <p> It looks like you’ve forgotten your password. Don’t worry, you can reset your
                     password by clicking the button below.</p>
                    <span style="background-color: indianred; border: none; padding: 10px 25px;
                          text-align: center; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 5px; ">
                    <a style="text-decoration:none; color:white;" href="http://localhost:4200/reset-password/${userDetails.userId}/${responseBody.authToken}" target="_blank">Reset Password</a></span>
                    </div>`
                    };
                    SendEmail(emailOptions);
                })
                .catch((err) => {
                    console.log("Errorhandler:");
                    console.log(err);
                    res.status(err.status);
                })
        }
    })
}

/**
 * function for Password Reset.
 */
let resetPassword = (req, res) => {

    if (!req.body.password || !req.params.userId || !req.params.authToken) {
        let apiResponse = Response.generate(true, 'One or More Parameters are missing!!', 400, null);
        res.send(apiResponse);
        return;
    }

    if (!util.isPasswordValid(req.body.password)) {
        let apiResponse = Response.generate(true, 'Invalid Password!!', 400, null);
        res.send(apiResponse);
        return;
    }

    AuthModel.findOne({ userId: req.params.userId, authToken: req.params.authToken }, (err, result) => {
        if (err) {
            console.log(err);
            let apiResponse = Response.generate(true, 'Some internal error occurred!!', 500, err);
            res.send(apiResponse);
        }
        else if (util.isEmpty(result)) {
            console.log("Invalid Authorization Token or Token Expired.")
            let apiResponse = Response.generate(true, "Invalid Authorization Token or Token Expired.", 404, null);
            res.send(apiResponse);
        }
        else {
            let hashPassword = bcryptLib.hashPassword(req.body.password);
            UserModel.findOneAndUpdate({ userId: req.params.userId }, { password: hashPassword }, (err, details) => {
                console.log(req.params.userId)
                console.log(req.body.password)
                if (err) {
                    console.log(err);
                    let apiResponse = Response.generate(true, 'Some internal error occurred!!', 500, err);
                    res.send(apiResponse);
                } else if (util.isEmpty(details)) {
                    console.log("No User with this userId Found")
                    let apiResponse = Response.generate(true, "No User Found.", 404, null);
                    res.send(apiResponse);
                } else {
                    console.log(details);
                    let apiResponse = Response.generate(false, 'Password Reset Successful!!', 200, details);
                    res.send(apiResponse);
                }
            })
        }
    })
} // END resetPassword() 

/**
 * function to logout user.
 * auth params: userId.
 */
let logout = (req, res) => {
    AuthModel.findOneAndRemove({userId: req.user.userId}, (err, result) => {
      if (err) {
          console.log(err)
          logger.error(err.message, 'user Controller: logout', 10)
          let apiResponse = Response.generate(true, `error occurred: ${err.message}`, 500, null)
          res.send(apiResponse)
      } else if (util.isEmpty(result)) {
          let apiResponse = Response.generate(true, 'Already Logged Out or Invalid UserId', 404, null)
          res.send(apiResponse)
      } else {
          let apiResponse = Response.generate(false, 'Logged Out Successfully', 200, null)
          res.send(apiResponse)
      }
    })
  } // end of the logout function.


let deleteAccount = (req, res) => {
    UserModel.deleteOne({ userId: req.params.userId }, (err) => {
        console.log(err);
        let apiResponse = Response.generate(true, 'Deletion Failed!!', 500, err);
        res.send(apiResponse);
    });
}

module.exports = {
    signup: signup,
    login: login,
    logout: logout,
    forgotPassword: forgotPassword,
    resetPassword: resetPassword,
    deleteAccount: deleteAccount,
}