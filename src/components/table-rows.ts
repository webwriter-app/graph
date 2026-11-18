import type { Rows } from '../model/formats';

/** The text of every cell of every row of the tables in the fragment. */
export function rowsOf(fragment: DocumentFragment): Rows {
    return Array.from(fragment.querySelectorAll('tr'), (row) => Array.from(row.querySelectorAll('th, td'), (cell) => cell.textContent?.trim() ?? ''));
}

/** A table whose first row and first column are headers. */
export function tableOf(rows: Rows): HTMLTableElement {
    const [header, ...body] = rows;
    const table = document.createElement('table');
    const line = (texts: string[], rowHeader: boolean) => {
        const row = document.createElement('tr');
        texts.forEach((text, i) => {
            const cell = document.createElement(!rowHeader || i === 0 ? 'th' : 'td');
            cell.textContent = text;
            row.append(cell);
        });
        return row;
    };
    const head = document.createElement('thead');
    head.append(line(header, false));
    const tbody = document.createElement('tbody');
    tbody.append(...body.map((row) => line(row, true)));
    table.append(head, tbody);
    return table;
}
