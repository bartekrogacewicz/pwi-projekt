const express = require('express')
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const mysql = require('mysql');


app.use(express.static(path.join(__dirname, "public")))

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))

const connections = [null, null]

require('dotenv').config()

const db = require('db')
var connection = db.connect({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
})

try {
  connection.connect(function(action, email,password){
    switch(action) {
      case 'selectUsers':
        console.log("select users");
        break
      case 'addUser':
        console.log("select users");
        break
    }
  })
} catch (error) {
  console.error(error);
}

function selectUsers(){
  var sql = `SELECT * FROM users ORDER BY UserEmail ASC`
  return sql
}

function insertUser(email,password){
  var sql = `INSERT INTO Users (UserEmail, UserPassword)
            VALUES (` + email +`,` + password +`);`
  return sql
}

function updateUser(oldEmail, newEmail){
  var sql = `UPDATE Users
            SET UserEmail = `+ newEmail +`
            WHERE UserEmail = `+ oldEmail +`;`
  return sql
}

function deleteUser(email) {
  var sql = `DELETE FROM Users WHERE UserEmail=`+ email +`;`
}

io.on('connection', socket => {
  let playerIndex = -1;
  for (const i in connections) {
    if (connections[i] === null) {
      playerIndex = i
      break
    }
  }


  socket.emit('player-number', playerIndex)

  console.log(`Player ${playerIndex} has connected`)

  if (playerIndex === -1) return

  connections[playerIndex] = false

  socket.broadcast.emit('player-connection', playerIndex)

  socket.on('disconnect', () => {
    console.log(`Player ${playerIndex} disconnected`)
    connections[playerIndex] = null
    socket.broadcast.emit('player-connection', playerIndex)
  })

  socket.on('player-ready', () => {
    socket.broadcast.emit('enemy-ready', playerIndex)
    connections[playerIndex] = true
  })

  socket.on('check-players', () => {
    const players = []
    for (const i in connections) {
      connections[i] === null ? players.push({connected: false, ready: false}) : players.push({connected: true, ready: connections[i]})
    }
    socket.emit('check-players', players)
  })

  socket.on('fire', id => {
    console.log(`Shot fired from ${playerIndex}`, id)
    socket.broadcast.emit('fire', id)
  })

  socket.on('fire-reply', square => {
    console.log(square)
    socket.broadcast.emit('fire-reply', square)
    var event = {
      
    }
  })

  setTimeout(() => {
    connections[playerIndex] = null
    socket.emit('timeout')
    socket.disconnect()
  }, 600000)
})