function draw_word_cloud() {
	var margin = {top: 10, right: 5, bottom: 10, left: 5};
	var width = 750 - margin.left - margin.right;
	var height = 250 - margin.top - margin.bottom;

	d3.json("./data/wordcloud_output_format.json", function (data) {
		var svg = d3.select("#id_word_cloud_chart")
					.append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
					.style("margin-left", margin.left + "px");

		var g = svg.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var word_count = {};
		var words = [];

		for (var i = 0; i < data.length; i++) {
			word_count[data[i][0]] = data[i][1];
			words[i] = data[i][0];
		}

		var word_entries = d3.entries(word_count);

		var xScale = d3.scaleLinear()
						.domain([0, d3.max(word_entries, function(d) { return d.value; }) ])
						.range([10, 60]);

		var color = d3.scaleOrdinal(d3.schemeCategory20);

		var layout = d3.layout.cloud()
								.size([width, height])
								.timeInterval(20)
								.words(word_entries)
								.fontSize(function(d) { return xScale(+d.value); })
								.text(function(d) { return d.key; })
								.rotate(function() { return ~~(Math.random() * 2) * 90; })
								.fontWeight(["bold"])
								.font("Impact")
								.spiral("rectangular")
								.on("end", draw)
								.start();

		var wordcloud = g.append("g")
						 .attr('class','wordcloud')
						 .attr("transform", "translate(" + width/2 + "," + height/2 + ")");

		function draw(words) {
			wordcloud.selectAll("text")
				.data(words)
				.enter().append("text")
				.style("font-size", function(d) { return xScale(d.value) + "px"; })
				.style("font-family", "Impact")
				.style("fill", function(d, i) { return color(i); })
				.attr("text-anchor", "middle")
				.attr("transform", function(d) {
					return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
				})
				.attr('class','word')
				.text(function(d) { return d.key; });
		}

		d3.layout.cloud().stop();
	});
}

function draw_term_frequency_timeline() {
	var margin = {top: 20, right: 20, bottom: 90, left: 95};
	var width = 762 - margin.left - margin.right;
	var height = 300 - margin.top - margin.bottom;

	var svg = d3.select("#id_term_frequency_timeline_cell").append("svg")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
				.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// slider code
	var x1 = d3.scaleLinear()
				.domain([1981, 2015])
				.range([0, width])
				.clamp(true);

	var slider = svg.append("g")
					.attr("class", "slider")
					.attr("transform", "translate(" + 7 + "," + 210 + ")");

	slider.append("line")
		.attr("class", "track")
		.attr("x1", x1.range()[0])
		.attr("x2", x1.range()[1])
		.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
		.attr("class", "track-inset")
		.select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
		.attr("class", "track-overlay")
		.call(d3.drag()
			.on("start.interrupt", function() { slider.interrupt(); })
			.on("start drag", function() { hue(x1.invert(d3.event.x)); }));

	slider.insert("g", ".track-overlay")
		.attr("class", "ticks")
		.attr("transform", "translate(0," + 0 + ")")
		.selectAll("text")
		.data(x1.ticks(17))
		.enter().append("text")
		.attr("x", x1)
		.attr("text-anchor", "middle")
		.text(function(d) { return d + ""; });

	var handle = slider
		.insert("circle", ".track-overlay")
		.attr("class", "handle")
		.attr("r", 9);

	slider.transition() // Gratuitous intro!
		.duration(0)
		.tween("hue", function() {
		  var i = d3.interpolate(0, 70);
		  return function(t) { hue(t+1981); };
		});

	function hue1(h) {
		handle.attr("cx", x1(h));
	}

	function hue(h) {
		handle.attr("cx", x1(h));

		var x = d3.scaleLinear()
			  .range([0, width]);

		var y = d3.scaleBand()
			.range([height, 0]);

		var xAxis = d3.axisBottom(x)
			.ticks(10, "")
			.tickFormat(d3.format("d"))
			.tickSize(0);
		var yAxis = d3.axisLeft(y);
		var year = parseInt(h);

		d3.tsv("./data/tsvs/data_" + year + ".tsv", type, function(error, data) {
			if (error)
				throw error;

			x.domain([0, d3.max(data, function(d) { return (d.frequency+700); })]);
			y.domain(data.map(function(d) { return d.letter; }))
			 .paddingInner(0.1)
			 .paddingOuter(0.5);

			if (year >= 1979) {
				svg.selectAll(".bar").remove();
				svg.selectAll("text").remove();
				svg.selectAll("circle").remove();

				slider.insert("g", ".track-overlay")
						.attr("class", "ticks")
						.attr("transform", "translate(0," + 18 + ")")
						.selectAll("text")
						.data(x1.ticks(17))
						.enter().append("text")
						.attr("x", x1)
						.attr("text-anchor", "middle")
						.text(function(d) { return d + ""; });

				var handle = slider.insert("circle", ".track-overlay")
									.attr("class", "handle")
									.attr("r", 9);
				handle.attr("cx", x1(h));
				slider.transition() // Gratuitous intro!
						.duration(0)
						.tween("hue1", function() {
						  return function(t) {   hue1(t+1981); };
						});
			}

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis)
			   .append("text")
				.attr("class", "label")
				.attr("transform", "translate(" + width + ",0)")
				.attr("y", -5)
				.style("text-anchor", "end")
				.text("Frequency");

			svg.append("g")
				.attr("class", "y axis")
				.call(yAxis);

			var colors = d3.scaleOrdinal(d3.schemeCategory10).domain(d3.range(0, 9));

			svg.selectAll(".bar")
				.data(data)
			.enter().append("rect")
				.attr("class", "bar")
				.attr("x", 0)
				.attr("height", y.bandwidth())
				.attr("y", function(d) { return y(d.letter); })
				.attr("width", function(d) { return x(d.frequency); })
				//.attr("fill",function(d,i){return colors(i)})
				.style("fill", function(d,i){return colors(i)})

		});

		function type(d) {
			d.frequency = +d.frequency;
			return d;
		}
	}
}

