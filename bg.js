//opens when u open chrome
window.songURL = "";
window.lists = {};
window.index = 0;
window.cycle = 0;
window.tenMin = 0;
/*listen for the message from both the popup extension and from the future
  tabs you will create with streaming
*/

/*  If you switch windows, the extension stops
 *  Peek-a-Boo: 3 views
    Chenster rocks his sticks: 17 views
    for u alex: 35 views
    We are so good: 33 views
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.tab) {
    const ls = JSON.parse(
      localStorage.getItem(localStorage.getItem("currentId"))
    );
    const len = ls.length;
    if (window.index >= len) window.index = 0;
    let url = ls[window.index].url;
    console.log(
      window.cycle,
      window.index,
      ls[window.index].title,
      url,
      window.tenMin
    );

    if (window.tenMin > 599 && window.cycle === 2) {
      window.cycle = 0;
      window.tenMin = 0;
      url = window.songURL;
      window.index--;
      console.log("Cycle", window.songURL);
    } else if (url === window.songURL && window.index < len - 1) {
      console.log("same as song");
      window.index++;
      url = ls[window.index].url;
      window.tenMin += Number(request.max);
    } else if (url === window.songURL) {
      console.log("reset");
      window.index = 0;
      url = request.url;
      window.tenMin += Number(request.max);
    } else {
      window.tenMin += Number(request.max);
    }
    console.log("Video to be played", url);
    chrome.tabs.get(request.tab, (rsp) => {
      console.log(url);
      chrome.tabs.update(rsp.id, { url: url, active: rsp.active }, async () => {
        await setTimeout(() => {
          console.log("sent message");
          chrome.tabs.sendMessage(rsp.id, {
            tab: rsp.id,
            url: url,
          });
        }, 5000);
      });
    });
    window.index++;
    window.cycle++;
    return;
  }
  window.index = 0;
  window.cycle = 0;
  window.tenMin = 0;
  const URL = request.URL;
  const options = request.options;
  const playlist = request.options.playlistId;
  const vid = request.vid;
  let list = JSON.parse(localStorage.getItem(playlist));
  if (vid && playlist && URL) {
    if (list.length === 0) {
      console.log("no existing list");

      window.lists[playlist] = [];
      const asyncAddVids = async () => {
        await addVids(URL, options, window.lists[playlist], vid, 0.0);
        await localStorage.setItem(
          playlist,
          JSON.stringify(window.lists[playlist])
        );
        await localStorage.setItem("xxxVid" + vid, window.songURL);
        await localStorage.setItem("currentId", playlist);
        await chrome.tabs.create({ url: window.songURL }, async (tab) => {
          await localStorage.setItem("currentTab", tab.id);
          await setTimeout(() => {
            console.log("sent message");
            chrome.tabs.sendMessage(tab.id, {
              tab: tab.id,
              url: window.songURL,
            });
          }, 5000);
        });
      };
      asyncAddVids();
      return;
    }
    var similarity = 0.0;
    window.songURL = localStorage.getItem("xxxVid" + vid);
    console.log(list);
    if (!window.songURL) {
      for (const item of list) {
        if (item.title.indexOf(vid) >= 0) {
          window.songURL = item.url;
          break;
        }
        let newSim = checkSimilarity(item.title, vid);
        if (newSim > similarity) {
          similarity = newSim;
          window.songURL = item.url;
        }
      }
    }
    chrome.tabs.create({ url: window.songURL }, async (tab) => {
      localStorage.setItem("currentTab", tab.id);
      console.log(localStorage.getItem("currentTab"));
      await setTimeout(() => {
        console.log("sent message");
        chrome.tabs.sendMessage(tab.id, {
          tab: tab.id,
          url: window.songURL,
        });
      }, 5000);
    });
  }
});

//function that takes in url and callback function and returns an xmlResponse
// var getHTML = function (url, callback) {
//   if (!window.XMLHttpRequest) return;
//   var xhr = new XMLHttpRequest();
//   xhr.onreadystatechange = function () {
//     console.log(this.responseXML);
//     if (xhr.readyState === 4) callback(this.responseXML);
//   };
//   xhr.open("GET", url);
//   xhr.responseType = "document";
//   xhr.send();
// };

async function addVids(URL, options, vidList, video, similarity, next = "") {
  if (next) {
    options.pageToken = next;
  }
  //"https://www.googleapis.com/youtube/v3/playlistItems"
  var songURL = URL;
  for (const opt in options) {
    songURL += opt + "=" + options[opt] + "&";
  }

  songURL = songURL.slice(0, -1);
  returnURL = "";
  console.log(songURL);
  await fetch(songURL)
    .then((response) => response.json())
    .then(async (obj) => {
      console.log("OBJ", obj);
      for (const vid of obj.items) {
        console.log(vid);
        const vidURL =
          "https://www.youtube.com/watch?v=" + vid.snippet.resourceId.videoId;
        vidList.push({
          title: vid.snippet.title,
          url: vidURL,
        });
        console.log(vidList[vid.snippet.title]);
        if (similarity === 1.0) {
          return;
        } else if (vid.snippet.title.indexOf(video) >= 0) {
          console.log(vidURL);
          similarity = 1.0;
          window.songURL = vidURL;
        } else {
          const newSim = checkSimilarity(vid.snippet.title, video);
          if (newSim > similarity) {
            console.log(newSim);
            similarity = newSim;
            window.songURL = vidURL;
          }
        }
      }
      console.log(obj["nextPageToken"]);
      if (obj["nextPageToken"]) {
        console.log("next Pge");
        await addVids(
          URL,
          options,
          vidList,
          video,
          similarity,
          obj.nextPageToken
        );
      }
    })
    .catch((err) => console.log(err));
}
//Path
//document.querySelector("#content")
//https://www.youtube.com/playlist?list=PLsPUh22kYmNDRYfImV3BzNZ6yTwhIpe0k

//Levenshtein distance & error formula
function checkSimilarity(s1, s2) {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) return 1.0;
  return (
    (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)
  );
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
