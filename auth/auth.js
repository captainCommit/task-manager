const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const UserModel = require('../model/user');

const JWTstrategy = require('passport-jwt').Strategy;
const ExtractJWT = require('passport-jwt').ExtractJwt;
var cookieExtractor = function(req) {
  try{
    var token = null;
    if (req && req.headers) token = req.headers.cookie;
    token = token.replace("token=","")
    //console.log(token)
    return token;
  }
  catch(err)
  {
    console.log(err)
    return null
  }
};
passport.use(
    new JWTstrategy(
      {
        secretOrKey: 'TOP_SECRET',
        jwtFromRequest: cookieExtractor,
        passReqToCallback : true
      },
      async (req, token, done) => {
        try {
          //console.log(token)
          return done(null, token.user);
        } catch (error) {
          console.log(error)
          done(error);
        }
      }
    )
);
passport.use(
    'signup',
    new localStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback : true
      },
      async (req,email, password,done) => {
        //console.log(email,password,done)
        //console.log(req)
        try {
          //console.log(req.body)
          const user = await UserModel.create({"username" : email, "password" : password,"userType" : req.body.role});
          done(null,user)
        } catch (error) {
            console.log(error)
            done(error)
        }
      }
    )
  );

  passport.use(
    'login',
    new localStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback : true,
      },
      async (req, email, password, done) => {
        //console.log(email,password,req.body)
        try {
            if(email) email = email.toLowerCase();
            //console.log(email)
            const user = await UserModel.findOne({"username" : email });
            //console.log(user)
            if (!user) {
                return done(null, false, { message: 'User not found' });
            }
            const type = req.body.role
            const validate = await  user.isValidPassword(password);
            //console.log(validate)
            if (!validate) {
                return done(null, false, { message: 'Wrong Password' });
            }
            //const check = user.userType === type
            //console.log(check)
            // if(!check){
            //     return done(null, false, { message: 'Wrong Type' });
            // }
            //console.log(user)
            return done(null, user, { message: 'Logged in Successfully' });
        } catch (error) {
          console.log(error)
          done(error)
        }
      }
    )
  );