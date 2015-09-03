document.getElementById("addProject").addEventListener("click", function(e){
	var url = 'http://github.com/' + document.querySelector(".org").value + '/' ++ document.querySelector(".repo").value + '/pulls' ;
	
	e.preventDefault();
});