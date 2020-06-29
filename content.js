//executes after a webpage loads

// document.addEventListener("DOMContentLoaded", () => {
//   var slider = document.querySelector(
//     "#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar"
//   );
//   chrome.runtime.sendMessage({
//     slider: slider,
//   });
//   var length = Number(slider["aria-valuemax"]);
//   localStorage.setItem("index", 0);
//   var index = 0;
//   var cycle = 0;
//   var videos = JSON.parse(localStorage.getItem());
//   var song = localStorage.getItem("currentSong");
//   slider.onchange = () => {
//     let valNow = Number(slider["aria-valuenow"]);
//     if (length > valNow * 0.96) {
//       const video = videos[index];
//       if (video.url === song) index++;
//       playVid(localStorage.getItem("tabID"), song);
//       cycle++;
//     }
//   };
// });
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  var slider = document.querySelector(
    "#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar"
  );
  var currentTime = document.querySelector(
    "#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > div > span.ytp-time-current"
  );
  //#overlays > ytd-thumbnail-overlay-time-status-renderer > span
  var sent = false;
  const length = slider.getAttribute("aria-valuemax");
  const times = document.querySelectorAll(
    "span.ytd-thumbnail-overlay-time-status-renderer"
  );
  var nextURL =
    "https://www.youtube.com" +
    document.querySelector("#thumbnail").getAttribute("href");
  var min = Number(times[0].innerHTML.replace(/:/, ""));
  for (const time of times) {
    console.log(nextURL);
    const curTime = Number(time.innerHTML.replace(/:/, ""));
    if (curTime < min) {
      min = curTime;
      nextURL =
        "https://www.youtube.com" +
        time.parentElement.parentElement.parentElement.getAttribute("href");
    }
  }
  // console.log(nextURL);
  currentTime.addEventListener("DOMSubtreeModified", () => {
    let valNow = Number(slider.getAttribute("aria-valuenow"));
    if (valNow == length && !sent) {
      sent = true;
      chrome.runtime.sendMessage({
        tab: request.tab,
        url: nextURL,
        max: length,
      });
    }
  });
  // var hour, min, sec, total;
  // if (length.length > 5) {
  //   let substr = length.replace(/\:.*/, "");
  //   hour = Number(substr) * 3600;
  //   substr = substr.replace(/\:.*/, "");
  //   min = Number(substr) * 60;
  //   sec = Number(substr.replace(/\:/, ""));
  //   total = hour + min + sec;
  // } else {
  //   let substr = length.replace(/\:.*/, "");
  //   min = Number(substr) * 60;
  //   sec = Number(substr.replace(/\:/, ""));
  //   total = hour + min + sec;
  // }
  // waitForVid(TOTAL, request.tab);
});

// async function waitForVid(time, tabId) {
//   console.log("Entered Wait");
//   await setTimeout(() => {
//     console.log("Timeout done");
//     chrome.runtime.sendMessage({
//       tab: tabId,
//     });
//   }, time * 1000);
// }
