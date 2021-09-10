const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
    taskName : {
      type: String,
      required: true,
      unique: true
    },
    taskDescription : {
      type: String,
      required: true,
      unique: false,
    },
    createdBy: {
      type: String,
      required: true
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
    storyPoints : {
      type : Number,
      required : true
    }
  });
  
  const TaskModel = mongoose.model('task', TaskSchema);
  
  module.exports = TaskModel;
