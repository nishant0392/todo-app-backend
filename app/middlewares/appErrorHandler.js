
let errorHandler = (err,req, res, next) => {
    console.log("application error handler called");
    console.log(err);
    res.send('Some error occured at global level')
  
    
}// end request ip logger function 

let notFoundHandler = (req,res,next)=>{

    console.log("Global not found handler called");
    res.status(404).send('Route not found in the application')

}// end not found handler

module.exports = {
    globalErrorHandler : errorHandler,
    globalNotFoundHandler : notFoundHandler
}