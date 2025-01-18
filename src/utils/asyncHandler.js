   const asynchandler = (requestHandler) => {
      (req, res, next) => {
      promise.resolve(requestHandler(req,res,next)).catch((error) =>
        next(error));
    }
   };

   export default asynchandler;