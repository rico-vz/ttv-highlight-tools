function isInRange(date, start, end) {
    const targetDate = new Date(date);
    return targetDate >= start && targetDate <= end;
}

function filterHighlightsByDateRange(highlights, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return highlights.filter(highlight =>
        isInRange(highlight.created_at, start, end)
    );
}

function filterHighlightsByYearMonth(highlights, year, month = null) {
    return highlights.filter(highlight => {
        const date = new Date(highlight.created_at);
        if (month !== null) {
            return date.getFullYear() === year && date.getMonth() === month - 1;
        }
        return date.getFullYear() === year;
    });
}

module.exports = {
    filterHighlightsByDateRange,
    filterHighlightsByYearMonth
};