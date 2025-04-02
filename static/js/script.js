// Block live server reloads
window.location.reload = function() {
    console.log('Reload blocked');
};

// Add beforeunload event handler
window.addEventListener('beforeunload', (e) => {
    // Check if there's an ongoing upload or processing
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn && uploadBtn.disabled) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded—DOM ready at:', new Date().toISOString());
    
    // Prevent form submissions from reloading the page
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    // Handle predict form submission
    document.getElementById('predict-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = parseFloat(value);
        });

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            const resultDiv = document.getElementById('predict-result');
            
            if (result.success) {
                if (result.prediction === 1) {
                    resultDiv.innerHTML = `
                        <div class="p-4 text-center border rounded-lg bg-red-900/30 border-red-600/30">
                            <div class="flex items-center justify-center mb-2">
                                <svg class="w-8 h-8 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                                <h3 class="text-xl font-bold text-red-500">Fraudulent Transaction Detected!</h3>
                            </div>
                            <p class="text-red-300">This transaction has been flagged as potentially fraudulent.</p>
                        </div>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <div class="p-4 text-center border rounded-lg bg-green-900/30 border-green-600/30">
                            <div class="flex items-center justify-center mb-2">
                                <svg class="w-8 h-8 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <h3 class="text-xl font-bold text-green-500">Safe Transaction</h3>
                            </div>
                            <p class="text-green-300">This transaction appears to be legitimate.</p>
                        </div>
                    `;
                }
                await fetchHistory();
            } else {
                resultDiv.innerHTML = `
                    <div class="p-4 text-center text-red-400 bg-red-500/10 rounded-lg">
                        <p>Error: ${result.error}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('predict-result').innerHTML = `
                <div class="p-4 text-center text-red-400 bg-red-500/10 rounded-lg">
                    <p>Error processing request</p>
                </div>
            `;
        }
    });

    // Handle CSV file upload
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('csv-file');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const file = fileInput.files[0];
            
            if (!file) {
                alert('Please select a CSV file first');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            try {
                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Uploading...';

                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                const uploadResult = document.getElementById('upload-result');
                if (result.success) {
                    uploadResult.innerHTML = `
                        <div class="p-6 border rounded-lg bg-gray-900/30 border-red-600/30">
                            <h3 class="mb-4 text-xl font-bold text-center">Upload Results</h3>
                            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div class="p-4 text-center border rounded-lg bg-gray-800/50 border-red-600/30">
                                    <p class="text-2xl font-bold text-red-500">${result.fraudulent_count}</p>
                                    <p class="text-gray-300">Fraudulent Transactions</p>
                                </div>
                                <div class="p-4 text-center border rounded-lg bg-gray-800/50 border-green-600/30">
                                    <p class="text-2xl font-bold text-green-500">${result.legitimate_count}</p>
                                    <p class="text-gray-300">Legitimate Transactions</p>
                                </div>
                                <div class="p-4 text-center border rounded-lg bg-gray-800/50 border-blue-600/30">
                                    <p class="text-2xl font-bold text-blue-500">${result.total_count}</p>
                                    <p class="text-gray-300">Total Transactions</p>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    // Clear the file input
                    fileInput.value = '';
                    
                    // Update the history
                    await fetchHistory();
                } else {
                    uploadResult.innerHTML = `
                        <div class="p-4 text-red-400 bg-red-500/10 rounded-lg">
                            <p class="font-semibold">Upload failed!</p>
                            <p>${result.error}</p>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                const uploadResult = document.getElementById('upload-result');
                uploadResult.innerHTML = `
                    <div class="p-4 text-red-400 bg-red-500/10 rounded-lg">
                        <p class="font-semibold">Error uploading file!</p>
                        <p>Please try again later.</p>
                    </div>
                `;
            } finally {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload & Scan';
            }
        });
    }

    // Handle database clearing
    document.getElementById('clear-db-btn').addEventListener('click', async () => {
        if (!confirm('Are you sure you want to clear all transaction history?')) {
            return;
        }

        try {
            const response = await fetch('/clear_db', { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                document.getElementById('history').innerHTML = `
                    <p class="text-center text-gray-400">No transaction history available</p>
                `;
            } else {
                alert('Error clearing database: ' + result.error);
            }
        } catch (error) {
            console.error('Error clearing database:', error);
            alert('Error clearing database. Please try again later.');
        }
    });

    // Handle back to top button
    const backToTopBtn = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.remove('hidden');
        } else {
            backToTopBtn.classList.add('hidden');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Handle navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Initial history fetch
    fetchHistory();
});

// Function to fetch and display history
async function fetchHistory() {
    try {
        const response = await fetch('/history');
        const data = await response.json();
        
        const historyDiv = document.getElementById('history');
        if (!historyDiv) {
            console.error('History div not found');
            return;
        }

        if (!data || data.length === 0) {
            historyDiv.innerHTML = '<p class="text-center text-gray-400">No transaction history available</p>';
            return;
        }

        historyDiv.innerHTML = data.map(item => {
            // Create history item
            const historyItem = document.createElement('div');
            historyItem.className = `p-4 border rounded-lg ${
                item.prediction === 1 
                    ? 'bg-red-900/30 border-red-600/30' 
                    : 'bg-green-900/30 border-green-600/30'
            }`;
            historyItem.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <svg class="w-6 h-6 mr-2 ${item.prediction === 1 ? 'text-red-500' : 'text-green-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            ${item.prediction === 1 
                                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>'
                                : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
                            }
                        </svg>
                        <span class="font-semibold ${item.prediction === 1 ? 'text-red-500' : 'text-green-500'}">
        historyDiv.innerHTML = data.map(item => `
            <div class="p-4 transition-all duration-300 transform rounded-lg bg-gray-900/30 border border-red-600/20 hover:border-red-600/40 hover:shadow-lg hover:shadow-red-600/10">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="text-lg font-semibold">Transaction ID: ${item.id}</p>
                        <p class="text-sm text-gray-400">Time: ${new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                    <span class="px-3 py-1 text-sm font-semibold rounded-full ${
                        item.prediction === 1 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-green-500/20 text-green-400'
                    }">
                        ${item.prediction === 1 ? 'Fraudulent' : 'Legitimate'}
                    </span>
                </div>
                <div class="mt-2 text-sm text-gray-400">
                    <p>Amount: $${item.amount.toFixed(2)}</p>
                    <p>Confidence: ${(item.confidence * 100).toFixed(2)}%</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error fetching history:', error);
        const historyDiv = document.getElementById('history');
        if (historyDiv) {
            historyDiv.innerHTML = '<p class="text-center text-red-400">Error loading transaction history</p>';
        }
    }
} 