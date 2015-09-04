var currentPullRequests = [];

function getData(){
	chrome.storage.sync.get("data", function (obj) {
		if(obj.data.org !== undefined && obj.data.repo !== undefined){
		    var request = new XMLHttpRequest();

			request.open('GET', 'http://github.com/' + obj.data.org + '/' + obj.data.repo + '/pulls', true);

			request.onload = function() {
			  if (this.status >= 200 && this.status < 400) {
			  	parseData(this.response);
			  }
			};

			request.send();
		};
	});
}

function parseData(resp){
    var container = document.implementation.createHTMLDocument().documentElement;
    container.innerHTML = resp;
    var nodeList = container.querySelectorAll('.table-list-issues .js-issue-row .issue-title-link');

   	[].forEach.call(nodeList, function(div, i) {
		currentPullRequests.length = 1;
		if(currentPullRequests.length !== 0){

			if(currentPullRequests.indexOf(div.text.trim()) === -1){
				chrome.storage.sync.get("data", function (obj) {
					chrome.notifications.create(
				        i,{   
				            type:"basic",
				            title:obj.data.org + '/' + obj.data.repo,
				            message: div.text.trim(),
				            iconUrl:"../icons/512.png"
				        }, function() { } 
				    );
				});
			};

			currentPullRequests.push(div.text.trim());
		}
	});

	chrome.notifications.onClicked.addListener(function(id){
    	alert(id);
    });
}

getData();

setInterval(function(){ 
    getData();
}, 5000);