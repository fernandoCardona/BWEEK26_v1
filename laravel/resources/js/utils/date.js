export function formatDMY(value) {
    if (!value) return '';
    if (value instanceof Date) return formatDMYFromDate(value);
    const s = String(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return formatDMYFromYMD(s);
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return formatDMYFromDate(d);
}

export function formatDMYFromYMD(ymd) {
    const [yyyy, mm, dd] = String(ymd ?? '').split('-');
    if (!yyyy || !mm || !dd) return '';
    return `${dd}-${mm}-${yyyy}`;
}

export function formatDMYFromDate(d) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    return `${dd}-${mm}-${yyyy}`;
}

export function formatTimeHM(value) {
    if (!value) return '';
    if (value instanceof Date) return value.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    const s = String(value);
    if (/^\d{2}:\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

export function normalizeTimeHM(time) {
    const t = String(time ?? '').trim();
    if (!t) return '00:00';
    const [hh, mm] = t.split(':');
    return `${String(hh ?? '00').padStart(2, '0')}:${String(mm ?? '00').padStart(2, '0')}`;
}

export function computeEndDay(ymd, startHM, endHM) {
    if (!ymd) return '';
    const s = Number(String(startHM).replace(':', ''));
    const e = Number(String(endHM).replace(':', ''));
    if (Number.isFinite(s) && Number.isFinite(e) && e < s) {
        const d = new Date(`${ymd}T00:00:00Z`);
        d.setUTCDate(d.getUTCDate() + 1);
        return d.toISOString().slice(0, 10);
    }
    return ymd;
}