function draw_cooccurrence_matrix() {
	var margin = {top: 80, right: 0, bottom: 10, left: 80},
		width = 360,
		height = 360;

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

	d3.json("./data/cooccurrence_matrix_log_output_format.json", function (term_cooccurrence_data) {
		var matrix = [],
			nodes = term_cooccurrence_data.nodes,
			links = term_cooccurrence_data.links,
			total_items = nodes.length;

		// Compute index per node.
		nodes.forEach(function(node, i) {
			node.index = i;
		});

		for (var i=0; i<25; i++) {
			var single_row = [];
			for (var j=0; j<25; j++) {
				var links_data = links[i*25+j];
				var single_cell = {x: links_data.target, y: links_data.source, z: links_data.value};
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
			tooltip.html(capitalize_Words(nodes[p.y].name) + " [" + nodes[p.y].group + "]</br>" +
					   capitalize_Words(nodes[p.x].name) + " [" + nodes[p.x].group + "]</br>" +
					   "co-occurrence: " + p.z)
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

function draw_dashboard(data_filepath, labels_filepath) {
	/*****************************
	* Step0: Load data from file *
	******************************/

	// load data from a csv file
	d3.csv(data_filepath, function (data) {
		// format our data
		var dtgFormat = d3.timeParse("%Y");

		data.forEach(function(d) {
			d.dtg   = +d.Year;
			d.lat   = d.Title;
			d.mag   = +d.Topic + 1;
			d.depth = +d.nAuthors;
			//console.log(d)
		});

		// load label-map data from file
		d3.csv(labels_filepath, function (label_names) {
			var topic_names = [];
			for (var i = 0; i < label_names.length; i++)
				topic_names[i] = label_names[i].Label;
			/******************************************************
			* Step1: Create the dc.js chart objects & link to div *
			******************************************************/
			var magnitudeChart = dc.barChart("#dc-magnitude-chart");
			var depthChart = dc.barChart("#dc-depth-chart");
			var timeChart = dc.lineChart("#dc-time-chart");
			var dataTable = dc.dataTable("#dc-table-graph");

			/****************************************
			* 	Run the data through crossfilter    *
			****************************************/
			var facts = crossfilter(data);  // Gets our 'facts' into crossfilter
			//console.log(facts);
			/******************************************************
			* Create the Dimensions                               *
			* A dimension is something to group or filter by.     *
			* Crossfilter can filter by exact value, or by range. *
			******************************************************/

			// for Magnitude
			var magValue = facts.dimension(function (d) {
				return d.mag;       // group or filter by magnitude
			});
			//console.log(magValue);
			var magValueGroupSum = magValue.group()
											.reduceSum(function(d) { return d.mag; });	// sums the magnitudes per magnitude
			var magValueGroupCount = magValue.group()
											.reduceCount(function(d) { return d.mag; }) // counts the number of the facts by magnitude

			// For datatable
			var timeDimension = facts.dimension(function (d) {
				return d.dtg;
			}); // group or filter by time

			// for Depth
			var depthValue = facts.dimension(function (d) {
				return d.depth;
			});
			var depthValueGroup = depthValue.group();

			// define a daily volume Dimension
			var volumeByDay = facts.dimension(function(d) {
				return d.dtg;
			});
			// map/reduce to group sum
			var volumeByDayGroup = volumeByDay.group().reduceCount(function(d) { return d.dtg; });

			/***************************************
			* 	Step4: Create the Visualizations   *
			***************************************/
			magnitudeChart
				.width(540)
				.height(240)
				.margins({top: 10, right: 10, bottom: 20, left: 60})
				.dimension(magValue)		// the values across the x axis
				.group(magValueGroupSum)	// the values on the y axis
				.transitionDuration(500)
				.centerBar(true)
				.gap(20)					// bar width Keep increasing to get right then back off.
				//.x(d3.scaleLinear().domain([0, d3.max(data, function(d) { return d.mag; }) + 1])) // adding +1 to show last bar with enough space to its right
				.x(d3.scaleLinear().domain([0, topic_names.length + 1])) // adding +1 to show last bar with enough space to its right
				.elasticY(true)
				.xAxis().tickFormat(function(v) {if (v > 0 && v <= topic_names.length) //valid bars: [1:topic_names.length] (both incl)
													return topic_names[v-1]; // valid indices: [0: topic_names.length-1]
												else
													return "";
												});

			// Depth bar graph
			depthChart
				.width(540)
				.height(240)
				.margins({top: 10, right: 10, bottom: 20, left: 60})
				.dimension(depthValue)
				.group(depthValueGroup)
				.transitionDuration(500)
				.centerBar(true)
				.gap(20)                    // bar width Keep increasing to get right then back off.
				.x(d3.scaleLinear().domain([0, 15]))
				/* Not using max here, as it is skewing the visualization - there are some with nAuthors like 75, 92, 112, 287
					d3.max(data, function(d) { return d.depth; }) + 1 // adding +1 to show last bar with enough space to its right
				*/
				.elasticY(true)
				.xAxis().tickFormat(function(v) {return v;});

			// time graph
			timeChart
				.width(1080)
				.height(200)
				.margins({top: 10, right: 10, bottom: 20, left: 40})
				.dimension(volumeByDay)
				.group(volumeByDayGroup)
				.transitionDuration(500)
				.elasticY(true)
				.x(d3.scaleLinear().domain([1980, 2018])) // scale and domain of the graph
				.xAxis()
				.tickFormat(d3.format(""));

			// Table of articles data
			dataTable
				.width(1080)
				.height(800)
				.dimension(timeDimension)
				.group(function(d) { return "List of some articles corresponding to the filters"
				 })
				.size(10) // number of rows to return
				.columns([
				  function(d) { return d.dtg; },
				  function(d) { return d.lat; },
				  function(d) { return d.mag /*topic_names[d.mag - 1]*/; },
				  function(d) { return d.depth; }
				])
				.sortBy(function(d){ return d.dtg; })
				.order(d3.descending);

			/****************************
			* Step6: Render the Charts  *
			****************************/
			dc.renderAll();
		});
	});
}

(function( $ ) {
	$(document).ready(function () {
		draw_word_cloud();
		draw_term_frequency_timeline();
		draw_cooccurrence_matrix();
		draw_dashboard("./data/title_topics_authors.csv", "./data/topic_labels_unique.txt");
		$('#dropDown').on('change', function(e) {
			var selectedOption = $(this).find(':selected');
			var chart_id = selectedOption.attr('data-id');
			if (chart_id == 'id_all_frequency_charts_div') {
				$('#main-container').hide();
				$('#id_all_frequency_charts_div').show();
			} else if (chart_id == 'main-container') {
				$('#id_all_frequency_charts_div').hide();
				$('#main-container').show();
			}
		});
	});
})( jQuery );
