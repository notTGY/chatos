const socket = io('/')
const videoGrid = document.getElementById('wrapper')
onresize=_=>{
  videoGrid.style.height = Math.ceil(.9*window.visualViewport.height) + 'px';
}
onresize();
const myPeer = new Peer(undefined)
const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
const streams = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)
  muteButton.click();
  hideCamButton.click();

  myPeer.on('call', call => {
    call.answer(stream)
    call.on('stream', userVideoStream => {
      const video = document.createElement('video')
      addVideoStream(video, userVideoStream)
    })
  })


  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) {
    peers[userId].call.close()
    peers[userId].video.remove()
  } else {
    let allVids = document.querySelectorAll('video');
    keys = Object.keys(peers);
    allVids.forEach(item => {
      let cond = 0;
      keys.forEach(k => {
        if (k == item.id) {
          cond = 1;
        }
      });
      if (!cond && item != myVideo) {
        item.remove();
      }
    });
  }
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    console.log('removing vid of caller');
    video.remove()
  })

  peers[userId] = {call,video}
}

function addVideoStream(video, stream) {
  if (document.getElementById(stream.id)) {
    return 0;
  }
  video.id = stream.id;
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}


let muteButton = document.getElementById('mute');
let hideCamButton = document.getElementById('hideCam');

muteButton.addEventListener('click', e=> {
  myVideo.srcObject.getTracks().forEach((item, i) => {
    if(item.kind == 'audio') {
      item.enabled = !item.enabled;
      if (item.enabled) {
        muteButton.innerHTML = 'mute';
      } else {
        muteButton.innerHTML = 'unmute';
      }
    }
  });
});

hideCamButton.addEventListener('click', e=> {
  myVideo.srcObject.getTracks().forEach((item, i) => {
    if(item.kind == 'video') {
      item.enabled = !item.enabled;
      if (item.enabled) {
        hideCamButton.innerHTML = 'switch cam off';
      } else {
        hideCamButton.innerHTML = 'switch cam on';
      }
    }
  });
});
