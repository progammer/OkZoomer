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
            $('body, #nav, #classlist, .modal-content, footer').addClass("darkmode");
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
        $('body, #nav, .modal-content, #classlist, footer').toggleClass("darkmode");
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
        var joinLink = `zoommtg://zoom.us/join?action=join&confno=${classId}`;

        // Get potential password
        chrome.storage.sync.get({'classList': {}}, function(classes) {
            
            if (classes.classList.classId.password != "") {
                console.log(classId + " has password: " + classes.classList.classId.password);
                joinLink += `&pwd=${classes.classList.classId.password}`;
            } else {
                console.log('no password');
            }
        })

        window.open(joinLink);
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
                        classTimes: [],
                        password: "",
                    };
                    // database update
                    chrome.storage.sync.set({'classList': newClassList}, function() {
                        console.log('classList has been updated: added ' + newClassId);
                    });

                    // visual update
                    $('#addModal').modal('hide');
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
    var classRow = document.createElement("tr");
    classRow.className = "class";
    classRow.setAttribute("id", classId);

    var classDescriptor = document.createElement("td");
    classDescriptor.className = "align-center";
    classDescriptor.innerText = classList[classId].className;

    var classButton = document.createElement("button");
    classButton.className = "btn btn-primary btn-block join";
    var mk2 = classId.length == 11 ? 7 : 6;
    classButton.innerText = classId.substring(0, 3) + " " + classId.substring(3, mk2)
    + " " + classId.substring(mk2, 11);
    //classDiv.classList.add("join");
    
    // <div class="del col">&#128465;</div>
    var delButton = document.createElement("td");
    delButton.className = "del clickable";
    delButton.innerHTML = "&times;";

    classRow.appendChild(classDescriptor);
    classRow.appendChild(classButton);
    classRow.appendChild(delButton);
    $("#classlist").append(classRow);
}


