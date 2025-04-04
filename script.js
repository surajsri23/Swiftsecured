// Block Live Server reloads
const originalReload = window.location.reload;
window.location.reload = function () {
    console.log('Live Server attempted reload at:', new Date().toISOString());
};

let isFetchingHistory = false;
let isOperationPending = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded—DOM ready at:', new Date().toISOString());
    fetchHistory();

    // DOM Elements
    const predictForm = document.getElementById('predict-form');
    const uploadBtn = document.getElementById('upload-btn');
    const csvFileInput = document.getElementById('csv-file');
    const clearDbBtn = document.getElementById('clear-db-btn');
    const startNowBtn = document.getElementById('start-now-btn');
    const exploreBtn = document.getElementById('explore-btn');
    const backToTopBtn = document.getElementById('back-to-top');
    const checkFraudBtn = document.getElementById('check-fraud-btn');
    const uploadResult = document.getElementById('upload-result');
    const predictResult = document.getElementById('predict-result');
    const fraudCheckResult = document.getElementById('fraud-check-result');

    if (!uploadResult) console.error('Element with id="upload-result" not found');
    if (!predictResult) console.error('Element with id="predict-result" not found');
    if (!fraudCheckResult) console.error('Element with id="fraud-check-result" not found');

    document.querySelectorAll('form').forEach((form) => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Form submission prevented:', form.id);
        });
    });

    const inputs = document.querySelectorAll('.transaction-input');
    inputs.forEach((input, index) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                e.preventDefault();
                if (index < inputs.length - 1) inputs[index + 1].focus();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                if (index > 0) inputs[index - 1].focus();
            }
        });
    });

    if (startNowBtn) startNowBtn.addEventListener('click', () => document.getElementById('transaction-check')?.scrollIntoView({ behavior: 'smooth' }));
    if (exploreBtn) exploreBtn.addEventListener('click', () => document.getElementById('how-to-use')?.scrollIntoView({ behavior: 'smooth' }));

    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            backToTopBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
        });
        backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    if (clearDbBtn) {
        clearDbBtn.addEventListener('click', async (e) => {
            try {
                e.preventDefault();
                e.stopPropagation();
                if (isOperationPending) return;
                isOperationPending = true;

                const response = await fetch('http://127.0.0.1:5000/clear_db', {
                    method: 'POST',
                    headers: { 'Cache-Control': 'no-cache' }
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const result = await response.json();
                if (result.error) throw new Error(result.error);

                alert('History cleared!');
                await fetchHistory();
            } catch (error) {
                console.error('Clear DB error:', error);
                alert(`Error clearing history: ${error.message}`);
            } finally {
                isOperationPending = false;
            }
        });
    }

    if (csvFileInput) {
        csvFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const csv = event.target.result.split('\n').slice(0, 5);
                const preview = csv
                    .map((row) => `<tr><td class="p-2">${row.split(',').join('</td><td class="p-2">')}</td></tr>`)
                    .join('');
                if (uploadResult) {
                    uploadResult.innerHTML = `
                        <h3 class="text-xl font-semibold text-white mb-4">CSV Preview (Top 5 Rows)</h3>
                        <div class="overflow-x-auto"><table class="w-full text-white border border-red-600/30">${preview}</table></div>`;
                }
            };
            reader.readAsText(file);
        });
    }

    if (predictForm) {
        predictForm.addEventListener('submit', async (e) => {
            try {
                e.preventDefault();
                e.stopPropagation();
                if (isOperationPending) return;
                isOperationPending = true;

                const formData = new FormData(predictForm);
                const data = Object.fromEntries(formData.entries());

                if (predictResult) {
                    predictResult.innerHTML = '<p class="text-white">Analyzing...</p>';
                    showLoadingAnimation('predict-result');
                }

                console.log('Analyzing data:', data);
                const response = await fetch('http://127.0.0.1:5000/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                console.log('Analyze response:', result);

                if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
                if (result.error) throw new Error(result.error);

                if (predictResult) {
                    predictResult.innerHTML = `
                        <h3 class="text-xl font-semibold text-white mb-4">Fraud Analysis Results</h3>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-white">Risk Level:</span>
                                <span class="px-4 py-1 rounded-full bg-gradient-to-r ${
                                    result.prediction === 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'
                                } text-white font-medium">
                                    ${result.prediction === 0 ? 'Low Risk' : 'High Risk'}
                                </span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-white">Confidence Score:</span>
                                <span class="text-green-400 font-medium">${(result.probability * 100).toFixed(2)}%</span>
                            </div>
                        </div>`;
                    showResultAnimation('predict-result');
                }
                await fetchHistory();
            } catch (error) {
                console.error('Predict error:', error);
                if (predictResult) predictResult.innerHTML = `<p class="text-red-400">Error: ${error.message}</p>`;
            } finally {
                isOperationPending = false;
            }
        });
    }

    if (checkFraudBtn && predictForm) {
        checkFraudBtn.addEventListener('click', async (e) => {
            try {
                e.preventDefault();
                e.stopPropagation();
                if (isOperationPending) return;
                isOperationPending = true;

                const formData = new FormData(predictForm);
                const data = Object.fromEntries(formData.entries());

                if (fraudCheckResult) {
                    fraudCheckResult.innerHTML = '<p class="text-white">Checking fraud...</p>';
                    showLoadingAnimation('fraud-check-result');
                }

                console.log('Checking fraud for:', data);
                const response = await fetch('http://127.0.0.1:5000/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                console.log('Fraud check response:', result);

                if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
                if (result.error) throw new Error(result.error);

                if (fraudCheckResult) {
                    fraudCheckResult.innerHTML = `
                        <p class="text-white">Transaction is: 
                            <span class="${result.prediction === 0 ? 'text-green-400' : 'text-red-400'} font-semibold">
                                ${result.prediction === 0 ? 'Safe' : 'Fraudulent'}
                            </span> 
                            (Probability: ${(result.probability * 100).toFixed(2)}%)
                        </p>`;
                    showResultAnimation('fraud-check-result');
                }
                await fetchHistory();
            } catch (error) {
                console.error('Fraud check error:', error);
                if (fraudCheckResult) fraudCheckResult.innerHTML = `<p class="text-red-400">Error: ${error.message}</p>`;
            } finally {
                isOperationPending = false;
            }
        });
    }

    if (uploadBtn && csvFileInput) {
        uploadBtn.addEventListener('click', async (e) => {
            try {
                e.preventDefault();
                e.stopPropagation();
                if (isOperationPending) return;
                if (!csvFileInput.files.length) {
                    if (uploadResult) uploadResult.innerHTML = '<p class="text-red-400">Please select a CSV file!</p>';
                    return;
                }
                isOperationPending = true;

                const file = csvFileInput.files[0];
                const formData = new FormData();
                formData.append('file', file);

                if (uploadResult) {
                    uploadResult.innerHTML = '<p class="text-white">Uploading and analyzing...</p>';
                    showLoadingAnimation('upload-result');
                }

                console.log('Uploading file:', file.name, 'size:', file.size);
                const response = await fetch('http://127.0.0.1:5000/upload', {
                    method: 'POST',
                    headers: { 'Cache-Control': 'no-cache' },
                    body: formData
                });

                const result = await response.json();
                console.log('Upload response:', result);

                if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
                if (result.error) throw new Error(result.error);

                if (uploadResult) {
                    const fraudCount = result.predictions.reduce((sum, pred) => sum + pred, 0);
                    const totalCount = result.predictions.length;
                    const avgProb = result.probabilities.reduce((sum, prob) => sum + prob, 0) / totalCount * 100;

                    uploadResult.innerHTML = `
                        <h3 class="text-xl font-semibold text-white mb-4">Batch Analysis Results</h3>
                        <div class="space-y-4">
                            <p class="text-white">Processed ${totalCount} transactions</p>
                            <p class="text-white">Fraudulent: ${fraudCount} (${((fraudCount / totalCount) * 100).toFixed(2)}%)</p>
                            <p class="text-white">Average fraud probability: ${avgProb.toFixed(2)}%</p>
                        </div>`;
                    showResultAnimation('upload-result');
                }

                csvFileInput.value = '';
                await fetchHistory();
            } catch (error) {
                console.error('Upload error:', error);
                if (uploadResult) uploadResult.innerHTML = `<p class="text-red-400">Error: ${error.message}</p>`;
            } finally {
                isOperationPending = false;
            }
        });
    }

    window.addEventListener('beforeunload', (e) => {
        if (isOperationPending || isFetchingHistory) {
            e.preventDefault();
            return 'Action in progress—sure you want to leave?';
        }
    });

    window.addEventListener('error', (e) => {
        console.error('Global error:', e.message, e.stack);
    });
});

