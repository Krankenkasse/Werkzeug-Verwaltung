function formatDate(dateString) {
    if (!dateString) {
        return '';
    }
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', options).replace(',', '');
}

function formatDate_only(dateString) {
    if (!dateString) {
        return '';
    }
    const options = { year: 'numeric', month: '2-digit', day: '2-digit'};
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', options).replace(',', '');
}