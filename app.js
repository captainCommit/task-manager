const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const dotenv = require('dotenv')
const cookieParser = require('cookie-parser')
var cors = require('cors')
var proxy = require('express-http-proxy');
const data = dotenv.config({
  path : "./process.env"
})
const routes = require('./routes/routes');
const secureRoute = require('./routes/secure-routes');
const statRoutes = require('./routes/stat-routes')
const app = express();
function notConnected(req,res,next){
  console.log("error")
  res.json({"message" : "No Connection"})
}

mongoose.connect(process.env.MONGODB, {useNewUrlParser : true,useUnifiedTopology : true,useCreateIndex : true});
mongoose.connection.on('error', error =>{
  console.log("Problem")
  console.log(error)
});
mongoose.Promise = global.Promise;
console.log('DB connection successful')
require('./auth/auth');



app.use(express.urlencoded({extended : true,limit:"50mb"}));
console.log('Static pages are up')
app.use(cors({
  credentials : true,
}))
app.use('/', routes);
app.use(express.static("public",{
  maxAge:0,
}))
// Plug in the JWT strategy as a middleware so only verified users can access this route.
app.use('/api', passport.authenticate('jwt', { session: false }), secureRoute);
app.use('/stat',statRoutes)
// Handle errors.
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({ error: err });
});
var io = null
app.listen(process.env.PORT ?? 3000, () => {
  console.log(`Server started at ${process.env.PORT ?? 3000}`)
});

module.exports = io
