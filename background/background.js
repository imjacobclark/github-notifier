"use strict";

let warmRepositories = [],
    currentNotifications = [],
    intervalID,
    currentRefresh;
    
chrome.notifications.onButtonClicked.addListener(
    function(notifId, btnIdx) {
        chrome.tabs.create(
            {
                url: 'http://github.com' + notifId.split(':')[3]
            }
        );
    }
);

function XHRGetRequest(url){
    return new Promise(function(resolve, reject){
        let request = new XMLHttpRequest();

        request.open('GET', url, true);

        // Set GitHub user agent (good web citizen)
        request.setRequestHeader('X-GH-UserAgent', 'github-notifier-v1.11.1');

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

function getData(initialRun){
    chrome.storage.sync.get("data", (obj) => {
        obj.data.forEach((project) => {
            setTimeout(function () {
                let organisation = project.org,
                    repository = project.repo,
                    githubProjectUrl = 'http://github.com/' + organisation + '/' + repository,
                    isCold = warmRepositories.indexOf(organisation + ":" + repository) === -1;

                if(isCold){
                    initialRun = true;
                    warmRepositories.push(organisation + ":" + repository);
                }

                if(organisation !== undefined && repository !== undefined){
                    XHRGetRequest(githubProjectUrl + '/pulls').then((data) => {
                        parseData(data, organisation, repository, initialRun, 'pull');
                        return XHRGetRequest(githubProjectUrl + '/issues');
                    }).then((data) => {
                        parseData(data, organisation, repository, initialRun, 'issue');
                        return XHRGetRequest(githubProjectUrl + '/releases');
                    }).then((data) => {
                        parseData(data, organisation, repository, initialRun, 'release');
                    }).catch((e) => {
                        console.error('There was an issue fetching ' + e.responseURL + ' from Github. Error: ', e);
                    });
                };
            }, 60000)
        });
    });
}

function parseData(resp, org, repo, initialRun, type){
    let container = document.implementation.createHTMLDocument().documentElement,
        selectors;

    container.innerHTML = resp;

    switch(type){
        case 'pull':
            selectors = '.table-list-issues .js-issue-row .issue-title-link',
            type = 'pull request'
            break;
        case 'issue':
            selectors = '.table-list-issues .js-issue-row .issue-title-link',
            type = 'issue'
            break;
        case 'release':
            selectors = '.release-timeline .release-header .release-title a',
            type = 'release'
            break;
        default:
            selectors = '.table-list-issues .js-issue-row .issue-title-link',
            type = 'pull request'
            break;
    };

    let notificationNodeList = container.querySelectorAll(selectors),
        notificationMetadataNodeList = container.querySelectorAll('.table-list-issues .js-issue-row  .tooltipped-s'),
        notificationReleaseMetadataNodeList = container.querySelectorAll('.release-timeline .release-authorship a');

    [].forEach.call(notificationNodeList, (notification, i) => {
        if(currentNotifications.indexOf(notification.text.trim()) === -1){
            if(!initialRun){
                let notificationAuthor = notificationMetadataNodeList[i].text.trim(),
                    notificationTitle = notification.text.trim(),
                    notificationLink = notification.attributes['href'].value;

                if (type === 'release') {
                    notificationAuthor = notificationReleaseMetadataNodeList[i].text.trim(); 
                }

                displayNotification(
                    org + ':' + repo  + ':' + notificationTitle.replace(':', '') + ':' + notificationLink,
                    org + '/' + repo + " - " + type,
                    notificationTitle + '\n\nAuthor: ' + notificationAuthor,
                    [{ title: "View " + type }]
                );
            }

            currentNotifications.push(notification.text.trim());
        };
    });
    
    chrome.storage.sync.get("refresh", (obj) => {
        if(currentRefresh !== obj.refresh){
            clearInterval(intervalID);
            
            if(obj.refresh <= 180000){
                obj.refresh = 180000;
            };

            currentRefresh = obj.refresh;

            intervalID = setInterval(() => getData(false), currentRefresh);
        }
    });
}

// Initial run to prevent notification flooding
getData(true);

// Poll for new notifications every x seconds
chrome.storage.sync.get("refresh", (obj) => {
    if(obj.refresh === undefined || obj.refresh <= 180000){
        obj.refresh = 180000;
    }
    
    currentRefresh = obj.refresh;
    intervalID = setInterval(() => getData(false), currentRefresh);
});
