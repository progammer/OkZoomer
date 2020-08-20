var intervalTimeInMs = 3000; // 60000 minute

setInterval(function() { 
    var notifOptions = {
        type:"basic",
        iconUrl:"icons/icon48.png",
        title:"Reminder",
        message:"There is a zoom meeting in 5 minutes! Click to join early",
        contextMessage:"OK Zoomer"	

    };
    // chrome.notifications.create("remindnotif", notifOptions);
    var now = new Date();
    var day = now.getDay();
    var time = now.getDay() + ":" + now.getHours() + ":" + now.getMinutes(); // + ":" + now.getSeconds();
    console.log("today is " + day + ", " + time);

    // check every minute
}, intervalTimeInMs);