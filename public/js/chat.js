const socket = io()
const $form = document.querySelector("#form")
const $inputField = document.querySelector(".input")
const $messageFormBtn = document.querySelector("#form-btn")
const $sendLocationBtn = document.querySelector("#send-location")
const $messages=document.querySelector('#messages')
const $sidebar=document.querySelector('#sidebar')

//Templates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationTemplate=document.querySelector('#location-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

// Options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})



const autoscroll=()=>{
// Get new message element
const $newMessage=$messages.lastElementChild

// Get height of new message
const newMessageStyles=getComputedStyle($newMessage)
const newMessageMargin=parseInt(newMessageStyles.marginBottom)
const newMessageHeight=$newMessage.offsetHeight + newMessageMargin

// Visible Height
const visibleHeight=$messages.offsetHeight


// Height Of message container
const containerHeight=$messages.scrollHeight

// How far have i scrolled
const scrollOffset=$messages.scrollTop+ visibleHeight

if (containerHeight-newMessageHeight<=scrollOffset) {
  $messages.scrollTop=$messages.scrollHeight
}

}


socket.on("message", (message) => {
  console.log(message)

const html=Mustache.render(messageTemplate,{
  username:message.username,
  message:message.text,
  createdAt:moment(message.createdAt).format('h:mm A' )
})
$messages.insertAdjacentHTML('beforeend',html)

autoscroll()
})

socket.on("locationMessage", (message) => {
// const urlString=url.toString()
const html=Mustache.render(locationTemplate,{
  username:message.username,
  url:message.url,
  createdAt:moment(message.createdAt).format('h:mm A' )
})
$messages.insertAdjacentHTML('beforeend',html)


autoscroll()

})


socket.on('roomData',(roomData)=>{

  const html=Mustache.render(sidebarTemplate,{
    room:roomData.room,
    users:roomData.users
  })

  $sidebar.innerHTML=html

})



$form.addEventListener("submit", (e) => {
  e.preventDefault()



  // Disable
  $messageFormBtn.setAttribute('disabled', 'disabled')
  
  
  const message = $inputField.value
  
  
  
  socket.emit("sendMessage", message, (error) => {

    // Enable
$messageFormBtn.removeAttribute('disabled')
$inputField.value=""
$inputField.focus()

    if (error) {
      return console.log(error)
    }
    console.log("the message is delivered!")
  })
})

// Sharing Location

$sendLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your Browser!")
  }
// Disable
$sendLocationBtn.setAttribute('disabled','disabled')


navigator.geolocation.getCurrentPosition((position) => {
  const letlong = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  }
  socket.emit("sendLocation", letlong, () => {
    
    console.log("Location Shared!")
    $sendLocationBtn.removeAttribute('disabled')
    })


  })
})


socket.emit('join',{username,room},(error)=>{
  if (error) {
    alert(error)
    location.href='/'
  }



})