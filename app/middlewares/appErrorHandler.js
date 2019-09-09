
let errorHandler = (err, req, res, next) => {
    console.log("application error handler called");
    console.log(err);
    res.send('Some error occured at global level')

}// end request ip logger function 

let notFoundHandler = (req, res, next) => {
    // Excluding Socket IO requests
    if (req.url.match(/\/socket.io\/\?/)) return;
    
     // Excluding upload avatars
    if (req.url.match(/\/uploadAvatar\/\?/)) return;
    
    console.log("Global not found handler called for following request URL:");
    console.log(req.url);
    res.status(404).send('Route not found in the application')

}// end not found handler

module.exports = {
    globalErrorHandler: errorHandler,
    globalNotFoundHandler: notFoundHandler
}
