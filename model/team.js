const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeamSchema = new Schema({
    teamName : {
      type: String,
      required: true,
      unique: true
    },
    teamDescription : {
      type: String,
      required: true,
      unique: false,
    },
    createdBy: {
      type: String,
      required: true
    },
    members : {
        type: [String],
        required : true,
        default : [],
    },
    creationDate : {
      type : Date,
      required : true,
    },
    lastEditedBy : {
      type : String,
      required : false, 
    },
    lastEditDate : {
      type : Date,
      required : false
    },
    isArchived : {
      type : Boolean,
      required : true
    },
  });
  
  const TaskModel = mongoose.model('task', TaskSchema);
  
  module.exports = TaskModel;
