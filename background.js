var minuteInMs = 60000;
//var minutesInAdvance = 5; // implement changeable with chrome storage

var secondsOffset = (new Date()).getSeconds();
setTimeout(startHandle, minuteInMs - secondsOffset * 1000);

function startHandle() {
    handleTiming();
    console.log((minuteInMs/1000 - secondsOffset) + " seconds elapsed");
    setInterval(handleTiming, minuteInMs);
}

function formatTime(timeObject) {
    return timeObject.getDay() + ":" + (timeObject.getHours()/10==0 ? "0" : "") + timeObject.getHours() + ":" + (timeObject.getMinutes()/10==0 ? "0" : "") + timeObject.getMinutes(); 
}

function handleTiming() {
    //chrome.notifications.clear("remind-notif");
    //chrome.notifications.clear("join-notif");

    var now = new Date();
    var nowTime = formatTime(now);

    //for later
    var nowGetTime = now.getTime();

    chrome.storage.sync.get({'classList': {}, 'notifNum': 0}, function(classes) {
        var keys = Object.keys(classes.classList);
        var notifNum = classes.notifNum; // to generate more than one notif, unique notif id's

        keys.forEach((key) => {
            var meeting = classes.classList[key];
            var schedule = meeting.classTimes;

            var meetingName = meeting.className;
            
            var url = '';

            // handle timing - TODO: move reminder to centralized location (prob want constant remind time anyways)
            var minutesInAdvance = meeting.remindTime > 0 ? meeting.remindTime : 5; // default to 5 if invalid (no number entered) - accomodates prev ver
            
            var future = new Date(nowGetTime + minutesInAdvance * minuteInMs); 
            var futureTime = formatTime(future); // + ":" + now.getSeconds();
            console.log("now: " + nowTime + ", future: " + futureTime);

            if (meeting.isLink) {
                url = key;
            } else {
                url = `zoommtg://zoom.us/join?action=join&confno=${key}`;
                var password = meeting.password;
                // encodeURIComponent() will not encode: ~!*()'
                if (password) {
                    password = encodeURIComponent(password);
                    /**
                    password.replace('~', '%7E');
                    password.replace('!', '%21');
                    password.replace('*', '%2A');
                    password.replace('(', '%28');
                    password.replace(')', '%29');            
                    password.replace("'", '%27');
                     */
                    url += password ? `&pwd=${password}` : '';
                }
            }
            
            // early notif
            for (var i = 0; i < schedule.length; i++) {
                // console.log(schedule[i]);
                // if reminders are enabled, create the notif
                if (meeting.remind && futureTime==schedule[i]) {
                    var notifOptions = {
                        type:"basic",
                        iconUrl:"icons/icon48.png",
                        title:"OK Zoomer | Meeting Reminder",
                        message:`${meetingName} is starting in ${minutesInAdvance} minutes!`,
                    };
                    chrome.notifications.create("remind-notif" + notifNum, notifOptions);
                    notifNum++;
                }

                /**
                // why is it opening like 1092302138 windows
                chrome.notifications.onClicked.addListener(function(notifId) {
                    if (notifId == "remind-notif") {
                        console.log('opening meeting');
                        window.open(url);
                    }
                });
                */
                
                // if auto join is enabled
                if (meeting.autojoin && nowTime==schedule[i]) {
                    var notifOptions = {
                        type:"basic",
                        iconUrl:"icons/icon48.png",
                        title:"OK Zoomer | Meeting Starting",
                        message:`"${meetingName} is starting now! (auto-joining)`,
                    };
                    chrome.notifications.create("join-notif" + notifNum, notifOptions);
                    notifNum++;
                    window.open(url);
                }
            }
        })
        chrome.storage.sync.set({'notifNum': notifNum});
    })
}