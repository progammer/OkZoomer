// Submits -> Set Chrome API -> Chrome Storage -> Get Chrome API (repeat)
$(function() {
    var emojis = Array('&#128526;','&#9996;','&#129321;','&#129297;');
    //get random effect from effects array
    var emoji = emojis[Math.floor(Math.random()*emojis.length)];
    $('#randomemoji').html(emoji);

    $('#cleardb').click(function() {
        chrome.storage.sync.clear(function() {
            console.log('cleared db');
        })
    })

    $('#support').click(function() {

    })

    $('#myModal').on('shown.bs.modal', function () {
        $('#myInput').trigger('focus')
    })

    // Display classes
    chrome.storage.sync.get('classList', function(classes) {
        if (classes.classList) {
            var keys = Object.keys(classes.classList);
            keys.forEach((key, index) => {
                console.log(`${key}: ${classes.classList[key].className}`);
                addClassDisplay(classes.classList, key);
                //$('#classlist').text(`${key}: ${classes[key]}`);
            });
        }
    })

    // Dark Mode [load]- defaulted to true
    chrome.storage.sync.get({'darkOn': true}, function(style) {
        var darkOn = style.darkOn;
        if (darkOn) {
            $('#lightswitch').prop('checked', true);
            $('body, #nav, footer').addClass("darkmode");
        }
        chrome.storage.sync.set({'darkOn': darkOn}, function() {
            console.log('Darkmode started ' + darkOn);
        })
    })

    // Dark Mode [toggle]
    $('#lightswitch').click(function() {
        chrome.storage.sync.get({'darkOn': true}, function(style) {
            var darkOn = !style.darkOn;
            chrome.storage.sync.set({'darkOn': darkOn}, function() {
                console.log('changed to ' + darkOn);
            })
        })
        $('body, #nav, footer').toggleClass("darkmode");
    });

     
    // Delete Class 
    $("#classlist").on("click", ".del", function() {
        var classRow = $(this).parent()[0];
        // database update
        chrome.storage.sync.get({'classList': {}}, function(classes) {
            if (classes.classList.hasOwnProperty(classRow.id)) {
                var currentClassList = classes.classList;
                delete currentClassList[classRow.id];

                chrome.storage.sync.set({'classList': currentClassList}, function() {
                    console.log('successfully removed meeting #' + classRow.id);
                });
            }
        })
        // visual update
        classRow.remove(".class");
    })

    // Join class
    $("#classlist").on("click", ".join", function(){
        var classId = $(this).text().replace(/\s/g, '');
        window.open(`zoommtg://zoom.us/join?action=join&confno=${classId}`);
    });

    // Enter key procs submit
    $('#classId, #className').keypress(function(e){
        if(e.keyCode==13)
        $('#enterClassId').click();
    });

    // Submit class id
    $('#enterClassId').click(function() {
        chrome.storage.sync.get({'classList': {}}, function(classes) {
            let newClassList = {};
            if (classes.classList != {}) {
                newClassList = classes.classList;
            }

            // Reg-ex'd Input (only numbers)
            var newClassId = $('#classId').val();
            // Digits only (0-9), global matches
            newClassId = newClassId.replace(/\D/g,'');;

            // Check if ID is valid
            if (newClassId.length >= 9 && newClassId.length <= 11) {
                // Reset error message
                $('#error-message').text('');
                // Check if class id was already registered
                if (newClassList.hasOwnProperty(newClassId)) {
                    console.log('class ' + newClassId + ' already exists');
                    $('#error-message').text('The class ID already exists!');
                } else {
                    newClassList[newClassId] = {
                        className: $("#className").val() == "" ? "Zoom Meeting" : $("#className").val(),
                        classTimes: []
                    };
                    chrome.storage.sync.set({'classList': newClassList}, function() {
                        console.log('classList has been updated: added ' + newClassId);
                    });
                    addClassDisplay(newClassList, newClassId);
                }
            } else {
                $('#error-message').text('Please enter a valid class ID!');
            }
            $('#classId').val('');
            $('#className').val('');
        })
    })
})

function addClassDisplay(classList, classId) {
    // Create div for the class: composed of button and breaks
    var classDiv = document.createElement("div");
    classDiv.className = "class row";
    classDiv.setAttribute("id", classId);

    var classDescriptor = document.createElement("div");
    classDescriptor.innerText = classList[classId].className;

    var classButton = document.createElement("button");
    classButton.className = "btn btn-primary join";
    var mk2 = classId.length == 11 ? 7 : 6;
    classButton.innerText = classId.substring(0, 3) + " " + classId.substring(3, mk2)
    + " " + classId.substring(mk2, 11);
    //classDiv.classList.add("join");
    
    // <div class="del col">&#128465;</div>
    var delButton = document.createElement("div");
    delButton.className = "col del clickable";
    delButton.innerHTML = "&#128465;";

    classDiv.appendChild(wrapInColDiv(classDescriptor));
    classDiv.appendChild(wrapInColDiv(classButton));
    classDiv.appendChild(delButton);
    classDiv.appendChild(document.createElement("br"));
    classDiv.appendChild(document.createElement("br"));
    $("#classlist").append(classDiv);
}

function wrapInColDiv(element) {
    var div = document.createElement("div");
    div.className = "col";
    div.appendChild(element);
    return div;
}
