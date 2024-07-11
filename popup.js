document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var tab = tabs[0];
    var url = tab.url;
    
    // Check if the current tab is a GitHub repository
    if (url.includes("github.com")) {
      var repoUrl = new URL(url);
      var pathParts = repoUrl.pathname.split("/");
      var owner = pathParts[1];
      var repo = pathParts[2];
      
      // Make API call to get repository information
      fetch(`https://api.github.com/repos/${owner}/${repo}`)
        .then(response => response.json())
        .then(data => {
          var startDate = new Date(data.created_at);
          var formattedDate = startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
          document.getElementById('start-date').textContent = `This project started on ${formattedDate}`;
        })
        .catch(error => {
          console.error('Error fetching repository information:', error);
          document.getElementById('start-date').textContent = 'Error fetching project start date';
        });
    } else {
      document.getElementById('start-date').textContent = 'This is not a GitHub repository';
    }
  });
});
