var GitHubNotifier = function(){
	this.currentPullRequests = [];
}

chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
	var notificationInformation = notifId.split(':');

	chrome.tabs.create(
		{
			url: 'http://github.com/' + notificationInformation[0] + '/' + notificationInformation[1] + '/pulls'
		}
	);
});

GitHubNotifier.prototype.getData = function(initialRun){
	chrome.storage.sync.get("data", function (obj) {
		obj.data.forEach(function(project){
			if(project.org !== undefined && project.repo !== undefined){
			  var request = new XMLHttpRequest();

				request.open('GET', 'http://github.com/' + project.org + '/' + project.repo + '/pulls', true);

				var _this = this;

				data = request.onload = function() {
				  if (this.status >= 200 && this.status < 400) {
				  	_this.parseData(this.response, project.org, project.repo, initialRun);
				  }
				};

				request.send();
			};
		}.bind(this))
	}.bind(this));
}

GitHubNotifier.prototype.parseData = function(resp, org, repo, initialRun){
  var container = document.implementation.createHTMLDocument().documentElement;
  container.innerHTML = resp;
  var nodeList = container.querySelectorAll('.table-list-issues .js-issue-row .issue-title-link');
 	[].forEach.call(nodeList, function(div, i) {
		if(this.currentPullRequests.indexOf(div.text.trim()) === -1){
			if(!initialRun){
				chrome.notifications.create(org + ':' + repo  + ':' + div.text.trim(),
				{
						type:"basic",
						title:org + '/' + repo,
						message: "New pull request opened \n\n" + div.text.trim() + "\n",
						iconUrl:"../icons/512.png",
						buttons: [
							{
				            	title: "View open pull requests"
				        	}
						]
						}, function() {}
				);
			}

			this.currentPullRequests.push(div.text.trim());
		};
	}.bind(this));
}

var ghprn = new GitHubNotifier();

ghprn.getData(true);

setInterval(function(){
	chrome.notifications.getAll(function(data){
		for(var key in data) {
			chrome.notifications.clear(key);
		}
	});

    ghprn.getData(false);
}, 5000);
