/*global d3, HistoryBuffer*/

$(function () {
    'use strict';

    var width = 500,
        height = 500;
    var diameter = 300;
    var duration = 500;
    var root;

    var buffer = new HistoryBuffer(1, 1);
    buffer.setBranchingFactor(4);
    buffer.setCapacity(32);

    var plot = $.plot('#placeholder', [], {
        series: {
            historyBuffer: buffer,
            lines: {
                show: true
            }
        },
        legend: {
            show: false
        }
    });

    var counter = 0;

    for (var i = 0; i < 32; i++) {
        var sin = 10 * Math.sin(counter++ * 0.5);
        buffer.push(sin);
    }

    function updateData() {
        var sin = 10 * Math.sin(counter++ * 0.5);
        buffer.push(sin);
        root = getData();
        drawTree();
    }

    setInterval(updateData, 500);

    function levelToD3(buffer, depth, start, end) {
        var accTree = buffer.tree;
        if (depth < 0) {
            var childs = [];

            for (var i = start; i < end; i++) {
                childs.push({
                    name: '' + i + ', ' + buffer.get(i).toFixed(1)
                });
            }
            return childs;
        }

        var level = accTree.levels[depth];
        start = Math.floor(start / level.step) * level.step;
        var nodes = buffer.getTreeNodes(depth, start, end);

        return nodes.map(function (l) {
            return {
                name: 'level' + level.level,
                children: levelToD3(buffer, depth - 1, start, start += level.step)
            };
        });
    }

    function accTree2d3(buffer) {
        var accTree = buffer.tree;
        var depth = accTree.depth;
        var level = accTree.levels[depth - 1];

        return levelToD3(buffer, depth - 1, Math.floor(buffer.startIndex() / level.step) * level.step, buffer.lastIndex());
    }

    function getData() {
        var root = {
            name: 'root',
            children: accTree2d3(buffer)
                /*
                            children: buffer.toSeries().map(function (point) {
                                return {
                                    name: '' + point[0], // + ', ' + point[1].toFixed(2),
                                    children: []
                                };
                            })*/
        };

        return root;
    }

    root = getData();

    function change() {
        if (this.value === 'radialtree') {
            transitionToRadialTree();
        } else if (this.value === 'tree') {
            transitionToTree();
        }
    }

    d3.selectAll('input').on('change', change);

    function transitionToRadialTree() {
        var nodes = radialTree.nodes(root), // recalculate layout
            links = radialTree.links(nodes);

        svg.transition().duration(duration)
            .attr('transform', 'translate(' + (width / 2) + ',' +
                (height / 2) + ')');
        // set appropriate translation (origin in middle of svg)

        link.data(links)
            .transition()
            .duration(duration)
            .style('stroke', '#fc8d62')
            .attr('d', radialDiagonal); //get the new radial path

        node.data(nodes)
            .transition()
            .duration(duration)
            .attr('transform', function (d) {
                return 'rotate(' + (d.x - 90) + ')translate(' + d.y + ')';
            });

        node.select('circle')
            .transition()
            .duration(duration)
            .style('stroke', '#984ea3');
    }

    function transitionToTree() {
        var nodes = tree.nodes(root), //recalculate layout
            links = tree.links(nodes);

        svg.transition().duration(duration)
            .attr('transform', 'translate(40,0)');

        link.data(links)
            .transition()
            .duration(duration)
            .style('stroke', '#e78ac3')
            .attr('d', diagonal); // get the new tree path

        node.data(nodes)
            .transition()
            .duration(duration)
            .attr('transform', function (d) {
                return 'translate(' + d.y + ',' + d.x + ')';
            });

        node.select('circle')
            .transition()
            .duration(duration)
            .style('stroke', '#377eb8');
    }

    var tree = d3.layout.tree()
        .size([height, width - 160]);

    var diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.y, d.x];
        });

    var radialTree = d3.layout.tree()
        .size([360, diameter / 2])
        .separation(function (a, b) {
            return (a.parent === b.parent ? 1 : 2) / a.depth;
        });

    var radialDiagonal = d3.svg.diagonal.radial()
        .projection(function (d) {
            return [d.y, d.x / 180 * Math.PI];
        });


    var svg = d3.select('body').append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(40,0)');

    var nodes, links, node, link;

    function drawTree() {
        svg.selectAll('.node').remove();
        svg.selectAll('.link').remove();

        nodes = tree.nodes(root);
        links = tree.links(nodes);

        link = svg.selectAll('.link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .style('stroke', '#8da0cb')
            .attr('d', diagonal);

        node = svg.selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', function (d) {
                return 'translate(' + d.y + ',' + d.x + ')';
            });

        node.append('circle')
            .attr('r', 4.5)
            .style('stroke', '#e41a1c');

        node.append('text')
            .attr('dx', function (d) {
                return d.children ? -8 : 8;
            })
            .attr('dy', 3)
            .style('text-anchor', function (d) {
                return d.children ? 'end' : 'start';
            })
            .text(function (d) {
                return d.name;
            });
    }

    drawTree();
});