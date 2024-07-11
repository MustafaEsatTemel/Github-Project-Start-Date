// Check if the current page is a GitHub repository
if (window.location.hostname === 'github.com') {
  const pathParts = window.location.pathname.split('/').filter(Boolean);

  if (pathParts.length >= 2) {
    const owner = pathParts[0];
    const repo = pathParts[1];

    // Make API call to get repository information
    fetch(`https://api.github.com/repos/${owner}/${repo}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        const startDate = new Date(data.created_at);
        const formattedDate = startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        // Create a new div to show the start date
        const startDateDiv = document.createElement('div');
        startDateDiv.textContent = `This project started on ${formattedDate}`;
        startDateDiv.className = 'project-start-date';

        // Insert the div into the GitHub repository page
        const aboutSection = document.querySelector('.BorderGrid-cell .f4');
        if (aboutSection) {
          aboutSection.appendChild(startDateDiv);
        } else {
          console.warn('About section not found');
        }

        // Append the styles to the head of the document
        const style = document.createElement('style');
        style.textContent = `
          .project-start-date {
            margin-top: 10px;
            font-style: italic;
            font-weight: bold;
            background: linear-gradient(45deg, #ff6b6b, #f7e272, #60d394, #5085f0);
            -webkit-background-clip: text;
            color: transparent;
            animation: gradient-animation 3s ease infinite;
          }
          @keyframes gradient-animation {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `;
        document.head.appendChild(style);
      })
      .catch(error => {
        console.error('Error fetching repository information:', error);
      });
  }
}
