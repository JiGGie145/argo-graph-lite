import { autorun, runInAction } from "mobx";

import PreferencesStore from "./PreferencesStore";
import GraphStore from "./GraphStore";
import ImportStore from "./ImportStore";
import ProjectStore from "./ProjectStore";
// import { peakCSV } from "../services/CSVUtils";
import parse from "csv-parse/lib/sync";
import SearchStore from "./SearchStore";
import { runSearch } from "../ipc/client";

export class AppState {
  constructor() {
    this.preferences = new PreferencesStore();
    this.graph = new GraphStore();
    this.import = new ImportStore();
    this.search = new SearchStore();
    this.project = new ProjectStore();
  }
}

const appState = new AppState();

window.appState = appState;

const loadSnapshotFromURL = (url) => {
  return fetch(url, {
    method: 'GET',
    mode: 'cors'
  }).then(response => response.text());
};

window.loadInitialSampleGraph = async () => {
  // default fallback url
  let url = "https://argo-graph-lite.s3.amazonaws.com/lesmiserables.json";

  // check url hash
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    try {
      url = decodeURIComponent(hash);
    } catch (e) {
      console.error(e);
      alert('Provided URL is not valid.');
    }
  }
  loadSnapshotFromURL(url).then(snapshotString => {
    appState.graph.loadImmediateStates(snapshotString);
  });
};

window.saveSnapshotToString = () => {
  const snapshotString = appState.graph.saveImmediateStates();
  return snapshotString;
};

// Load initial sample graph when Argo Lite is ready
window.addEventListener('load', (event) => {
  window.loadInitialSampleGraph();
});

const updateTimeout = null;

// Load graph on frontend once the rawGraph has been returned from IPC
// Once a graph has been loaded and displayed, even if nodes are all deleted, still consider it "hasGraph"
autorun(() => {
  if (!appState.graph.hasGraph && appState.graph.rawGraph.nodes.length > 0) {
    appState.graph.hasGraph = true;
  }
})

autorun(() => {
  if (appState.graph.frame) {
    appState.graph.frame.setAllNodesShape(appState.graph.nodes.shape);
    appState.graph.frame.setLabelRelativeSize(appState.graph.nodes.labelSize);
    appState.graph.frame.setLabelLength(appState.graph.nodes.labelLength);
    appState.graph.frame.updateGraph(appState.graph.computedGraph);
  }
});

autorun(() => {
  if (appState.graph.frame && appState.graph.positions) {
    appState.graph.frame.updatePositions(appState.graph.positions);
    appState.graph.positions = null;
  }
});

// autorun(() => {
//   const nodeFile = appState.import.importConfig.nodeFile;
//   if (nodeFile.path) {
//     peakCSV(nodeFile.path, nodeFile.hasColumns, edgeFile.delimiter).then(it => {
//       runInAction("preview top N lines of node file", () => {
//         nodeFile.topN = it;
//         nodeFile.columns = Object.keys(it[0]);
//         nodeFile.mapping.id = nodeFile.columns[0];
//         nodeFile.ready = true;
//       });
//     });
//   }
// });

autorun(() => {
  const searchStr = appState.search.searchStr;
  if (searchStr.length >= 3) {
    runSearch(searchStr);
  } else {
    appState.search.panelOpen = false;
    appState.search.candidates.splice(0, appState.search.candidates.length);
    if (appState.graph.frame) {
      appState.graph.frame.highlightNodeIds([], true);
    }
  }
});

// autorun(() => {
//   const edgeFile = appState.import.importConfig.edgeFile;
//   if (edgeFile.path) {
//     peakCSV(edgeFile.path, edgeFile.hasColumns, edgeFile.delimiter).then(it => {
//       runInAction("preview top N lines of edge file", () => {
//         edgeFile.topN = it;
//         edgeFile.columns = Object.keys(it[0]);
//         edgeFile.mapping.fromId = edgeFile.columns[0];
//         edgeFile.mapping.toId = edgeFile.columns[0];
//         edgeFile.ready = true;
//       });
//     });
//   }
// });

// Argo-lite specific: extract CSV from File object and update related fields.
autorun(() => {
  const file = appState.import.selectedEdgeFileFromInput;
  const hasHeader = appState.import.importConfig.edgeFile.hasColumns;
  const delimiter = appState.import.importConfig.edgeFile.delimiter;

  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.readAsText(file);

  reader.onload = () => {
    // Read entire CSV into memory as string
    const fileAsString = reader.result;
    // Get top 20 lines. Or if there's less than 10 line, get all the lines.
    const lines = fileAsString.split('\n');
    const lineNumber = lines.length;
    const topLinesAsString = lines.map(l => l.trim()).filter((l, i) => i < 20).join('\n');
    console.log(topLinesAsString);

    // Parse the top lines
    const it = hasHeader ? parse(topLinesAsString, {
        comment: "#",
        trim: true,
        auto_parse: true,
        skip_empty_lines: true,
        columns: hasHeader,
        delimiter
      }) : parse(topLinesAsString, {
        comment: "#",
        trim: true,
        auto_parse: true,
        skip_empty_lines: true,
        columns: undefined,
        delimiter
      });

    runInAction("preview top N lines of edge file", () => {
      appState.import.importConfig.edgeFile.topN = it;
      appState.import.importConfig.edgeFile.columns = Object.keys(it[0]);
      appState.import.importConfig.edgeFile.mapping.fromId = appState.import.importConfig.edgeFile.columns[0];
      appState.import.importConfig.edgeFile.mapping.toId = appState.import.importConfig.edgeFile.columns[0]
      appState.import.importConfig.edgeFile.ready = true;
    });
  };

  reader.onerror = () => {
    console.error(reader.error);
  };
});

autorun(() => {
  const file = appState.import.selectedNodeFileFromInput;
  const hasHeader = appState.import.importConfig.nodeFile.hasColumns;
  const delimiter = appState.import.importConfig.nodeFile.delimiter;

  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.readAsText(file);

  reader.onload = () => {
    // Read entire CSV into memory as string
    const fileAsString = reader.result;
    // Get top 20 lines. Or if there's less than 10 line, get all the lines.
    const lines = fileAsString.split('\n');
    const lineNumber = lines.length;
    const topLinesAsString = lines.map(l => l.trim()).filter((l, i) => i < 20).join('\n');
    console.log(topLinesAsString);

    // Parse the top lines
    const it = hasHeader ? parse(topLinesAsString, {
        comment: "#",
        trim: true,
        auto_parse: true,
        skip_empty_lines: true,
        columns: hasHeader,
        delimiter
      }) : parse(topLinesAsString, {
        comment: "#",
        trim: true,
        auto_parse: true,
        skip_empty_lines: true,
        columns: undefined,
        delimiter
      });

    runInAction("preview top N lines of edge file", () => {
      appState.import.importConfig.nodeFile.topN = it;
      appState.import.importConfig.nodeFile.columns = Object.keys(it[0]);
      appState.import.importConfig.nodeFile.mapping.fromId = appState.import.importConfig.nodeFile.columns[0];
      appState.import.importConfig.nodeFile.mapping.toId = appState.import.importConfig.nodeFile.columns[0]
      appState.import.importConfig.nodeFile.ready = true;
    });
  };

  reader.onerror = () => {
    console.error(reader.error);
  };
});

export default appState;
