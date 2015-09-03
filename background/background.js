var currentPullRequests = [];

function getData(){
	var request = new XMLHttpRequest();
	request.open('GET', 'https://github.com/nodejs/node/pulls', true);

	request.onload = function() {
	  if (this.status >= 200 && this.status < 400) {
	  	parseData(this.response);
	  }
	};

	request.send();
}

function parseData(resp){
    var container = document.implementation.createHTMLDocument().documentElement;
    container.innerHTML = resp;
    var nodeList = container.querySelectorAll('.table-list-issues .js-issue-row .issue-title-link');

	[].forEach.call(nodeList, function(div) {
		if(currentPullRequests.indexOf(div.text.trim()) === -1){
			console.log("Hc")
			chrome.notifications.create(
		        div.text.trim(),{   
		            type:"basic",
		            title:"New pull request raised!",
		            message: div.text.trim(),
		            iconUrl:"github.png"
		        }, function() { } 
		    );
		}

		currentPullRequests.push(div.text.trim());
    	
	});
}

getData();

setInterval(function(){ 
    getData();
}, 5000);