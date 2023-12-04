console.log('script.js loaded');
document.addEventListener('DOMContentLoaded', async () => {
  // Retrieve the JWT token from local storage
  const jwtToken = localStorage.getItem('jwtToken');
  console.log('jwtToken', jwtToken);


  // If the token is not present, you may choose to handle it (e.g., redirect to login page)
  if (!jwtToken) {
    console.error('JWT token not found. Please log in.');
    return;
  }

  const createPlanForm = document.getElementById('createPlanForm');
  const resultContainer = document.getElementById('result');

  createPlanForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const code = document.getElementById('code').value;
    const html = document.getElementById('html').value;
    const title = document.getElementById('title').value;
    const url = document.getElementById('url').value;
    const zipCode = document.getElementById('zipCode').value;

    try {
      const response = await fetch('/createPlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`, // Include the JWT token in the Authorization header
        },
        body: JSON.stringify({ Code: code, HTML: html, Title: title, Url: url, ZipCode: zipCode }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create plan: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      resultContainer.textContent = result.message;
    } catch (error) {
      console.error('Error creating plan:', error);
      resultContainer.textContent = 'Error creating plan. Please try again.';
    }
  });
});
