"use strict";

var GitHubNotifier = function(){
    this.currentNotifications = [];
    this.warmRepositories = [];
}

function XHRGetRequest(url){
    return new Promise(function(resolve, reject){
        let request = new XMLHttpRequest();

        request.open('GET', url, true);

        request.onload = function() {
            if (this.status >= 200 && this.status < 400) {
                resolve(this.response);
            }
            
            reject(this)
        }

        request.send();
    });
}

function displayNotification(id, title, message, buttons){
    chrome.notifications.create(
        id,
        {
            type: "basic",
            title: title,
            message: message,
            iconUrl: "../icons/512.png",
            buttons: buttons
        }, 
        function() {}
    );
}

chrome.notifications.onButtonClicked.addListener(
    function(notifId, btnIdx) {
        if (notifId === 'notloggedin') {
            chrome.tabs.create(
                {
                    url: 'https://github.com/login'
                }
            );
        } else if(notifId === '404'){

        } else {
            let notificationInformation = notifId.split(':');
            
            chrome.tabs.create(
                {
                    url: 'http://github.com' + notificationInformation[3]
                }
            );
        }
    }
);

GitHubNotifier.prototype.getData = function(initialRun){
    chrome.storage.sync.get("data", (obj) => {
        obj.data.forEach((project) => {
            let isCold = this.warmRepositories.indexOf(project.org + ":" + project.repo) === -1;

            if(isCold){
                initialRun = true;
            }

            if(project.org !== undefined && project.repo !== undefined){
                XHRGetRequest('http://github.com/' + project.org + '/' + project.repo + '/pulls').then((data) => {
                    this.parseData(data, project.org, project.repo, initialRun, 'pull');
                    return XHRGetRequest('http://github.com/' + project.org + '/' + project.repo + '/issues');
                }).then((data) => {
                    this.parseData(data, project.org, project.repo, initialRun, 'issue');
                    return XHRGetRequest('http://github.com/' + project.org + '/' + project.repo + '/releases');
                }).then((data) => {
                    this.parseData(data, project.org, project.repo, initialRun, 'release');
                }).catch((e) => {
                    if(e.status == 404){
                        displayNotification(
                            '404',
                            'GitHub Notifier - Error',
                            "Error: " + e.status + " " + e.statusText + "\nFor: " + e.responseURL + "\n\nPlease verify the organisation/user and repo are correct."
                        );
                    }else{
                        displayNotification(
                            'notloggedin',
                            'GitHub Notifier - Error',
                            "You don't appear signed into GitHub! \n\n",
                            [{ title: "Sign in" }]
                        );
                    }
                   
                });
            };

            if(isCold){
                this.warmRepositories.push(project.org + ":" + project.repo);
            }
        });
    });
}

GitHubNotifier.prototype.parseData = function(resp, org, repo, initialRun, type){
    let container = document.implementation.createHTMLDocument().documentElement;
    container.innerHTML = resp;

    switch(type){
        case 'pull':
            var selectors = '.table-list-issues .js-issue-row .issue-title-link',
            type = 'pull request'
            break;
        case 'issue':
            var selectors = '.table-list-issues .js-issue-row .issue-title-link',
            type = 'issue'
            break;
        case 'release':
            var selectors = '.release-timeline .release-header .release-title a',
            type = 'release'
            break;
        default:
            var selectors = '.table-list-issues .js-issue-row .issue-title-link',
            type = 'pull request'
            break;
    };

	let notificationNodeList = container.querySelectorAll(selectors),
        notificationMetadataNodeList = container.querySelectorAll('.table-list-issues .js-issue-row  .tooltipped-s'),
        notificationReleaseMetadataNodeList = container.querySelectorAll('.release-timeline .release-authorship a');

    [].forEach.call(notificationNodeList, (notification, i) => {
        if(this.currentNotifications.indexOf(notification.text.trim()) === -1){
            if(!initialRun){
                if(type !== 'release'){
                    var notificationAuthor = notificationMetadataNodeList[i].text.trim();
                }else{
                    var notificationAuthor = notificationReleaseMetadataNodeList[i].text.trim();
                }

                let notificationTitle = notification.text.trim(),
                    notificationLink = notification.attributes['href'].value,
                    message = notificationTitle + '\n\nAuthor: ' + notificationAuthor;

                displayNotification(
                    org + ':' + repo  + ':' + notificationTitle.replace(':', '') + ':' + notificationLink,
                    org + '/' + repo + " - " + type,
                    message,
                    [{ title: "View " + type }]
                );
            }

            this.currentNotifications.push(notification.text.trim());
        };
    });
}

var ghprn = new GitHubNotifier();
ghprn.getData(true);

setInterval(() => ghprn.getData(false), 5000);
