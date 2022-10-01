const express = require('express');
const path = require('path')
const md5 = require('md5')
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { route } = require('./secure-routes');
const aggreagateObject = require('../queries/nosql')
const { response } = require('express');
const UserModel = require('../model/user')
const router = express.Router();
String.prototype.pick = function(min, max) {
  var n, chars = '';

  if (typeof max === 'undefined') {
      n = min;
  } else {
      n = min + Math.floor(Math.random() * (max - min + 1));
  }

  for (var i = 0; i < n; i++) {
      chars += this.charAt(Math.floor(Math.random() * this.length));
  }

  return chars;
};

String.prototype.shuffle = function() {
  var array = this.split('');
  var tmp, current, top = array.length;

  if (top) while (--top) {
      current = Math.floor(Math.random() * (top + 1));
      tmp = array[current];
      array[current] = array[top];
      array[top] = tmp;
  }

  return array.join('');
};


router.get('/test',(req,res)=>{
  console.log('works')
  res.send('works')
})
router.get('/expired',(req,res,next)=>{
  try{
    res.sendFile("expired.html",{root : path.join(__dirname,"../public")})
  }
  catch(err){
    console.log(err)
    res.send("Cannot load page")
  }
})
router.get('/',(req,res,next)=>{
  try{
    res.sendFile("index.html" , {root : path.join(__dirname,"../public")})
  }
  catch(err){
    console.log(err)
    res.send("Cannot load page")
  }
})
router.get('/bulk',(req,res,next)=>{
  try{
    res.sendFile("bulk.html" , {root : path.join(__dirname,"../public")})
  }
  catch(err){
    console.log(err)
    res.send("Cannot load page")
  }
})
router.get('/no',(req,res,next)=>{
  try{
    res.sendFile("nointernet.html" , {root : path.join(__dirname,"../public")})
  }
  catch(err){
    console.log(err)
    res.send("Cannot load page")
  }
})
/*
router.get('/url',(req,res,next)=>{
  try{
    var payload = {
      resource: { dashboard: 1 },
      params: {},
      exp: Math.round(Date.now() / 1000) + (10 * 60) // 10 minute expiration
    };
    var token = jwt.sign(payload, process.env.METABASE_SECRET_KEY);
    var iframeUrl = process.env.METABASE_SITE_URL + "/embed/dashboard/" + token + "#bordered=true&titled=true";
    console.log(iframeUrl)
    res.json({"message" : "successful","url" : iframeUrl})
  }
  catch(err){
    console.log(err)
    res.send("Cannot load page")
  }
})
*/
router.get('/stats',(req,res,next)=>{
  try{
    if(req.query.m === "yes")
      res.sendFile("undermaintenance.html" , {root : path.join(__dirname,"../public")})
    else
      res.sendFile("stats.html" , {root : path.join(__dirname,"../public")})
  }
  catch(err){
    console.log(err)
    res.send("Cannot load page")
  }
})
router.get('/admin',(req,res,next)=>{
  try{
    res.sendFile("dash_admin.html" , {root : path.join(__dirname,"../public")})
  }
  catch(err){
    console.log(err)
    res.send("Cannot load page")
  }
})
router.get('/worker',(req,res,next)=>{
  try{
    res.sendFile("dash_worker.html" , {root : path.join(__dirname,"../public")})
  }
  catch(err){
    console.log(err)
    res.send("Cannot load page")
  }
})
router.post('/signup',passport.authenticate('signup', { session: false }),async (req, res, next) => {
  //console.log(req.user)
  res.json({
    message: 'Signup successful',
    //user: req.user
  });
}
);

router.post(
    '/login',
    async (req, res, next) => {
      passport.authenticate(
        'login',
        async (err, user, info) => {
          try {
            if (err || !user) {
              const error = new Error('An error occurred.');
  
              return next(error);
            }
            req.login(
              user,
              { session: false },
              async (error) => {
                if (error) return next(error);
                //console.log(user._id)
                //console.log(req.get('host'))
                //const body = {"user" :};
                const token = jwt.sign({ user: user}, 'TOP_SECRET',{expiresIn : 3600});
                res.cookie('token',token,{httpOnly : true,secure:true,sameSite:'None',path:"/",domain:"localhost"})
                res.json({role : user.userType,token : token});
                
              }
            );
          } catch (error) {
            return next(error);
          }
        }
      )(req, res, next);
    }
);
router.get('/test',(req,res)=>{
  res.json({"data" : aggreagateObject()})
})
router.post('/forgot',async (req,res,next)=>{
  try{
    const id = req.body.empID
    const username = req.body.username
    var user = await UserModel.findOne({empID : id,username : username})
    if(!user){
      res.json({"message" : "User not found"})
      return
    }
    console.log(user)
    var email = user.username
    console.log(email)
    var specials = '!@#$%^&*()_+{}:"<>?\|[];\',./`~';
    var lowercase = 'abcdefghijklmnopqrstuvwxyz';
    var uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var numbers = '0123456789';
    var all = specials + lowercase + uppercase + numbers;
    var password = '';
    password += specials.pick(1);
    password += lowercase.pick(1);
    password += uppercase.pick(1);
    password += all.pick(3, 10);
    password = password.shuffle();
    console.log('New Password : '+password)
    await UserModel.updateOne({empID : id,username : username},{$set : {password : md5(passport)}})
    res.json({"message" : "successful"})
  }catch(err){
    console.log(err)
    res.json({"message" : "Some error has occured"})
  }
})


module.exports = router;