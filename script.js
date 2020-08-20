// Submits -> Set Chrome API -> Chrome Storage -> Get Chrome API (repeat)
$(function() {
    var emojis = Array('&#128526;','&#9996;','&#129321;','&#129297;');
    //get random effect from effects array
    var emoji = emojis[Math.floor(Math.random()*emojis.length)];
    $('#randomemoji').html(emoji);

    $('#cleardb').click(function() {
        chrome.storage.sync.clear(function() {
            window.close('','_parent','');
        })
    })

    // Display classes
    chrome.storage.sync.get({'classList': {}}, function(classes) {
        var keys = Object.keys(classes.classList);
        if (keys.length != 0) {
            $("#absence").css('display', 'none');
            keys.forEach((key, index) => {
                console.log(`${key}: ${classes.classList[key].className}`);
                addClassDisplay(classes.classList, key);
                //$('#classlist').text(`${key}: ${classes[key]}`);
            });
        } else {
            $("#absence").css('display', 'flex');
        }
    })

    // Dark Mode [load]- defaulted to true
    chrome.storage.sync.get({'darkOn': true}, function(style) {
        var darkOn = style.darkOn;
        if (darkOn) {
            $('#lightswitch').prop('checked', true);
            $('body, #nav, .table, .modal-content, footer').addClass("darkmode");
        }
        chrome.storage.sync.set({'darkOn': darkOn}, function() {
            console.log('Darkmode started ' + darkOn);
        })
    })

    // Dark Mode [toggle]
    $('#lightswitch').click(function() {
        chrome.storage.sync.get({'darkOn': true}, function(style) {
            var darkOn = !style.darkOn;
            chrome.storage.sync.set({'darkOn': darkOn});
        })
        $('body, #nav, .modal-content, .table, footer').toggleClass("darkmode");
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
                    // visual update
                    var keys = Object.keys(classes.classList);
                    if (keys.length == 0) {
                        $("#absence").css('display', 'flex');
                    }
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

        /** 
        // Get potential password
        chrome.storage.sync.get({'classList': {}}, function(classes) {
            classList = classes.classList;
            if (classList[classId].password != "") {
                console.log(classId + " has password: " + classList[classId].password);
                joinLink += `&pwd=${classList[classId].password}`;
            } else {
                console.log('no password');
            }
        })
        */
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
                    $('#error-message').text('Meeting ID already exists!');
                } else {
                    newClassList[newClassId] = {
                        className: $("#className").val() == "" ? "Zoom Meeting" : $("#className").val(),
                        classTimes: [],
                        password: "",
                        notifications: false,
                    };

                    // database update
                    chrome.storage.sync.set({'classList': newClassList}, function() {
                        console.log('classList has been updated: added ' + newClassId);
                    });

                    // visual update
                    $("#absence").css('display', 'none');
                    addClassDisplay(newClassList, newClassId);
                    $('#addModal').modal('hide');
                }
            } else {
                $('#error-message').text('Please enter a valid ID!');
            }
            // for each value "" ... of modal form
            $('#classId').val('');
            $('#className').val('');
        })
    })

    // $(selector).event is directly bound
    // .on creates a delegated binding for newly generated items

    // $('#staticParent').on('click', '.dynamicElement', function() {
    // Do something on an existent or future .dynamicElement
    // });

    $("#classlist").on("keypress", ".namedisplay", function(e) {
        if (e.which == '13') {
            // blur the textbox
            $(this).children()[0].blur();
            //e.preventDefault();
        }
    });

    $("#classlist").on("focusout", ".namedisplay", function() {
        var classId = $(this).parent()[0].id;
        var updatedName = $(this).text();
        saveName(classId, updatedName);
    });

    // Preferences for meetings [load]
    $('#classlist').on("click", ".edit", function() {
        var parentId = $(this).parent()[0].id;
        var previousId = $('#editmodal').prop('name');
        // prevent unnecessary reloading bc rerender on each delete and add to preserve accuracy of name indices
        if (parentId != previousId) {
            $('#editmodal').prop('name', parentId); // content block
            $('#editmodal').children(".modal-header").children(".modal-title").text('Editing #' + parentId);
            chrome.storage.sync.get({'classList': {}}, function(classes) {
                var classList = classes.classList;
                if (classList[parentId]) {
                    $('#editmodal').children(".modal-body").children(".modal-title").text('Editing #' + parentId);
                    if(classList[parentId].classTimes.length != 0) {
                        $('#notimes').hide();
                        for (var i = 0; i < classList[parentId].classTimes.length; i++) {
                            var dayElement = document.createElement("li");
                            dayElement.className = "classtime clickable list-group-item";
                            dayElement.name = i;
                            var fTime = classList[parentId].classTimes[i].split(":");
                            fTime = getWeekday(fTime[0]) + " @ " + fTime[1]%12 + ":" + fTime[2] + " " + (fTime[1]/12 ? "AM" : "PM"); // :)
                            dayElement.innerText = fTime;
                            $('#editmodal').children(".modal-body").children("#scheduledtimes")[0].appendChild(dayElement);
                        }
                    }
                }
            })
        }
        $('#editmodal').closest('.modal').modal('toggle');
    })

    // remove a classtime
    $('#editmodal').on('click', '.classtime', function () {
        chrome.storage.sync.get({'classList': {}}, function(classes) {
            var clickedIndex = $(this).prop('name');
            var parentId = $(this).closest("#editmodal").prop('name');
            
            // database update
            if (classes.classList[parentId].classTimes) {
                var updatedClassList = classes.classList;
                console.log(updatedClassList[parentId].classList);
                updatedClassList[parentId].classTimes.splice(clickedIndex, 1);
                console.log(updatedClassList[parentId].classList);
                chrome.storage.sync.set({'classList': updatedClassList});
            }
            //visual update
            if (updatedClassList[parentId].classTimes.length == 0) {
                $('#notimes').show();
            }
 
            $('.classtime').prop('name', clickedIndex)[clickedIndex].remove();
        })

    });

    // add a classtime
    $('#savetime').click(function() {
        var editedId = $(this).closest('#editmodal').prop('name');
        var day = $("#dayselect option:selected").val(); // -1 if invalid
        var time = $("#schedule").val(); // blank string if invalid
        if (day != -1 && time) {
            chrome.storage.sync.get({'classList': {}}, function(classes) {
                var fTime = day + ":" + time;//formatted time is dayIndex:hour:minute
                console.log(fTime);
                console.log(classes.classList[editedId].classTimes);
                console.log(classes.classList[editedId].classTimes.includes(fTime));
                // only add if not already included
                if (!classes.classList[editedId].classTimes.includes(fTime)) {
                    var updatedClassList = classes.classList;
                    // db update
                    updatedClassList[editedId].classTimes.push(fTime);
                    chrome.storage.sync.set({'classList': updatedClassList}, function() {
                        // visual update
                        $("#savetimemsg").css("color", "#1E90FF");
                        $("#savetimemsg").text("Saved time!");
                    });
                } else {
                    $("#savetimemsg").css("color", "red");
                    $("#savetimemsg").text("Already exists!");
                }
            })
        } else {
            $("#savetimemsg").css("color", "red");
            $("#savetimemsg").text("Invalid time!");
        }
    })
})

