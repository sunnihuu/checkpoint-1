// Panel update function for diagnosis
function updatePanel(data) {
    document.getElementById("info").innerHTML = `
        <div style="font-size:16px;font-weight:500;color:#222;margin-bottom:8px;">Neighborhood Diagnosis</div>
        <div style="font-size:13px;color:#777;">Emergency Food Shortfall: ${data.shortfall ? Number(data.shortfall).toLocaleString() : 'N/A'} lbs</div>
        <div style="font-size:13px;color:#777;">Food Insecurity Rate: ${data.insecurity ? data.insecurity + '%' : 'N/A'}</div>
        <div style="font-size:13px;color:#777;">Emergency Sites: ${data.emergency}</div>
        <div style="font-size:13px;color:#777;">Farmers Markets: ${data.markets}</div>
        <div style="font-size:13px;color:#777;">FRESH Policy Support: ${data.fresh ? 'Yes' : 'No'}</div>
        <div style="font-size:13px;color:#222;margin-top:8px;">System Diagnosis: ${data.mismatch || ''}</div>
    `;
}
