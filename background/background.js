var currentPullRequests = [];

function getData(){
	chrome.storage.sync.get("data", function (obj) {
		obj.data.forEach(function(project){
			if(project.org !== undefined && project.repo !== undefined){
			    var request = new XMLHttpRequest();

				request.open('GET', 'http://github.com/' + project.org + '/' + project.repo + '/pulls', true);

				request.onload = function() {
				  if (this.status >= 200 && this.status < 400) {
				  	parseData(this.response, project.org, project.repo);
				  }
				};

				request.send();
			};
		})
	});
}

function parseData(resp, org, repo){
    var container = document.implementation.createHTMLDocument().documentElement;
    container.innerHTML = resp;
    var nodeList = container.querySelectorAll('.table-list-issues .js-issue-row .issue-title-link');

   	[].forEach.call(nodeList, function(div, i) {
		currentPullRequests.length = 1;
		if(currentPullRequests.length !== 0){

			if(currentPullRequests.indexOf(div.text.trim()) === -1){
				chrome.storage.sync.get("data", function (obj) {
					chrome.notifications.create(
				        org + ':' + repo  + ':' + div.text.trim(),{
				            type:"basic",
				            title:org + '/' + repo,
				            message: div.text.trim(),
				            iconUrl:"../icons/512.png",
							buttons: [
								{
					            	title: "View open pull requests"
					        	}
							]
				        }, function() { }
				    );
				});
			};

			currentPullRequests.push(div.text.trim());
		}
	});

	chrome.notifications.onButtonClicked.addListener(function(notifId, btnIdx) {
		var notificatoinInformation = notifId.split(':');

		chrome.tabs.create(
			{
				url: 'http://github.com/' + notificatoinInformation[0] + '/' + notificatoinInformation[1] + '/pulls'
			}
		);
	});
}

getData();

setInterval(function(){
    getData();
}, 5000);
