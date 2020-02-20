const jsnx = require('jsnetworkx');
const jsgraphs = require('js-graph-algorithms');

/**
 * Convert Argo-lite snapshot for use in the JSNetworkX library.
 * @param {*} snapshot Argo-lite Snapshot Object exported by GraphStore
 */
export function convertToJsnx(snapshot) {
    const jsnxGraph = new jsnx.Graph();
    jsnxGraph.addNodesFrom(snapshot.rawGraph.nodes.map(n => [n.id, n]));
    jsnxGraph.addEdgesFrom(snapshot.rawGraph.edges.map(e => [e.source_id, e.target_id]));
    return jsnxGraph;
}

/**
 * Convert Argo-lite snapshot for use in the ngraph library.
 * @param {*} snapshot Argo-lite Snapshot Object exported by GraphStore
 */
export function convertToNGraph(snapshot) {
    return null;
}

/**
 * Convert Argo-lite snapshot for use in the js-graph-algorithms library.
 * @param {*} snapshot Argo-lite Snapshot Object exported by GraphStore
 */
export function convertToJSGraph(snapshot) {
    var idDict = {};
    var i;
    for (i = 0; i < snapshot.rawGraph.nodes.length; i++) {
        idDict[snapshot.rawGraph.nodes[i].id] = i;
    }
    var g = new jsgraphs.Graph(snapshot.rawGraph.nodes.length);
    snapshot.rawGraph.edges.forEach(e => {
        g.addEdge(idDict[e.source_id], idDict[e.target_id]);
    });
    return new jsgraphs.ConnectedComponents(g);
}

/**
 * Convert Argo-lite snapshot to the GEXF format.
 * @param {*} snapshot Argo-lite Snapshot Object exported by GraphStore
 */
export function convertToGexf(snapshot) {
    return null;
}

/**
 * Calculate the average clustering coefficient of the (undirected unweighted) graph.
 * @param {*} snapshot Argo-lite Snapshot Object exported by GraphStore
 */
export function averageClusteringCoefficient(snapshot) {
    const jsnxGraph = convertToJsnx(snapshot);
    const result = jsnx.averageClustering(jsnxGraph);
    console.log('Computing Clustering Coefficient');
    return result;
}

/**
 * Calculate the number of connected components in a graph
 * @param {*} rawGraph the rawGraph inside appState
 */
export function connectedComponents(snapshot) {
    var cc = convertToJSGraph(snapshot);
    return cc.componentCount();
}
 