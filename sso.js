const express = require('express')
const dotenv = require('dotenv')
const data = dotenv.config({
    path : "./process.env"
  })
const app = express()

app.post('/')
app.listen(process.env.SSOPORT,()=>{
    console.log('SSO service is running on port '+process.env.SSOPORT)
})