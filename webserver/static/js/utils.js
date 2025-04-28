class Utils {
  constructor(props = {}) {
  }

  getCommunityNodeIds(community) {
    const nodeIds = [];
    community.firstView.data[community.id].graph.nodes.map((node) => {
      if (!nodeIds.some((item) => item.id === node.id)) nodeIds.push(node);
    });

    return nodeIds;
  }

  getCommunityNodesById(community, ids) {
    const nodes = community.firstView.nodeMetadata.filter((node) => {
      return ids.some((idObj) => idObj.id === node.nodeId);
    });

    const filteredNodes = this.removeDuplicates(nodes);

    return filteredNodes;
  }

  getLabelsPercentages(nodes) {

    // count occurrences of each label
    const labelCounts = {};

    nodes.forEach((node) => {
      labelCounts[node.category] = (labelCounts[node.category] || 0) + 1;
    });

    // calculate occurrence percentage for each label
    const totalCommunityNodes = nodes.length;
    const labelsPercentages = [];
    const nodesIds = [];

    Object.keys(labelCounts).forEach((label) => {
      const occurrencePercentage = labelCounts[label] / totalCommunityNodes;
      labelsPercentages.push({
        label: label,
        count: labelCounts[label],
        percentage: occurrencePercentage.toFixed(4),
        nodesIds: nodesIds.push({ id: label.id }),
      });
    });

    return { labelsPercentages, totalCommunityNodes };
  }

  calculateEdgeLabelsPercentagesInGlobalView(edges) {

    // count occurrences of each label
    const labelCounts = {};

    edges.forEach((edge) => {
      labelCounts[edge] = (labelCounts[edge] || 0) + 1;
    });

    // calculate occurrence percentage for each label
    const totalCommunityEdges = edges.length;
    const labelsPercentages = [];

    Object.keys(labelCounts).forEach((label) => {
      const occurrencePercentage = labelCounts[label] / totalCommunityEdges;
      labelsPercentages.push({
        label: label,
        count: labelCounts[label],
        percentage: occurrencePercentage.toFixed(4),
      });
    });

    return { labelsPercentages, totalCommunityEdges };
  }

  calculateEdgeLabelPercentages(edgeLabels) {
    const totalLabels = edgeLabels.length;
    const labelCounts = {};
  
    // Count occurrences of each label
    edgeLabels.forEach(label => {
      if (labelCounts[label]) {
        labelCounts[label]++;
      } else {
        labelCounts[label] = 1;
      }
    });
  
    // Calculate percentages
    const labelPercentages = {};
    for (const label in labelCounts) {
      labelPercentages[label] = ((labelCounts[label] / totalLabels) * 100).toFixed(2) + '%';
    }
  
    return labelPercentages;
  }

  removeDuplicates(array) {
    const seen = new Set();
    return array.filter((obj) => {
      const nodeId = obj.nodeId;
      if (seen.has(nodeId)) {
        return false;
      } else {
        seen.add(nodeId);
        return true;
      }
    });
  }

  renameKeys(array) {
    return array.map((obj) => {
      const { key, label, ...rest } = obj; 
      return { nodeId: key, category: label, ...rest };
    });
  }

  getEdgeLabels(){
        var textElements = document.querySelectorAll('text.edgeLabel_subt');
            
        var resultArray = [];

        textElements.forEach(function(element) {
            var textContent = element.textContent;
            var style = window.getComputedStyle(element);
            var strokeColor = style.stroke;
            resultArray.push({ text: textContent, rgb: strokeColor });
        });

      return resultArray;
  }

  colorScale(labels) {

    const colorScale = d3.scaleOrdinal()
      .domain(labels)
      .range(d3.schemeCategory10);

    return colorScale;
    
  }
}