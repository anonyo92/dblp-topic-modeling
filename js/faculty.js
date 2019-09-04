function draw_cooccurrence_matrix() {
	var margin = {top: 140, right: 0, bottom: 10, left: 140},
		width = 500,
		height = 500;

	
	
	var svg = d3.select("#id_cooccurrence_matrix_grid").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.style("margin-left", margin.left + "px")
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.append("rect")
		.attr("class", "background")
		.attr("width", width)
		.attr("height", height);

	svg.append('image')
    .attr('xlink:href', './CSdeptLogo.jpg')
    .attr('width', 180)
    .attr('height', 180)
	.attr('x', 60)
    .attr('y', 850)
	
	d3.json("./data/profs2.json", function (faculty_data) {
		var matrix = [],
			nodes = faculty_data.nodes,
			links = faculty_data.links,
			total_items = nodes.length;

		// Compute index per node.
		nodes.forEach(function(node, i) {
			node.index = i;
		});
		var numdata = 42
		for (var i=0; i<numdata; i++) {
			var single_row = [];
			for (var j=0; j<numdata; j++) {
				var links_data = links[i*numdata+j];
				var single_cell = {x: links_data.target, y: links_data.source, z: Math.round(links_data.value,2)};
				single_row.push(single_cell);
			}
			matrix.push(single_row);
		}

		var matrixScale = d3.scaleBand().range([0, width]).domain(d3.range(total_items)),
			opacityScale = d3.scaleLinear().domain([0, 4]).clamp(true);

		var extent = d3.extent(links.map(function(item) {
			return (item.value);
		}));

		var extent_mid = (extent[0] + extent[1]) / 2;
		var colorScale = chroma.scale(["tomato", "white", "steelblue"]).domain([extent[0], extent_mid, extent[1]]);

		// Precompute the orders.
		var orders = {
			name: d3.range(total_items).sort(function(a, b) { return d3.ascending(nodes[a].index, nodes[b].index); }),
			count: d3.range(total_items).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
			group: d3.range(total_items).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
		};

		// The default sort order.
		matrixScale.domain(orders.name);

		svg.append("rect")
		  .attr("class", "background")
		  .attr("width", width)
		  .attr("height", height);

		var row = svg.selectAll(".row")
		  .data(matrix)
		  .enter().append("g")
		  .attr("class", "row")
		  .attr("transform", function(d, i) { return "translate(0," + matrixScale(i) + ")"; })
		  .each(row);

		row.append("line")
		  .attr("x2", width);

		row.append("text")
		  .attr("class", "label")
		  .attr("x", -6)
		  .attr("y", matrixScale.bandwidth() / 2)
		  .attr("dy", ".32em")
		  .attr("text-anchor", "end")
		  .text(function(d, i) { return capitalize_Words(nodes[i].name); });

		var column = svg.selectAll(".column")
		  .data(matrix)
		  .enter().append("g")
		  .attr("class", "column")
		  .attr("transform", function(d, i) { return "translate(" + matrixScale(i) + ")rotate(-90)"; });

		column.append("line")
		  .attr("x1", -width);

		column.append("text")
		  .attr("class", "label")
		  .attr("x", 6)
		  .attr("y", matrixScale.bandwidth() / 2)
		  .attr("dy", ".32em")
		  .attr("text-anchor", "start")
		  .text(function(d, i) { return capitalize_Words(nodes[i].name); });

		function row(row) {
			var cell = d3.select(this).selectAll(".cell")
							.data(row.filter(function(d) { return d.z; }))
							.enter().append("rect")
							.attr("class", "cell")
							.attr("x", function(d) { return matrixScale(d.x); })
							.attr("width", matrixScale.bandwidth())
							.attr("height", matrixScale.bandwidth())
							//.style("fill-opacity", function(d) { return opacityScale(d.z); })
							.style("fill", function(d) { return colorScale(d.z); })  // nodes[d.x].group
							.on("mouseover", mouseover)
							.on("mouseout", mouseout)
							.style("opacity", 1e-6)
							.transition()
							.style("opacity", 1);
		}

		var tooltip = d3.select("body")
						.append("div")
						.attr("class", "tooltip")
						.style("opacity", 0);

		function mouseover(p) {
			d3.selectAll(".row text").classed("active", (d, i) => {
				return i == p.y;
			});
			d3.selectAll(".column text").classed("active", (d, i) => {
				return i == p.x;
			});
			tooltip.transition().duration(200).style("opacity", .9);
			tooltip.html(capitalize_Words(nodes[p.y].name) + " [" + nodes[p.y].count + "]</br>" +
					   capitalize_Words(nodes[p.x].name) + " [" + nodes[p.x].count + "]</br>" +
					   "Correlation Measure: " + p.z)
			.style("left", (d3.event.pageX + 10) + "px")
			.style("top", (d3.event.pageY - 50) + "px");
		}

		function mouseout() {
			d3.selectAll("text").classed("active", false);
			tooltip.transition().duration(500).style("opacity", 0);
		}

		d3.select("#order").on("change", function() {
			changeOrder(this.value);
		});

		function changeOrder(value) {
			matrixScale.domain(orders[value]);
			var t = svg.transition().duration(2000);

			t.selectAll(".row")
				.delay((d, i) => matrixScale(i) * 4)
				.attr("transform", function(d, i) {
					return "translate(0," + matrixScale(i) + ")";
				})
				.selectAll(".cell")
				.delay(d => matrixScale(d.x) * 4)
				.attr("x", d => matrixScale(d.x));

			t.selectAll(".column")
				.delay((d, i) => matrixScale(i) * 4)
				.attr("transform", (d, i) => "translate(" + matrixScale(i) + ")rotate(-90)");
		}

		function capitalize_Words(str){
			return str.replace(/\w\S*/g, function(txt){
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
		}

		var legend_top = 15;
		var legend_height = 15;

		var legend_svg = d3.select("#legend")
							.append("svg")
							.attr("width", width + margin.left + margin.right)
							.attr("height", legend_height + legend_top)
							.append("g")
							.attr("transform", "translate(" + margin.left + ", " + legend_top + ")");

		var defs = legend_svg.append("defs");

		var gradient = defs.append("linearGradient")
							.attr("id", "linear-gradient");

		var stops = [{offset: 0, color: "tomato", value: extent[0]},
					{offset: .5, color: "white", value: (extent[0] + extent[1]) / 2},
					{offset: 1, color: "steelblue", value: extent[1]}];

		gradient.selectAll("stop")
				.data(stops)
				.enter().append("stop")
				.attr("offset", function(d){ return (100 * d.offset) + "%"; })
				.attr("stop-color", function(d){ return d.color; });

		legend_svg.append("rect")
					.attr("width", width)
					.attr("height", legend_height)
					.style("fill", "url(#linear-gradient)");

		legend_svg.selectAll("text")
					.data(stops)
					.enter().append("text")
					.attr("x", function(d){ return width * d.offset; })
					.attr("dy", -3)
					.style("text-anchor", function(d, i){ return i == 0 ? "start" : i == 1 ? "middle" : "end"; })
					.text(function(d, i){ return (i == 2 ? "<" : "") + d.value.toFixed(2) + (i == 0 ? ">" : ""); });
	});
}

(function( $ ) {
	$(document).ready(function () {

		draw_cooccurrence_matrix();
		$('#id_cooccurrence_matrix_grid').show();
		$('#legend').show();
		
	});
})( jQuery );
