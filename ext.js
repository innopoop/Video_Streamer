/*
  When the popup is loaded, get the references for the form on the popup
  and add an event listener for the submit button

  Once the button is clicked, send the input values as a message to the
  background script
*/
document.addEventListener("DOMContentLoaded", () => {
  var myForm = document.getElementById("playlist-song");
  var playlist = document.getElementById("playlist");
  var song = document.getElementById("song");

  console.log(playlist);
  console.log(song);

  myForm.addEventListener("submit", (e) => {
    e.preventDefault();
    //check for valid URL
    let re = /https\:\/\/www\.youtube\.com\/playlist\?list\=(.*)/i;
    let re2 = /https\:\/\/www\.youtube\.com\/watch\?v\=.*\&list\=(.*)/i;
    playlist = String(playlist.value);

    //playlist ID
    let plID = getPLID(playlist, re);
    if (!plID) {
      plID = getPLID(playlist, re2);
    }
    if (!plID) {
      createError();
      return;
    }
    console.log(plID);
    execute(plID, String(song.value));
  });
});

/*
  When the popup receives a response from the background script containing an
  error statement, it will display the error to the user
*/
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request.error) {
    return;
  }
  createError();
});

function createError() {
  if (document.getElementById("error")) {
    return;
  }
  let div = document.createElement("div");
  div.innerHTML =
    "A valid youtube playlist starts with 'https://www.youtube.com/playlist?list='. Please check your URL and try again.";
  div.id = "error";
  console.log(div);
  document.body.appendChild(div);
  setTimeout(() => {
    document.getElementById("error").remove();
  }, 8000);
}

function getPLID(url, regex) {
  let match = url.match(regex);

  return match ? match[1] : null;
}

function execute(listId, vid) {
  var key = "AIzaSyAHWcI3VyLBUnMqetk7XZxK6KybC21ZzaI";
  var URL = "https://www.googleapis.com/youtube/v3/playlistItems?";
  var options = {
    part: ["snippet"],
    key: key,
    playlistId: listId,
    maxResults: 100,
  };

  chrome.runtime.sendMessage({
    URL: URL,
    key: key,
    options: options,
    vid: vid,
  });
}
