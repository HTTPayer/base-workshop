// Load and display data from data.json
async function loadData() {
    try {
        const response = await fetch('./data.json');
        const data = await response.json();

        // Display timestamp
        displayTimestamp(data.generated_at);

        // Display summary
        displaySummary(data.summary);

        // Display Nansen data
        displayNansenData(data.nansen);

        // Display Heurist data
        displayHeuristData(data.heurist);

    } catch (error) {
        console.error('Error loading data:', error);
        document.body.innerHTML = '<div style="text-align: center; padding: 50px; color: #ef4444;">Error loading data. Please try again later.</div>';
    }
}

function displayTimestamp(timestamp) {
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
    document.getElementById('timestamp').textContent = `Data generated: ${formattedDate}`;
}

function displaySummary(summary) {
    const summaryEl = document.getElementById('summary');

    // Handle different response formats
    let summaryText = '';
    if (typeof summary === 'string') {
        summaryText = summary;
    } else if (summary && summary.translated_text) {
        summaryText = summary.translated_text;
    } else if (summary && summary.choices && summary.choices[0]) {
        summaryText = summary.choices[0].message.content;
    } else {
        summaryText = JSON.stringify(summary, null, 2);
    }

    summaryEl.innerHTML = `<p>${summaryText}</p>`;
}

function displayNansenData(nansen) {
    const nansenEl = document.getElementById('nansen-data');

    if (!nansen || !nansen.data || nansen.data.length === 0) {
        nansenEl.innerHTML = '<p>No token data available.</p>';
        return;
    }

    const tokens = nansen.data;

    let tableHTML = `
        <table class="token-table">
            <thead>
                <tr>
                    <th>Token</th>
                    <th>Chain</th>
                    <th>7D Net Flow</th>
                    <th>30D Net Flow</th>
                    <th>Market Cap</th>
                    <th>Sectors</th>
                    <th>Traders</th>
                </tr>
            </thead>
            <tbody>
    `;

    tokens.forEach(token => {
        const flow7d = token.net_flow_7d_usd;
        const flow30d = token.net_flow_30d_usd;

        const flow7dClass = flow7d > 0 ? 'flow-positive' : flow7d < 0 ? 'flow-negative' : 'flow-neutral';
        const flow30dClass = flow30d > 0 ? 'flow-positive' : flow30d < 0 ? 'flow-negative' : 'flow-neutral';

        const sectorsHTML = token.token_sectors && token.token_sectors.length > 0
            ? token.token_sectors.map(s => `<span class="token-sector">${s}</span>`).join('')
            : '<span class="token-sector">Unknown</span>';

        tableHTML += `
            <tr>
                <td class="token-symbol">${token.token_symbol || 'N/A'}</td>
                <td>${token.chain || 'N/A'}</td>
                <td class="${flow7dClass}">${formatCurrency(flow7d)}</td>
                <td class="${flow30dClass}">${formatCurrency(flow30d)}</td>
                <td>${formatCurrency(token.market_cap_usd)}</td>
                <td>${sectorsHTML}</td>
                <td>${token.trader_count || 0}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    nansenEl.innerHTML = tableHTML;
}

function displayHeuristData(heurist) {
    const heuristEl = document.getElementById('heurist-data');

    // Try to extract the actual content from various response formats
    let content = '';

    if (heurist && heurist.result && heurist.result.data) {
        content = heurist.result.data.processed_summary || heurist.result.data;
    } else if (typeof heurist === 'string') {
        content = heurist;
    } else {
        content = JSON.stringify(heurist, null, 2);
    }

    // If content is still an object, try to format it nicely
    if (typeof content === 'object') {
        content = JSON.stringify(content, null, 2);
    }

    // Simple formatting: split by newlines and create paragraphs
    const paragraphs = content.split('\n\n').map(para => {
        // Check if it looks like a citation/source
        if (para.toLowerCase().includes('source') || para.match(/^\d+\./)) {
            return `<div class="news-source">${para}</div>`;
        }
        return `<p>${para}</p>`;
    }).join('');

    heuristEl.innerHTML = `<div class="news-item">${paragraphs}</div>`;
}

function formatCurrency(value) {
    if (value === null || value === undefined) return 'N/A';

    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : value > 0 ? '+' : '';

    if (absValue >= 1000000) {
        return `${sign}$${(absValue / 1000000).toFixed(2)}M`;
    } else if (absValue >= 1000) {
        return `${sign}$${(absValue / 1000).toFixed(2)}K`;
    } else {
        return `${sign}$${absValue.toFixed(2)}`;
    }
}

// Load data when page loads
document.addEventListener('DOMContentLoaded', loadData);
