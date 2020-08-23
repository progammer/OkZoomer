var minuteInMs = 60000;
var minutesInAdvance = 5; // implement changeable

var secondsOffset = (new Date()).getSeconds();
setTimeout(startHandle, minuteInMs - secondsOffset * 1000);

function startHandle() {
    handleTiming();
    console.log((minuteInMs/1000 - secondsOffset) + " elapsed");
    setInterval(handleTiming, minuteInMs);
}

function handleTiming() {
    chrome.notifications.clear("remind-notif");
    chrome.notifications.clear("join-notif");

    var now = new Date();
    var nowTime = now.getDay() + ":" + now.getHours() + ":" + now.getMinutes(); 
    var future = new Date(now.getTime() + minutesInAdvance * minuteInMs); // 5 minutes later
    var futureTime = future.getDay() + ":" + future.getHours() + ":" + future.getMinutes(); // + ":" + now.getSeconds();
    console.log("now: " + nowTime + ", future: " + futureTime);

    chrome.storage.sync.get({'classList': {}}, function(classes) {
        var keys = Object.keys(classes.classList);
        keys.forEach((key) => {
            var meeting = classes.classList[key];
            var schedule = meeting.classTimes;

            var meetingName = meeting.className;
            var url = `zoommtg://zoom.us/join?action=join&confno=${key}`;

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


            // early notif
            for (var i = 0; i < schedule.length; i++) {
                // if reminders are enabled
                if (meeting.remind && futureTime==schedule[i]) {
                    var notifOptions = {
                        type:"basic",
                        iconUrl:"icons/icon48.png",
                        title:"OK Zoomer | Meeting Reminder",
                        message:`"${meetingName} is starting in ${minutesInAdvance} minutes!"`,
                    };
                    chrome.notifications.create("remind-notif", notifOptions);
                }

                chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
                    if (notifId === "remind-notif") {
                        if (btnIdx === 0) {
                            window.open(url);
                        }
                    }
                });
                
                // if auto join is enabled
                if (meeting.autojoin && nowTime==schedule[i]) {
                    var notifOptions = {
                        type:"basic",
                        iconUrl:"icons/icon48.png",
                        title:"OK Zoomer | Meeting Starting",
                        message:`"${meetingName} is starting now! (auto-joining)`,
                    };
                    chrome.notifications.create("join-notif", notifOptions);
                    window.open(url);
                }
            }
        })
    })
}