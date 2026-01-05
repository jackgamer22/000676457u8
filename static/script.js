document.addEventListener('DOMContentLoaded', () => {
    const providerSelect = document.getElementById('provider');
    const smsForm = document.getElementById('sms-form');
    const responseDiv = document.getElementById('response');

    // Fetch providers and populate the dropdown
    fetch('/list_providers')
        .then(response => response.json())
        .then(providers => {
            providers.forEach(provider => {
                if (provider.name.includes("Checker") || provider.name.includes("Generator") || provider.name.includes("Option")) {
                    return;
                }
                const option = document.createElement('option');
                option.value = provider.id;
                option.textContent = provider.name;
                providerSelect.appendChild(option);
            });
        });

    // Handle form submission
    smsForm.addEventListener('submit', event => {
        event.preventDefault();

        const formData = new FormData(smsForm);
        const data = {
            provider_id: formData.get('provider'),
            phone_number: formData.get('phone'),
            message: formData.get('message'),
        };

        fetch('/send_sms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then(response => response.json())
            .then(result => {
                responseDiv.textContent = result.message || `Status: ${result.status}`;
                responseDiv.className = result.status === 'success' ? 'success' : 'error';
            })
            .catch(error => {
                responseDiv.textContent = `Error: ${error.message}`;
                responseDiv.className = 'error';
            });
    });
});
