var CodeFlower = function (selector, w, h) {
  this.w = w;
  this.h = h;

  d3.select(selector).selectAll("svg").remove();

  this.svg = d3.select(selector).append("svg:svg")
      .attr('width', w)
      .attr('height', h);

  this.svg.append("svg:rect")
      .style("stroke", "#999")
      .style("fill", "#fff")
      .attr('width', w)
      .attr('height', h);

  this.force = d3.layout.force()
      .on("tick", this.tick.bind(this))
      .charge(function (d) {
          return d._children ? -d.size / 100 : -400;
      })
      .linkDistance(function (d) {
          return d.target._children ? 80 : 50;
      })
      .size([h, w]);
};

CodeFlower.prototype.update = function (json) {
  if (json) this.json = json;

  this.json.fixed = true;
  this.json.x = this.w / 2;
  this.json.y = this.h / 2;

  var nodes = this.flatten(this.json);
  var links = d3.layout.tree().links(nodes);
  var total = nodes.length || 1;

  // remove existing text (will readd it afterwards to be sure it's on top)
  this.svg.selectAll("text").remove();
  this.svg.selectAll("text.textOnNode").remove();

  // Restart the force layout
  this.force
      .gravity(Math.atan(total / 50) / Math.PI * 0.4)
      .nodes(nodes)
      .links(links)
      .start();

  // Update the links
  this.link = this.svg.selectAll("line.link")
      .data(links, function (d) {
          return d.target.name;
      });

  // Enter any new links
  this.link.enter().insert("svg:line", ".node")
      .attr("class", "link")
      .attr("x1", function (d) {
          return d.source.x;
      })
      .attr("y1", function (d) {
          return d.source.y;
      })
      .attr("x2", function (d) {
          return d.target.x;
      })
      .attr("y2", function (d) {
          return d.target.y;
      });

  // Exit any old links.
  this.link.exit().remove();

  // Update the nodes
  this.node = this.svg.selectAll("circle.node")
      .data(nodes, function (d) {
          return d.name;
      })
      .classed("collapsed", function (d) {
          return d._children ? 1 : 0;
      })
      .classed("collapsable", function (d) {
          return d.children ? 1 : 0;
      });

  this.node.transition().attr("r", radiusFunction);

  // Enter any new nodes
  this.node.enter().append('svg:circle')
      .attr("class", "node")
      .classed('directory', function (d) {
          return (d._children || d.children) ? 1 : 0;
      })
      .classed("collapsed", function (d) {
          return d._children ? 1 : 0;
      })
      .classed("collapsable", function (d) {
          return d.children ? 1 : 0;
      })
      .attr("r", radiusFunction)
      .style("fill", function color(d) {
          return "hsl(" + parseInt(360 / total * d.id, 10) + ",90%,70%)";
      })
      .call(this.force.drag)
      .on("click", this.click.bind(this))
      .on("dblclick", this.dblclick.bind(this))
      .on("mouseover", this.mouseover.bind(this))
      .on("mouseout", this.mouseout.bind(this));

  // Exit any old nodes
  this.node.exit().remove();

  this.text = this.svg.append('svg:text')
      .attr('class', 'nodetext')
      .attr('dy', 0)
      .attr('dx', 0)
      .attr('text-anchor', 'middle');

  this.textOnNode = this.svg
      .selectAll("text.textOnNode")
      .data(nodes, function (d) {
          return d.name
      });

  this.textOnNode
      .enter()
      .append('svg:text')
      .text(function (d) {
          return d.name
      })
      .attr('class', function (d) {
          return "textOnNode ".concat(d ? asCssClass(d) : "");
      })
      .style("font-size", "10px")
      .style("text-anchor", "middle")
      .style("fill", "#555")
      .style("font-family", "Arial")
      .on("click", this.dblclick.bind(this));

  this.textOnNode
      .exit()
      .remove();

  return this;
};

CodeFlower.prototype.flatten = function (root) {
  var nodes = [], i = 0;

  function recurse(node) {
      if (node.children) {
          node.size = node.children.reduce(function (p, v) {
              return p + recurse(v);
          }, 0);
      }
      if (!node.id) node.id = ++i;
      nodes.push(node);
      return node.size;
  }

  root.size = recurse(root);
  return nodes;
};

CodeFlower.prototype.click = function (d) {
  // Toggle children on click.
  if (d.children) {
      d._children = d.children;
      d.children = null;
  } else {
      d.children = d._children;
      d._children = null;
  }
  this.update();
};

CodeFlower.prototype.dblclick = function (d) {
  if ("url" in d) {
      window.open(d.url, '_blank');
  }
};

CodeFlower.prototype.mouseover = function (d) {
  this.text.attr('transform', 'translate(' + d.x + ',' + (d.y - 5 - (d.children ? 3.5 : Math.sqrt(d.size) / 2)) + ')')
      .text(d.name + "(" + d.size + ")")
      .style('display', null);
  this.svg.select('.' + asCssClass(d)).style('display', 'none');
};

CodeFlower.prototype.mouseout = function (d) {
  this.text.style('display', 'none');
  this.svg.select('.' + asCssClass(d)).style('display', null);
};

CodeFlower.prototype.tick = function () {
  var h = this.h;
  var w = this.w;
  this.link.attr("x1", function (d) {
      return d.source.x;
  })
      .attr("y1", function (d) {
          return d.source.y;
      })
      .attr("x2", function (d) {
          return d.target.x;
      })
      .attr("y2", function (d) {
          return d.target.y;
      });

  this.node.attr("transform", function (d) {
      return "translate(" + Math.max(5, Math.min(w - 5, d.x)) + "," + Math.max(5, Math.min(h - 5, d.y)) + ")";
  });

  this.textOnNode
      .attr("x", function (d) {
          return d.x;
      })
      .attr("y", function (d) {
          return d.y - 10;
      });
};

CodeFlower.prototype.cleanup = function () {
  this.update([]);
  this.force.stop();
};

function asCssClass(d) {
  return "name" in d ? d.name.replace(".", "") : "";
}

function radiusFunction(d) {
  return d.children ? 10 : Math.pow(d.size, 2 / 5) || 1;
}