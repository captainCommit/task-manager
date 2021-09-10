const mongoose = require('mongoose');
const md5 = require('md5')
const Schema = mongoose.Schema;

const NotificationSchama = new Schema({
    title : {
      type: String,
      required: true,
    },
    task_id : {
      type : String,
      required : false,
      unique : false
    },
    description  : {
      type: String,
      required: true,
    },
    from : {
      type: String,
      required: true
    },
    to : {
        type : String,
        required : true,
    },
    creationDate : {
        type : Date,
        required  : true,
    }
  });
  
  const NotificationModel = mongoose.model('notifications', NotificationSchama);
  
  module.exports = NotificationModel;
