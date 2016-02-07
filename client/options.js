"use strict";

function populateProjectList(){
    chrome.storage.sync.get("data", function (obj) {
        if(obj.data === null || obj.data === undefined || obj.data.length === 0){
            document.querySelector('.add-project__new-user').style.display = 'block'
            document.querySelector('.add-project__been-here-before').style.display = 'none';
        }else{
            document.querySelector('.add-project__been-here-before').style.display = 'block';
            document.querySelector('.add-project__new-user').style.display = 'none'
        }

        let projectForms = document.querySelector('.add-project__forms');
        projectForms.innerHTML = "";

        obj.data.forEach(function(project){
            if(project.org !== "" || project.repo !== ""){
                projectForms.insertAdjacentHTML("beforeend", '\
                    <div class="add-project__form">\
                    <input type="text" value="' + project.org + '" placeholder="Organisation/User" class="org">\
                    <input type="text" value="' + project.repo + '" placeholder="Repo" class="repo">\
                    <button class="mdl-button mdl-js-button mdl-button--icon" value="Delete">\
                        <i class="delete material-icons">delete</i>\
                    </button>\
                </div>');
            }
        });
        
        attachDeleteEvents();
    });
}

function saveProjects(){
    let projects = document.querySelectorAll('.add-project__form'),
        projectStorageArr = [];

    for(let i = 0; i < projects.length; i++){
        if(projects[i].querySelector(".org").value !== "" || projects[i].querySelector(".repo").value !== ""){
            projectStorageArr.push({
                org: projects[i].querySelector(".org").value,
                repo: projects[i].querySelector(".repo").value
            });
        }
    }

    chrome.storage.sync.set(
        {
            'data': projectStorageArr
        }
    );
}

function attachDeleteEvents(){
    let projects = document.querySelectorAll('.delete');
    
    for (var i = 0; i < projects.length; ++i) {
        projects[i].addEventListener("click", function(e){
            let repo = e.target.parentNode.parentNode.querySelector('.repo').value,
                org = e.target.parentNode.parentNode.querySelector('.org').value;
            
            chrome.storage.sync.get("data", function (obj) {
                let projects = obj.data;
                
                for(var i = 0; i < projects.length; i++) {
                    if(projects[i].repo === repo && projects[i].org == org) {
                        projects.splice(i, 1);
                        break;
                    }
                }
                
                chrome.storage.sync.set(
                    {
                        'data': projects
                    }
                );
                
                e.target.parentNode.parentNode.remove();
            });            
        });
    }
}

document.querySelector(".add-project__save-bttn").addEventListener("click", function(e){
    saveProjects();
    e.preventDefault();
});

document.querySelector('.add-project__watch-new-bttn').addEventListener("click", function(e){
    saveProjects();

    let projectForms = document.querySelector('.add-project__forms');

    projectForms.insertAdjacentHTML("beforeend", '\
        <div class="add-project__form">\
        <input type="text" placeholder="Organisation/User" class="org" title="This is the text of the tooltip">\
        <input type="text" placeholder="Repo" class="repo">\
    </div>');

    e.preventDefault();
});

populateProjectList();