//await io.sockets.emit('broadcast',{ description: 'Hi'});
const cloudinary = require('cloudinary').v2
const path = require('path')
const dotenv = require('dotenv')
const io = require('../wss-app')
const express = require('express');
const moment = require('moment')
const router = express.Router();
const md5 = require('md5')
const UserModel = require('../model/user');
const TaskModel = require('../model/task');
const AssignModel = require('../model/assignment');
const NotificationModel = require('../model/notification')
const aggreagateObject = require('../queries/nosql')
const specials = '!@#$%^&';
const lowercase = 'abcdefghijklmnopqrstuvwxyz';
const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const numbers = '0123456789';
var userMap = {}
var reverseUserMap = {}
const data = dotenv.config({
    path : "../process.env"
})

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
// Credit to @Christoph: http://stackoverflow.com/a/962890/464744
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


var connections = {}
/* Open to all enpoints */
//Get User Information => all
cloudinary.config({
    cloud_name : process.env.CLOUD_NAME,
    api_key : process.env.API_KEY,
    api_secret : process.env.API_SECRET,
    secure : false,
    secure_distribution : false,
})
//console.log(cloudinary)
io.sockets.on('connection',function(socket) {
    //console.log('new user connected')
    socket.on('username', function(username) {
     connections[username] = socket;
    });
});
router.post( '/profile',async (req, res, next) => {
  try{
    //console.log("start",req.user,"end")
    const data  = await UserModel.findOne({_id : req.user._id})
    let {password , ...y} = data._doc
    //console.log(data)
    res.json({
      message: 'successful',
      user: y,
    })
  }catch(err){
    console.log(err)
    res.json({"message" : err.errmsg})
  }
});
//Get a list of worker usernames => all
router.get('/map/worker', async (req,res,next)=>{
    try{
        var map = {}
        var temp = await UserModel.find({userType : "worker"})
        temp.forEach(e => {
            map[e._id] = e["username"]
        })
        res.json({"message" : "successful","data" : map})
    }catch(e){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})
router.get('/map/admin', async (req,res,next)=>{
    try{
        var map = {}
        var temp = await UserModel.find({userType : "admin"})
        temp.forEach(e => {
            map[e._id] = e["username"]
        })
        res.json({"message" : "successful","data" : map})
    }catch(e){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})
router.get('/map', async (req,res,next)=>{
    try{
        var map = []
        var temp = await UserModel.find()
        temp.forEach(e => {
            let {password, ...t} = e._doc
            userMap[t._id] = t.username
            reverseUserMap[t.username] = t._id
            map.push(t)
        })
        //console.log(reverseUserMap)
        res.json({"message" : "successful","data" : map})
    }catch(err){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})
router.post('/password',async(req,res,next)=>{
    try{
        const id = req.user._id
        const oldPwd = req.body.old
        const newPwd = req.body.new
        //console.log(id,oldPwd,newPwd)
        var user = await UserModel.findById(id)
        if(oldPwd === newPwd){
            res.json({"message" : "Current password cannot be the previous password"})
            return
        }
        else if(oldPwd !== user.password){
            res.json({"message" : "Current password is incorrect"})
            return
        }
        else{
            //console.log(user)
            await UserModel.updateOne({_id : id},{$set : {password : newPwd}})
            res.json({"message" : "Password changed successfully"})
        }
    }
    catch(err){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})
//Update user profile => all
router.post('/update',async (req,res,next) => {
   try{
        const profileObj = JSON.parse(req.body.data)
        //console.log(profileObj)
        const id = req.user._id
        var oldUser = await UserModel.findOne({_id : id})
        //console.log(oldUser._doc)
        var result = {}
        for(var x in oldUser._doc){
            result[x] = oldUser[x]
        }
        for(var x in profileObj){
            result[x] = profileObj[x]
        }
        //console.log(result)
        await UserModel.updateOne({_id : id},{$set : profileObj})
        res.json({"message" : "Profile updated successfully","user" : result})
   }catch(err){
       console.log(err)
       res.json({"message" : err.errmsg})
   }

})
//get list of notifications
router.post('/notifications',async (req,res,next)=>{
    try{
        const user_id = req.user._id
        const last = req.body.last
        var notifications = null
        //console.log(user_id,last)
        if(last === "all"){
            notifications = await NotificationModel.find({"to" : {"$in" : [user_id,"all"]}}).sort({"creationDate" : -1})
        }
        else{
            notifications = await NotificationModel.find({"to" : {"$in" : [user_id,"all"]},"creationDate" : {$gt : last}}).sort({"creationDate" : -1})
        }
        //console.log(notifications)
        res.json({"message" : "successful","data" : notifications})
    }
    catch(err){
        console.log(err)
        res.json({"message" : "failed"})
    }
})
/* Admin endpoints */

//Create New Task => admin
router.post('/new',async (req,res,next) => {
    try{
        const reqBody = req.body
        //console.log(reqBody)
        const creator = await UserModel.findById(req.user._id)
        //console.log(creator)
        if(creator.userType !== 'admin'){
            res.json({"message" : "You can't create a new task, since you're not an admin"})
            return
        }
        else{
            const taskName = reqBody.name
            const taskDesc = reqBody.desc
            const storypoints = reqBody.storypoints
            var resp = await TaskModel.create({"taskName" : taskName,"taskDescription" : taskDesc,"storyPoints": storypoints,"createdBy" : creator._id,"creationDate" : new Date(),"isArchived" : false})
            //console.log(resp)
            await AssignModel.create({"task_id" : resp._id,"worker_id" : "NA","status" : "created","assigner" : req.user._id}) 
            res.json({"message" : "Task created successfully","task" : resp._id})
        }
    }
    catch(err){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})

//Assign an unassigned task => admin
router.post("/assign",async (req,res,next)=>{
   try{
        const reqBody = req.body
        //console.log(reqBody)
        const creator = await UserModel.findById(req.user._id)
        //console.log(creator)
        if(creator.userType !== 'admin'){
            res.json({"message" : "You can't assign tasks, since you're not an admin"})
            return
        }
        else{
            const task_id = reqBody.task
            //console.log(reqBody)
            const worker_id = reqBody.worker_id
            //console.log(task_id,worker_id)
            var [task,assignment] = await Promise.all([TaskModel.findById(task_id),AssignModel.findOne({task_id : task_id})])
            //console.log(task)
            if(!task){
                res.json({"message" : "Cannot find task"})
                return
            }
            //console.log(assignment)
            if(assignment.worker_id !== "NA"){
                res.json({"message" : "Cannot assign already assigned task"})
                return
            }
            else{
                const worker = await UserModel.findOne({_id : worker_id})
                if(!worker){
                    res.json({"message" : "Cannot find person"})
                    return
                }
                else if(worker.userType !== 'worker'){
                    res.json({"message" : "Cannot assign task to admin"})
                    return
                }
                else{
                    //var newtask = {"task_id" : task_id,"worker_id" : worker._id,"status" : "assigned"}
                    //console.log(newtask)
                    await Promise.all([AssignModel.updateOne({task_id : task_id},{$set : {"worker_id" : worker._id,"status" : "assigned","assignmentDate" : new Date()}}),NotificationModel.create({"title" : "New task","description" :`Task titled ${task.taskName} has been assigned to you`,"from" : req.user._id,"to" : worker_id,creationDate : new Date(),task_id : task_id})]) 
                    io.sockets.emit('broadcast',{"role" : "worker"})
                    res.json({"message" : "Task assigned successfully"})
                }
            }
        }
   }
   catch(err){
    console.log(err)
    res.json({"message" : err.errmsg})
   } 
})
router.post('/bulk', async (req,res,next)=>{
    try{
        const type = req.body.type
        const body = JSON.parse(req.body.data)
        const data = body['list']
        if(type === 'users'){
            var password = '';
            password += specials.pick(1);
            password += lowercase.pick(1);
            password += uppercase.pick(1);
            var all = specials + lowercase + uppercase + numbers;
            password += all.pick(3, 12);
            password = password.shuffle();
            console.log(data)
            data.forEach(e => {
                e.password = md5(password)
                console.log(e)
            })
            var response = await UserModel.insertMany(data)
            res.json({"message" : "successful","data" : `Password for all added users is ${password}`,"resp" : response})
        }
        else if(type === 'tasks'){
            var images = body['images']
            console.log(images)
            var imageMap = {}
            images.forEach( e=> {
                imageMap[e.taskName] = e.fileToBeUploaded
            })
            var notifications = []
            var taskData = []
            data.forEach(e => {
                var obj = {"task" : {},"assignment" : {}}
                obj.task.taskName = e.taskName
                obj.task.taskDescription = e.taskDescription
                obj.task.createdBy = reverseUserMap[e.createdBy]
                obj.task.creationDate = new Date(e.creationDate)
                obj.task.lastEditedBy = e.lastEditedBy === 'NA' ?null:reverseUserMap[e.lastEditedBy]
                obj.task.lastEditDate = e.lastEditDate === 'NA' ?null: new Date(e.lastEditDate)
                obj.task.isArchived = false
                obj.task.storyPoints = parseInt(e.storyPoints)
                obj.assignment.status = e.status
                obj.assignment.assigner = reverseUserMap[e.createdBy]
                obj.assignment.worker_id = reverseUserMap[e.assignedTo]
                obj.assignment.assignmentDate = e.assignmentDate === 'NA'?null : new Date(e.assignmentDate)
                obj.assignment.startDate = e.startDate === 'NA'?null : new Date(e.startDate)
                obj.assignment.reviewComment = e.reviewComment === 'NA'? null: e.reviewComment
                obj.assignment.reviewDate = e.reviewDate === 'NA'?null : new Date(e.reviewDate)
                obj.assignment.reviewImageUrl = ''
                obj.assignment.completeComment = e.completeComment === 'NA'? null: e.completeComment
                obj.assignment.completeDate = e.completeDate === 'NA'?null : new Date(e.completeDate)
                obj.assignment.revisionComment = e.revisionComment === 'NA'? null: e.revisionComment
                obj.assignment.revisionDate = e.revisionDate === 'NA'?null : new Date(e.revisionDate)
                obj.fileToBeUploaded = imageMap[e.taskName]
                taskData.push(obj)

            })
            console.log(taskData)
            for(var e in taskData){
                var task = await TaskModel.create(taskData[e].task)
                console.log(task)
                if(taskData[e].fileToBeUploaded !== undefined){
                    var imageData = await cloudinary.uploader.upload(taskData[e].fileToBeUploaded,{ resource_type: "image", public_id: "review/"+task._id})
                    console.log(imageData)
                    taskData[e].assignment['reviewImageUrl'] = imageData.url
                }
                taskData[e].assignment['task_id'] = task._id
                var assign = await AssignModel.create(taskData[e].assignment)
                console.log(assign)
            }
            res.json({"message" : "successful","data" : `${taskData.length} tasks have been uploaded successfully`})
            await NotificationModel.create({"title" : "Bulk Upload","description" :`${taskData.length} tasks have been uploaded successfully`,"from" : req.user._id,"to" : "all",creationDate : new Date(),"task_id" : task._id})
            io.sockets.emit('broadcast',{"role" : "all"})
        }
        else{
            res.json({"message" : "Some error has occured`"})
        }
       
    }catch(err){
        console.log(err)
        res.json({"message" : "Some error has occured : "})
    }
})
//Reassign a task => admin
router.post('/reassign',async(req,res,next)=>{
    try{
        const creator = await UserModel.findById(req.user._id)
        const newWorker = req.body.user
        const taskId = req.body.task
        //console.log("complete")
        if(creator.userType !== 'admin'){
            res.json({"message" : "You can't reassign tasks, since you're not an admin"})
            return
        }
        const task = await AssignModel.findOne({"task_id" : taskId})
        //console.log(task)
        if(!task){
            res.json({"message" : "Task not found"})
            return
        }
        else if(task.status === 'created'){
            res.json({"message" : "Unassigned tasks cannot be reassigned"})
            return
        }
        else if(task.status !== 'assigned'){
            res.json({"message" : "Started or Completed tasks cannot be reassigned"})
            return
        }
        else
        {
            var newuser = await UserModel.findById(newWorker)
            if(!newuser){
                res.json({"message" : "User not found"})
                return
            }
            else if(newuser.userType === "admin"){
                res.json({"message" : "Can't reassign task to admin"})
                return
            }
            await Promise.all([AssignModel.updateOne({"task_id" : taskId},{$set : {"worker_id" : newWorker,"status" : "assigned","assignmentDate" : new Date()}}),NotificationModel.create({"title" : "Task re-assigned","description" : `Task titled ${task.taskName} has been re-assigned to you`,"from" : req.user._id,"to" : newWorker,creationDate : new Date(),task_id : taskId}),NotificationModel.create({"title" : "Task re-assigned","description" : `Task titled ${task.taskName} has been re-assigned from you`,"from" : req.user._id,"to" : task.worker_id,creationDate : new Date(),task_id : taskId})])
            io.sockets.emit('broadcast',{"role" : "worker"})
            res.json({"message" : "Task reassigned successfully"})
        }
    }
    catch(err){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})

//Delete a task => admin
router.post('/delete',async(req,res,next)=>{
    try{
        
        const taskId = req.body.task
        const deadline = parseFloat(req.body.deadline)
        //console.log("complete")
        const [creator,task,assign] = await Promise.all([UserModel.findById(req.user._id),TaskModel.findById(taskId),AssignModel.findOne({"task_id" : taskId})])
        if(creator.userType !== 'admin'){
            res.json({"message" : "You can't delete tasks, since you're not an admin"})
            return
        }
        if(!task){
            res.json({"message" : "Task not found"})
            return
        }
        //console.log(task)
        var flag = false
        if((assign.status === "completed" || assign.status === "started" || assign.status === "review")&&( deadline > 0)){
            res.json({"message" : "Once started, tasks cannot be deleted"})
            flag = true
            return
        }
        if(!flag){
            await Promise.all([AssignModel.remove({"task_id" : taskId}),TaskModel.findByIdAndRemove(taskId),NotificationModel.create({"title" : "Task removed","description" : `Task titled ${task.taskName} has been deleted`,"from" : req.user._id,"to" : assign.worker_id,creationDate : new Date()})])
            io.sockets.emit('broadcast',{"role" : "worker"})
            res.json({"message" : "Task deleted and subsequent assignments deleted"})
        }
    }
    catch(err){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})
router.post('/archive',async(req,res,next)=>{
    try{
        const user = await UserModel.findById(req.user._id)
        const task = await TaskModel.findById(req.body.task_id)
        const assign = await AssignModel.findOne({"task_id" : req.body.task_id})
        if(!task){
            res.json({"message" : "Task not found"})
            return
        }
        else if(assign.status !== 'completed'){
            //console.log(assign.status)
            res.json({"message" : "Only completed tasks can be archived"})
            return
        }
        else{
            await TaskModel.update({_id : task},{$set : {isArchived : true}})
            res.json({"message" : "Task archived successfully"})
            io.sockets.emit('broadcast',{"role" : "worker"})
            await NotificationModel.create({"title" : "Task archived","description" : `Task titled ${task.taskName} has been archived`,"from" : req.user._id,"to" : assign.worker_id,creationDate : new Date()})
        }
    }catch(err){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})

router.post('/restore',async(req,res,next)=>{
    try{
        const user = await UserModel.findById(req.user._id)
        const task = await TaskModel.findById(req.body.task_id)
        const assign = await AssignModel.findOne({"task_id" : req.body.task_id})
        if(!task){
            res.json({"message" : "Task not found"})
            return
        }
        else{
            await TaskModel.update({_id : task},{$set : {isArchived : false}})
            res.json({"message" : "Task restored successfully"})
            io.sockets.emit('broadcast',{"role" : "all"})
            await NotificationModel.create({"title" : "Task restored","description" : `Task titled ${task.taskName} is active again`,"from" : req.user._id,"to" : assign.worker_id,creationDate : new Date()})
        }
    }catch(err){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})
//Update a task => admin
router.post('/edit',async(req,res,next)=>{
    try{
        const creator = await UserModel.findById(req.user._id)
        const taskId = req.body.task
        //console.log(taskId)
        if(creator.userType !== 'admin'){
            res.json({"message" : "You can't edit tasks, since you're not an admin"})
            return
        }
        const task = await TaskModel.findById(taskId)
        const assign = await AssignModel.findOne({"task_id" : taskId})
        if(!task){
            res.json({"message" : "Task not found"})
            return
        }
        //console.log(task)
        var flag = false
        if(assign.status === 'completed' || assign.status === 'started' || assign.status === 'review'){
            res.json({"message" : "cannot edit an already started or completed task"})
            return
        }
        if(!flag){
            const taskName = req.body.name
            const desc = req.body.desc
            const worker = req.body.assignedTo
            const storypoints = req.body.storypoints
            //console.log(taskName,desc,worker)
            const lasteditby = creator._id
            if(task.taskName !== taskName || task.taskDescription !== desc || task.storyPoints !== storypoints){
                await Promise.all([TaskModel.updateOne({_id : taskId},{$set : {"taskName" : taskName,"taskDescription" : desc,"storyPoints" : storypoints,"lastEditedBy" : lasteditby,"lastEditDate" : new Date()}}),NotificationModel.create({"title" : "Task edited","description" : `Task titled ${task.taskName} has been edited`,"from" : req.user._id,"to" : assign.worker_id,creationDate : new Date(),task_id : taskId})])
                io.sockets.emit('broadcast',{"role" : "worker"})
            }
            if(worker !== assign.worker_id){
                await AssignModel.updateOne({"task_id" : taskId},{"task_id" : taskId,"worker_id" : worker,"status" : worker === "NA"?"created" : "assigned","assignmentDate" : worker === "NA"? null : new Date()})
                if(assign.worker_id === 'NA'){
                    await NotificationModel.create({"title" : "Task assigned","description" : `Task titled ${taskName} has been assigned to you`,"from" : req.user._id,"to" : worker,"creationDate" : new Date() ,task_id : taskId})
                }
                else if(worker === 'NA'){
                    await NotificationModel.create({"title" : "Task removed","description" : `Task titled ${taskName} has been removed from you`,"from" : req.user._id,"to" : assign.worker_id,creationDate : new Date()})
                }
                else{
                    await Promise.all([NotificationModel.create({"title" : "Task removed","description" : `Task titled ${taskName} has been removed from you`,"from" : req.user._id,"to" : assign.worker_id,creationDate : new Date()}),NotificationModel.create({"title" : "Task assigned","description" : `Task titled ${taskName} has been assigned to you`,"from" : req.user._id,"to" : worker,creationDate : new Date(),task_id : taskId})])
                }
                //console.log("assign update")
                io.sockets.emit('broadcast',{"role" : "worker"})
            }
            res.json({"message" : "Task has been successfully updated"})
        }
    }
    catch(err){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})

//List all tasks created by an admin => admin
router.get('/list/admin',async(req,res,next)=>{
    try{
        const id = req.user._id
        const user = await UserModel.findById(id)
        if(user.userType !== 'admin'){
            res.json({"message" : "You can't access this route, since you're not an admin"})
            return
        }
        const tasks =  await TaskModel.aggregate(aggreagateObject('admin',req.user))
        res.json({"message" : "successful" ,"data" : tasks})
    }
    catch(err){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})
//Get all archived tasks => admin
router.get('/list/archived',async (req,res,next)=>{
    try{
        const id = req.user._id
        const user = await UserModel.findById(id)
        if(user.userType !== 'admin'){
            res.json({"message" : "You can't access this route, since you're not an admin"})
            return
        }
        const tasks =  await TaskModel.aggregate()
        res.json({"message" : "successful" ,"data" : tasks})
    }
    catch(err){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})
//Complete assigned task => admin
router.post('/complete',async (req,res,next)=>{
    try{
        const reqBody = req.body
        const task = reqBody.task
        const worker = reqBody.worker
        const redo = reqBody.redo
        const comment = reqBody.comment
        const [creator,Task,assignment] = await Promise.all([UserModel.findById(req.user._id),await TaskModel.findById(task),await AssignModel.findOne({"task_id" : task, "worker_id" : worker})])
        const user = req.user._id
        //console.log("complete")
        //console.log(worker,task,comment)
        if(creator.userType !== 'admin'){
            res.json({"message" : "You can't mark tasks as completed, since you're not an admin"})
            return
        }
        if(!Task){
            res.json({"message" : "Task not found"})
            return
        }
        if(!assignment){
            res.json({"message" : "Task - User combination not found !"})
            return
        }
        else if(assignment.status === "completed"){
            res.json({"message" : "Cannot completed already completed task !"})
            return
        }
        else if(assignment.status === "assigned"){
            res.json({"message" : "Cannot complete a task that has not yet been started !"})
            return
        }
        else if(assignment.status === "started"){
            res.json({"message" : "Cannot complete a task which has not yet been sent for review !"})
            return
        }
        else{
            
            if(redo){
                await Promise.all[AssignModel.updateOne({"task_id" : task, "worker_id" : worker},{$set : {"status" : "started","revisionComment" : comment, "revisionDate" : new Date()}}),NotificationModel.create({"title" : "Task re-opened","description" : `Task titled ${Task.taskName} has been restarted due to issues`,"from" : req.user._id,"to" : worker,"creationDate" : new Date(),task_id : task})]
                io.sockets.emit('broadcast',{"role" : "worker"})
                res.json({"message" : "Task marked started"})
            }else{
                var timeToComplete = moment(new Date()).diff(moment(assignment.startDate),'hours')
                console.log(timeToComplete)
                await Promise.all([AssignModel.updateOne({"task_id" : task, "worker_id" : worker},{$set : {"status" : "completed","completeComment" : comment, "completeDate" : new Date(),timeToComplete : (timeToComplete/24).toPrecision(2)}}),NotificationModel.create({"title" : "Task completed","description" : `Task titled ${Task.taskName} has been marked completed`,"from" : req.user._id,"to" : worker,"creationDate" : new Date(),task_id : task})])
                io.sockets.emit('broadcast',{"role" : "worker"})
                res.json({"message" : "Task marked complete successfully"})
            }
            
        }
    }catch(err){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})


/*------------------------------------*/
/* Worker endpoints */

//Accept Task => worker
router.post('/start',async (req,res,next)=>{
    try{
        const reqBody = req.body
        const task = reqBody.task
        const creator = await UserModel.findById(req.user._id)
        const user = req.user._id
        //console.log("complete")
        //console.log(creator,task)
        if(creator.userType !== 'worker'){
            res.json({"message" : "You can't accept tasks, since you're not a worker"})
            return
        }
        var Task = await TaskModel.findById(task)
        var assignment = await AssignModel.findOne({"task_id" : task, "worker_id" : user})
        if(!Task){
            res.json({"message" : "Task not found"})
            return
        }
        if(!assignment){
            res.json({"message" : "Task - User combination not found !"})
            return
        }
        else if(assignment.status === "started" ){
            res.json({"message" : "Cannot start already started task !"})
            return
        }
        else if(assignment.status === "complete" ){
            res.json({"message" : "Cannot start already completed task !"})
            return
        }
        else if(assignment.status === "review" ){
            res.json({"message" : "Cannot start already in-review task !"})
            return
        }
        else{
            await Promise.all([AssignModel.updateOne({"task_id" : task, "worker_id" : user},{$set : {"status" : "started","startDate" : new Date()}}),NotificationModel.create({"title" : "Task started","description" : `Task titled ${Task.taskName} has been started`,"from" : req.user._id,"to" : Task.createdBy,"creationDate" : new Date(),task_id : task})])
            io.sockets.emit('broadcast',{"role" : "admin"})
            res.json({"message" : "Task marked started successfully"})
        }
    }
    catch(err){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})
//Send for review => worker
router.post('/review',async (req,res,next)=>{
    try{
        const reqBody = req.body
        const task = reqBody.task
        const comment = reqBody.comment
        const creator = await UserModel.findById(req.user._id)
        const user = req.user._id
        //console.log(reqBody)
        const image = reqBody.image
        //console.log("complete")
        //console.log(creator,task)
        if(creator.userType !== 'worker'){
            res.json({"message" : "You can't accept tasks, since you're not a worker"})
            return
        }
        var Task = await TaskModel.findById(task)
        var assignment = await AssignModel.findOne({"task_id" : task, "worker_id" : user})
        if(!Task){
            res.json({"message" : "Task not found"})
            return
        }
        if(!assignment){
            res.json({"message" : "Task - User combination not found !"})
            return
        }
        else if(assignment.status === "review" ){
            res.json({"message" : "Cannot send for review an already in review task !"})
            return
        }
        else if(assignment.status === "complete" ){
            res.json({"message" : "Cannot send for review an already completed task !"})
            return
        }
        else if(assignment.status === "assigned" ){
            res.json({"message" : "Cannot review a not started task !"})
            return
        }
        else{
            const data = await cloudinary.uploader.upload(image,{ resource_type: "image", public_id: "review/"+task},)
            //console.log(data)
            Promise.all([AssignModel.updateOne({"task_id" : task, "worker_id" : user},{$set : {"status" : "review" , "reviewComment" : comment, "reviewDate" : new Date(),"reviewImageUrl" : data.url}}),NotificationModel.create({"title" : "Task in review","description" : `Task titled ${Task.taskName} has been sent for review`,"from" : req.user._id,"to" : Task.createdBy,"creationDate" : new Date(),task_id : task})])
            io.sockets.emit('broadcast',{"role" : "admin"})
            res.json({"message" : "Task marked in-review successfully"})
        }
    }
    catch(err){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})
//List all tasks assigned to a worker => woker
router.get('/list/worker',async(req,res,next)=> {
    try{
        const user = await UserModel.findById(req.user._id)
        if(user.userType !== 'worker'){
            res.json({"message" : "You can't have assigned tasks, since you're an admin"})
            return
        }
        console.log(req.user)
        const tasks = await TaskModel.aggregate(aggreagateObject('worker',req.user))
        res.json({"message" : "successful","data" : tasks})
    }
    catch(err){
        console.log(err)
        res.json({"message" : err.errmsg})
    }
})
router.post('/history',async(req,res,next)=>{
    try{
        const task_id =  req.body.id
        const task = await TaskModel.findById(task_id)
        if(!task){
            res.json({"message" : "Task not found"})
            return
        }
        else{
            const history = await NotificationModel.find({"task_id" : task_id})
            //console.log(history)
            res.json({"message" : "successful","data" : history})
        } 
    }
    catch(err){
        console.log(err)
    }
})
router.get('/test',async(req,res,next)=>{
    const tasks =  await TaskModel.aggregate([
        {"$project": {
            "_id": {
                "$toString": "$_id"
              },
              "taskName" : 1,
              "taskDescription" : 1,
              "createdBy" : 1,
              "creationDate" : 1,
              "lastEditedBy" : 1,
              "lastEditDate" : 1,
              "isArchived" : 1,
          }
        },
        // Join with user_info table
        {
            $lookup:{
                from: "assignments",       // other table name
                localField: "_id",   // name of users table field
                foreignField: "task_id", // name of userinfo table field
                as: "assigned"         // alias for userinfo table
            }
        },
        {
            $match:{
                $and:[{"assigned.worker_id" : req.user._id},{"isArchived" : {$eq : true}}]//,{"isArchived" : false}]
            }
        },
        {   $unwind:"$assigned" },
    ])
    //console.log(tasks)
    tasks.forEach(e => {
        //console.log(e)
    })
    res.json({"message" : "ok"})
})

router.post('/logout' ,(req, res,next) => {
    req.logOut()
    res.json({"message" : "Logged out successfully"});
  })
module.exports = router;

/*
Task flow : 
1. created by admin
2. assigned by admin
3. started by worker
4. sent for review by worker
5. marked completed by admin
*/