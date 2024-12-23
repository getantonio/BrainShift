const checkbox = document.getElementById('consentCheckbox');
const nextButton = document.getElementById('nextButton');

// Enable the button when the checkbox is checked
checkbox.addEventListener('change', () => {
  nextButton.disabled = !checkbox.checked;
});

// Navigate to the next page
nextButton.addEventListener('click', () => {
  window.location.href = 'questionnaire.html'; // Replace with your actual next page
});