function getWeekday(dayIndex) {
    var weekday = new Array(7);
    weekday[0] = "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";
    return weekday[dayIndex];
}

function saveName(classId, updatedName) {
    chrome.storage.sync.get({'classList': {}}, function(classes) {
        if (classes.classList.hasOwnProperty(classId)) {
            var updatedClassList = classes.classList;
            updatedClassList[classId].className = updatedName;
            chrome.storage.sync.set({'classList': updatedClassList});
        }
    })
}

function addClassDisplay(classList, classId) {
    // Create div for the class: composed of button and breaks
    var classRow = document.createElement("tr");
    classRow.className = "class d-flex align-items-center";
    classRow.setAttribute("id", classId);

    var classDescriptor = document.createElement("td");
    classDescriptor.className = "col-5 text-truncate text-center namedisplay";
    var nameDiv = document.createElement("div");
    nameDiv.setAttribute('contenteditable', 'true');
    nameDiv.setAttribute('spellcheck', 'false');
    nameDiv.innerText = classList[classId].className;
    classDescriptor.appendChild(nameDiv);

    var classButton = document.createElement("button");
    classButton.className = "btn btn-primary btn-block join";
    classButton.style = "display: flex;align-items: center;justify-content: center;";
    var mk2 = classId.length == 11 ? 7 : 6;
    classButton.innerText = classId.substring(0, 3) + " " + classId.substring(3, mk2)
    + " " + classId.substring(mk2, 11);
    var temp = document.createElement("td");
    temp.className = "col-5";
    temp.appendChild(classButton);
    classButton = temp;

    var delButton = document.createElement("td");
    delButton.className = "col-1 del clickable";
    delButton.innerHTML = '<i class="fas fa-minus-circle"></i>';

    var editButton = document.createElement("td");
    editButton.className = "col-1 edit clickable";
    editButton.innerHTML = '<i class="fas fa-cog"></i>';

    classRow.appendChild(classDescriptor);
    classRow.appendChild(classButton);
    classRow.appendChild(delButton);
    classRow.appendChild(editButton);
    $("#classlist").append(classRow);
}