const express = require('express');
const router = express.Router();
//aggregation calls
const UserModel = require('../model/user');
const TaskModel = require('../model/task');
const AssignModel = require('../model/assignment');
const aggreagateObject = require('../queries/nosql')
function dateDiff(date2,date1){
    const diffTime = Math.abs(new Date(date2) - new Date(date1));
    //console.log(date2,date1,diffTime)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    //console.log(diffTime + " milliseconds");
    return diffDays === NaN? "NA" : diffDays;
}
router.get('/count',async (req,res,next)=>{
    try{
        var avgitems = []
        var [userCount,taskCount,temp,userData,taskData] = await Promise.all([UserModel.countDocuments(),TaskModel.countDocuments(),TaskModel.aggregate(aggreagateObject(null,null,{$and:[{"assigned.status" : "completed"}]})),UserModel.aggregate([{"$group" : {_id:"$userType", count:{$sum:1}}}]),AssignModel.aggregate([{"$group" : {_id:"$status", count:{$sum:1}}}])])
        //console.log(userCount,taskCount)
        temp.forEach(e => {
            avgitems.push(dateDiff(e.assigned.completeDate,e.assigned.assignmentDate))
        })
        const sum = avgitems.reduce((a, b) => a + b, 0);
        const avg = (sum / avgitems.length) || 0;
        //console.log(data)
        res.json({"message" : "successful","data" : {"users" : userCount,"tasks" : taskCount,"tat" : avgitems,"avg" : avg,"userGroups" : userData,"taskGroups" : taskData}})
    }catch(err){
        console.log(err)
        res.json({"message" : "Some error has occured"})
    }
})
router.get('/')
router.get('/list',async (req,res,next)=>{
    var [rawDataWorker,rawDataManager] = await Promise.all(
    [UserModel.aggregate(
        [
            {
                "$project": 
                {
                    "_id": {
                    "$toString": "$_id"
                    },
                    "fullName" : 1,
                    "empID" : 1,
                    "userType" : 1,
                    role : 1
                }
            },
            {
                $lookup:{
                    from: "assignments",       // other table name
                    localField: "_id",   // name of users table field
                    foreignField: "worker_id", // name of userinfo table field
                    as: "assigned"         // alias for userinfo table
                }
            },
            {
                $match : {
                    $and : [{"userType" : "worker"}]
                }
            }
        ]),
        UserModel.aggregate([
            {
                "$project": 
                {
                    "_id": {
                    "$toString": "$_id"
                    },
                    "fullName" : 1,
                    "empID" : 1,
                    "userType" : 1,
                    "role" : 1,
                }
            },
            {
                $lookup:{
                    from: "assignments",       // other table name
                    localField: "_id",   // name of users table field
                    foreignField: "assigner", // name of userinfo table field
                    as: "assigned"         // alias for userinfo table
                }
            },
            {
                $match : {
                    $and : [{"userType" : "admin"}]
                }
            }
        ])
    ])
    
    res.json({"message" : "successful",data : {"admins" : rawDataManager,"workers" : rawDataWorker}})
})
router.get('/trends',async (req,res,next)=>{
    try{
        var data = await TaskModel.aggregate([
            {
                "$project": 
                {
                    "_id": {
                    "$toString": "$_id"
                    },
                    "allotedDuration" : 1,
                    "taskName" : 1,
                }
            },
            {
                "$lookup" : {
                    from: "assignments",       // other table name
                    localField: "_id",   // name of users table field
                    foreignField: "task_id", // name of userinfo table field
                    as: "assigned"    
                }
            },
            {
                "$project":{
                    "assigned.task_id" : 1,
                    "allotedDuration" : 1,
                    "assigned.timeToComplete" : 1,
                    "assigned.assigner" : 1,
                    "assigned.worker_id" : 1,
                    "assigned.status" : 1
                }
            },
            {
                $match : {
                    $and : [{"assigned.status" : "completed"}]
                }
            }
        ])
        res.json({"message" : "successful","data" : data})
    }catch(err){
        console.log(err)
        res.json({"message" : "Error"})
    }

})
module.exports = router