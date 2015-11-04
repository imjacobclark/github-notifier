var GitHubNotifier = function(){
	this.currentPullRequests = [];
}

GitHubNotifier.prototype.getData = function(){
	chrome.storage.sync.get("data", function (obj) {
		obj.data.forEach(function(project){
			if(project.org !== undefined && project.repo !== undefined){
			  var request = new XMLHttpRequest();

				request.open('GET', 'http://github.com/' + project.org + '/' + project.repo + '/pulls', true);

				var _this = this;

				data = request.onload = function() {
				  if (this.status >= 200 && this.status < 400) {
				  	_this.parseData(this.response, project.org, project.repo);
				  }
				};

				request.send();
			};
		}.bind(this))
	}.bind(this));
}

GitHubNotifier.prototype.parseData = function(resp, org, repo){
  var container = document.implementation.createHTMLDocument().documentElement;
  container.innerHTML = resp;
  var nodeList = container.querySelectorAll('.table-list-issues .js-issue-row .issue-title-link');

 	[].forEach.call(nodeList, function(div, i) {
		if(this.currentPullRequests.length === 0){
			this.currentPullRequests.length = 1;
		}else{
			if(this.currentPullRequests.indexOf(div.text.trim()) === -1){
				chrome.notifications.create(div.text.trim(),
				{
						type:"basic",
						title:org + '/' + repo,
						message: div.text.trim(),
						iconUrl:"../icons/512.png"
						}, function() {}
				);
			};

			this.currentPullRequests.push(div.text.trim());
		}
	}.bind(this));
}

var ghprn = new GitHubNotifier();

ghprn.getData();

setInterval(function(){
    ghprn.getData();
}, 5000);
