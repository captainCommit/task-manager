const mongoose = require('mongoose')


function aggreagateObject(type = null,user,conditions){
    if(type == 'admin'){
        return [
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
                "storyPoints" : 1,
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
                    $and:[{"createdBy" : user._id},{"isArchived" : {$ne : false}}]
                }
            },
            {   $unwind:"$assigned" },  
        ]

    }
    else if(type === 'worker'){
        return [
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
                    "storyPoints" : 1,
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
                {   $unwind:"$assigned" },  
                {
                    $match:{
                        $and:[{"assigned.worker_id" : user._id},{"isArchived" : {$eq : false}}]
                    }
                },
            ]
    }
    else if(type === null){ 
        return [
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
                "allotedDuration" : 1,
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
            {   $unwind:"$assigned" },  
            {
                $match: conditions
            },
        ]
    }
}
module.exports = aggreagateObject