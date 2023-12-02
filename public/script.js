document.addEventListener('DOMContentLoaded', () => {
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
  