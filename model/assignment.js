const mongoose = require('mongoose');
const md5 = require('md5')
const Schema = mongoose.Schema;

const AssignSchema = new Schema({
    assigner : {
      type : String,
      required : true,
      unique : false
    },
    task_id : {
      type: String,
      required: true,
      unique: false
    },
    worker_id : {
      type: String,
      required: true,
      unique: false
    },
    status: {
      type: String,
      required: true
    },
    assignmentDate : {
      type : Date,
      required : false,
    },
    startDate : {
      type : Date,
      required : false,
    },
    reviewComment : {
      type : String,
      required : false,
    },
    reviewDate : {
      type : Date,
      required : false,
    },
    reviewImageUrl : {
      type : String,
      required : false
    },
    completeComment : {
      type : String,
      required : false,
    },
    completeDate : {
      type : Date,
      required : false,
    },
    revisionComment : {
      type : String,
      required : false,
    },
    revisionDate : {
      type : Date,
      required : false
    },
    isTeamJob : {
      type : Boolean,
      required : true,
      default : false
    }
  });
  AssignSchema.index({ task_id: 1, worker_id: 1}, { unique: true });

  const AssignModel = mongoose.model('assignment', AssignSchema);
  
  module.exports = AssignModel;