async function fetchHistory() {
    if (isFetchingHistory) return;
    isFetchingHistory = true;
    try {
        const response = await fetch('http://127.0.0.1:5000/history');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        const historyDiv = document.getElementById('history');
        if (historyDiv) {
            if (!data.history || data.history.length === 0) {
                historyDiv.innerHTML = '<p class="text-gray-400 text-center">No transaction history available.</p>';
                return;
            }

            const historyHtml = data.history.map(item => `
                <div class="p-4 mb-4 border rounded-lg bg-gray-900/30 border-red-600/30">
                    <div class="flex justify-between items-center">
                        <span class="text-white">Transaction ID: ${item.id}</span>
                        <span class="text-gray-400">${new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="mt-2">
                        <span class="text-white">Status: </span>
                        <span class="px-2 py-1 rounded-full ${
                            item.prediction === 0 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                        }">
                            ${item.prediction === 0 ? 'Safe' : 'Fraud'}
                        </span>
                        <span class="ml-2 text-gray-400">(${(item.probability * 100).toFixed(2)}% confidence)</span>
                    </div>
                </div>
            `).join('');
            historyDiv.innerHTML = historyHtml;
        }
    } catch (error) {
        console.error('History fetch error:', error);
        const historyDiv = document.getElementById('history');
        if (historyDiv) historyDiv.innerHTML = `<p class="text-red-400">Error loading history: ${error.message}</p>`;
    } finally {
        isFetchingHistory = false;
    }
}

function showLoadingAnimation(targetId) {
    const element = document.getElementById(targetId);
    if (element) element.classList.add('animate-pulse');
}

function showResultAnimation(targetId) {
    const element = document.getElementById(targetId);
    if (element) {
        element.classList.remove('animate-pulse');
        element.classList.add('animate-fade-in');
    }
}