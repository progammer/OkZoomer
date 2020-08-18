const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

setInterval(function() { 
    var notifOptions = {
        type:"basic",
        iconUrl:"icons/icon48.png",
        title:"Reminder",
        message:"There is a zoom meeting in 5 minutes! Click to join early",
        contextMessage:"OK Zoomer"	

    };
    chrome.notifications.create("remindnotif", notifOptions);
    //alert("seconds have passed"); 
    console.log('TICK');
    sleep(2000).then(() => {
        console.log('slept for 2 seconds')
        chrome.notifications.clear("remindnotif");
    })

}, 3000);