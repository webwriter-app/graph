import type { MsgFn } from '@lit/localize';
import { formatCsv, fromDot, fromRows, parseCsv, toAdjacencyMatrix, toDot, toEdgeList, type FormatErrors } from '../model/formats';
import type { iGraph } from '../model/types';
import { rowsOf, tableOf } from './table-rows';

/** What the conversions need from the graph widget. */
export type FormatHost = { graph: iGraph; msg: MsgFn; replaceGraph(graph: iGraph): void };

const errorsOf = (host: FormatHost): FormatErrors => ({
    emptyFile: host.msg('The file is empty.'),
    invalidDot: host.msg('The file is not a valid DOT graph.'),
    invalidTable: host.msg('The table must be an edge list (source, target, weight) or a square adjacency matrix.'),
    invalidWeight: host.msg('Weights must be numbers that are not negative.'),
});

/** The conversions and file formats of the widget. Each function runs with the widget as `this`. */
export const graphFormats = {
    /** Takes over a table: an edge list or an adjacency matrix. Declines any other table. */
    loadTable(this: FormatHost, fragment: DocumentFragment): boolean {
        let graph: iGraph;
        try {
            graph = fromRows(rowsOf(fragment), errorsOf(this));
        } catch {
            return false;
        }
        this.replaceGraph(graph);
        return true;
    },

    /** The adjacency matrix as a table. */
    toTable(this: FormatHost): HTMLTableElement | null {
        return this.graph.nodes.length ? tableOf(toAdjacencyMatrix(this.graph)) : null;
    },

    /** Prepares a DOT file; the graph changes when the returned function runs. */
    async importDot(this: FormatHost, file: File): Promise<() => void> {
        const graph = fromDot(await file.text(), errorsOf(this));
        return () => this.replaceGraph(graph);
    },

    /** Prepares a CSV edge list or adjacency matrix; the graph changes when the returned function runs. */
    async importCsv(this: FormatHost, file: File): Promise<() => void> {
        const graph = fromRows(parseCsv(await file.text()), errorsOf(this));
        return () => this.replaceGraph(graph);
    },

    exportDot(this: FormatHost): File | null {
        return this.graph.nodes.length ? new File([toDot(this.graph)], 'graph.gv', { type: 'text/vnd.graphviz' }) : null;
    },

    exportCsv(this: FormatHost): File | null {
        return this.graph.nodes.length ? new File([formatCsv(toEdgeList(this.graph))], 'graph.csv', { type: 'text/csv' }) : null;
    },
};

export const convertFrom = { table: graphFormats.loadTable, '.gv': graphFormats.importDot, '.dot': graphFormats.importDot, '.csv': graphFormats.importCsv };

export const convertTo = { table: graphFormats.toTable, '.gv': graphFormats.exportDot, '.csv': graphFormats.exportCsv };
