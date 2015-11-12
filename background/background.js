var GitHubNotifier = function(){
	this.currentNotifications = [];
	this.warmRepositories = [];
}

function XHRGetRequest(url){
	return new Promise(function(resolve, reject){
		var request = new XMLHttpRequest();

		request.open('GET', url, true);

		var _this = this;

		data = request.onload = function() {
			if (this.status >= 200 && this.status < 400) {
				resolve(this.response);
			}else{
				reject(this.status)
			}
		}

		request.send();
	});
}

function displayNotification(id, title, message, buttons){
	chrome.notifications.create(id,
	{
			type: "basic",
			title: title,
			message: message,
			iconUrl: "../icons/512.png",
			buttons: buttons
			}, function() {}
	);
}

chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
	if(notifId === 'notloggedin'){
		chrome.tabs.create(
			{
				url: 'https://github.com/login'
			}
		);
	}else{
		var notificationInformation = notifId.split(':');

		chrome.tabs.create(
			{
				url: 'http://github.com' + notificationInformation[3]
			}
		);
	}
});

GitHubNotifier.prototype.getData = function(initialRun){
	chrome.storage.sync.get("data", (obj) => {
		obj.data.forEach((project) => {
			if(this.warmRepositories.indexOf(project.org + ":" + project.repo) !== -1){
				initialRun = true;
			}

			if(project.org !== undefined && project.repo !== undefined){
				XHRGetRequest('http://github.com/' + project.org + '/' + project.repo + '/pulls').then((data) => {
					this.parseData(data, project.org, project.repo, initialRun, 'pull');
					return XHRGetRequest('http://github.com/' + project.org + '/' + project.repo + '/issues');
				}).then((data) => {
					this.parseData(data, project.org, project.repo, initialRun, 'issue');
				}).catch((e) => {
					console.log(e)
					displayNotification(
						'notloggedin',
						'GitHub Notifier - Error',
						"You don't appear signed into GitHub! \n\n",
						[{ title: "Sign in" }]
					);
				});
			};

			this.warmRepositories.push(project.org + ":" + project.repo);
		})
	});
}

GitHubNotifier.prototype.parseData = function(resp, org, repo, initialRun, type){
	var container = document.implementation.createHTMLDocument().documentElement;
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
		default:
			var selectors = '.table-list-issues .js-issue-row .issue-title-link',
			type = 'pull request'
			break;
	};

	var nodeList = container.querySelectorAll(selectors);
	var notificationMetadataNodeList = container.querySelectorAll('.table-list-issues .js-issue-row  .tooltipped-s');

	[].forEach.call(nodeList, (notification, i) => {
			if(this.currentNotifications.indexOf(notification.text.trim()) === -1){
				if(!initialRun){
					var notificationTitle = notification.text.trim(),
						notificationLink = notification.attributes['href'].value,
						notificationAuthor = notificationMetadataNodeList[i].text.trim();
						console.log(notificationAuthor);
					displayNotification(
						org + ':' + repo  + ':' + notificationTitle.replace(':', '') + ':' + notificationLink,
						org + '/' + repo + " - " + type,
						notificationTitle + '\n\nAuthor: ' + notificationAuthor,
						[{ title: "View " + type }]
					);
				}

				this.currentNotifications.push(notification.text.trim());
			};
	});
}

var ghprn = new GitHubNotifier();

ghprn.getData(true);

setInterval(() => {
    ghprn.getData(false);
}, 5000);
