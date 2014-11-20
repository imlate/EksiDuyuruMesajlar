var pollIntervalMin = 1;  // 1 minute
var pollIntervalMax = 60;  // 1 hour

chrome.browserAction.onClicked.addListener(goToPage);
chrome.runtime.onInstalled.addListener(onInit);
chrome.alarms.onAlarm.addListener(onAlarm);

function goToPage() {
  checkMessages();
  if(localStorage.thereIsMessage == "notLoggedIn") {
	console.log('Going to login page...');
	chrome.tabs.create({url: getEksiDuyuruLoginUrl()});
  } else {
    console.log('Going to inbox...');
	chrome.tabs.create({url: getEksiDuyuruMesajlarUrl()});
  }
}

function getEksiDuyuruMesajlarUrl() {
  return "http://www.eksiduyuru.com/mesajlar/";
}

function getEksiDuyuruLoginUrl() {
  return "http://www.eksiduyuru.com/index.php?m=l";
}

function getEksiDuyuruCheckUrl() {
  return "http://www.eksiduyuru.com/api/?action=message-check";
}

function startRequest() {
  // Schedule request immediately. We want to be sure to reschedule, even in the
  // case where the extension process shuts down while this request is
  // outstanding.
  console.log('startRequest');
  scheduleRequest();
  checkMessages();
}

function checkMessages() {
  console.log('Checking messages');
  var eksiDuyuruSite = new XMLHttpRequest();
  eksiDuyuruSite.open("GET", getEksiDuyuruCheckUrl(), false);
  eksiDuyuruSite.onreadystatechange = function() {
	if(eksiDuyuruSite.readyState == 4) {
	 var xmlDoc = JSON.parse(eksiDuyuruSite.responseText);
	 if(xmlDoc["error"] == "not authenticated") {
	 	console.log("Not logged in");
		localStorage.thereIsMessage = "notLoggedIn";
	  } else if(xmlDoc["has-message"] == "true") {
		console.log('There happens to be at least a message');
		localStorage.thereIsMessage = "true";
	  } else if(xmlDoc["has-message"] == "false") {
		console.log('There is no message');
		localStorage.thereIsMessage = "false";
	  }
	  updateIcon();
	}
  }
  eksiDuyuruSite.send(null);
}

function updateIcon () {
  if(localStorage.thereIsMessage == "notLoggedIn") {
	console.log('Setting icon to not logged in');
	chrome.browserAction.setIcon({path:"icon72.png"});
	chrome.browserAction.setBadgeBackgroundColor({color:[255, 0, 0, 255]});
    chrome.browserAction.setBadgeText({text:"!"});
  } else if (localStorage.thereIsMessage == "true") {
	console.log('Setting icon to there is a message');
	chrome.browserAction.setIcon({path:"thereIsMessage.png"});
	chrome.browserAction.setBadgeText({text:""});
  } else if (localStorage.thereIsMessage == "false") {
    console.log('Setting icon to there is no message');
	chrome.browserAction.setIcon({path:"icon72.png"});
	chrome.browserAction.setBadgeText({text:""});
  }
}

function scheduleRequest() {
  console.log('scheduleRequest');
  var randomness = Math.random() * 2;
  var exponent = Math.pow(2, localStorage.requestFailureCount || 0);
  var multiplier = Math.max(randomness * exponent, 1);
  var delay = Math.min(multiplier * pollIntervalMin, pollIntervalMax);
  delay = Math.floor(delay);
  console.log('Scheduling for: ' + delay);

  console.log('Creating alarm');
  // Use a repeating alarm so that it fires again if there was a problem
  // setting the next alarm.
  chrome.alarms.create('refresh', {periodInMinutes: delay});
}

function onInit() {
  console.log('onInit');
  localStorage.requestFailureCount = 0;  // used for exponential backoff
  startRequest();
}

function onAlarm(alarm) {
  console.log('Got alarm', alarm);
  console.log('Sending to startRequest from onAlarm');
  startRequest();
}
