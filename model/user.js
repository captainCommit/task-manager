const mongoose = require('mongoose');
const md5 = require('md5')
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  wwID : {
    type : String,
    required : false,
    unique : false,
  },
  empID : {
    type : String,
    required : false,
    unique : false,
  },
  fullName : {
    type : String,
    required : false,
    unique :false,
  },
  tcs_email : {
    type : String,
    required : false,
    unique :false,
  },
  domain : {
    type : String,
    required : false,
    unique : false,
  },
  tower : {
    type : String,
    required : false,
    unique : false,
  },
  role : {
    type : String,
    required : false,
    unique : false,
  },
  password: {
    type: String,
    required: true
  },
  userType : {
      type : String,
      required : true
  }
});

UserSchema.pre('save',
    async function(next) {
      const user = this;
      //const hash = await md5(this.password);
      //this.password = hash;
      next();
    }
);

UserSchema.methods.isValidPassword = async function(password) {
    const user = this;
    const compare = password === user.password
    return compare;
} 
const UserModel = mongoose.model('user', UserSchema);

module.exports = UserModel;