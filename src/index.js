const path = require("path")
const express = require("express")
const http = require("http")
const socketio = require("socket.io")
const Filter = require("bad-words")

const generateMessage = require("./utils/messages")

const usersFunc = require("./utils/users")

const utilsFunc = require("./utils/messages")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const PORT = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, "../public")

app.use(express.static(publicDirectoryPath))

app.get("", (req, res) => {
  res.render("index")
})

// When user connect to server we use io.on
io.on("connection", (socket) => {
  console.log("New WebSocket Connection")

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = usersFunc.addUser(socket.id, username, room)
    if (error) {
      return callback(error)
    }

    socket.join(room)

    socket.emit("message", utilsFunc.generateMessage(user.username,"Welcome"))
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        utilsFunc.generateMessage(user.username,`${user.username} has joined this room!`)
      )


      io.to(user.room).emit('roomData',{
        room:user.room,
        users:usersFunc.getUsersInRoom(user.room)
      })

    callback()
  }) 

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter()
    if (filter.isProfane(message)) {
      return callback("Profanity is not Allowed!")
    }

    const user=usersFunc.getUser(socket.id)

    io.to(user.room).emit("message", utilsFunc.generateMessage(user.username,message))
    callback("DELIVERED")
  })

  // Sharing location Came from client to server
  socket.on("sendLocation", (letlong, callback) => {
    // io.emit("message",`My Location is Lat-${letlong.longitude} Long-${letlong.longitude}`)
const user=usersFunc.getUser(socket.id)

    io.to(user.room).emit(
      "locationMessage",
      utilsFunc.generateLocationMessage(user.username,
        `https://www.google.com/maps?q=${letlong.latitude},${letlong.longitude}`
      )
    )
    callback()
  })

  // when user gets disconnected from the server we use socket.on
  socket.on("disconnect", () => {

    const user=usersFunc.removeUser(socket.id)
    if(user){
      io.to(user.room).emit("message", utilsFunc.generateMessage(user.username,`${user.username} has left the room!`))
      io.to(user.room).emit('roomData',{
        room:user.room,
        users:usersFunc.getUsersInRoom(user.room)
      })
    }

  })
})

server.listen(PORT, () => {
  console.log("Server is working on port 3000!")
})
