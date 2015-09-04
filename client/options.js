document.getElementById("addProject").addEventListener("click", function(e){
	var url = 'http://github.com/' + document.querySelector(".org").value + '/' + document.querySelector(".repo").value + '/pulls' ;

	chrome.storage.sync.set({ 
			'data': { 	
				'org': document.querySelector(".org").value, 
				'repo': document.querySelector(".repo").value
			} 
		}
	);

	e.preventDefault();
});

chrome.storage.sync.get("data", function (obj) {
	document.querySelector(".org").value = obj.data.org;
	document.querySelector(".repo").value = obj.data.repo;
});