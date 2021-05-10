function main() {
    let xLabels = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]
    let svg0 = d3.select('#box-rating'),
        margin = {top: 20, bottom: 50, left: 60, right: 20},
        w = svg0.attr('width'),
        h = svg0.attr('height'),
        width = w / 2 - margin.left - margin.right,
        height = h / 2 - margin.top - margin.bottom,
        svgs = [
            svg0.append('svg').attr('x', 0).attr('y', 0),
            svg0.append('svg').attr('x', w / 2).attr('y', 0),
            svg0.append('svg').attr('x', 0).attr('y', h / 2),
            svg0.append('svg').attr('x', w / 2).attr('y', h / 2),
        ]

    let tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)

    let xScale = d3.scaleBand().range([margin.left, margin.left + width]).domain(xLabels).padding(0.5)

    d3.csv('small_appstore_games.csv', d => {
        return {
            rating: +d['Average User Rating'],
            count: +d['User Rating Count'],
            price: +d['Price'],
            size: +d['Size'],
            nameLen: d['Name'].length
        }
    }).then(dataset => {
        drawBoxPlot(dataset, svgs[0], e => e.count, 'Rating Count (log scale)',
            d3.scaleLog().range([height + margin.top, margin.top]).domain([5, 2500]).nice(),
            true, d3.schemeTableau10[0])
        drawBoxPlot(dataset, svgs[1], e => e.price, 'Price',
            d3.scaleLinear().range([height + margin.top, margin.top]).domain([0, 150]),
            false, d3.schemeTableau10[2])
        drawBoxPlot(dataset, svgs[2], e => e.size, 'Size (log scale)',
            d3.scaleLog().range([height + margin.top, margin.top]).domain([100000, 1000000000]).nice(),
            true, d3.schemeTableau10[4])
        drawBoxPlot(dataset, svgs[3], e => e.nameLen, 'Name Length',
            d3.scaleLinear().range([height + margin.top, margin.top]).domain([0, 100]),
            true, d3.schemeTableau10[5])
    })

    function drawBoxPlot(dataset, svg, getValue, name, yScale, filter, color) {
        let data = xLabels.map(d => {
            return {
                rating: d,
                values: [],
                max: 0,
                q3: 0,
                median: 0,
                q1: 0,
                min: 0,
                outliers: []
            }
        })

        dataset.forEach(elem => {
            if (elem.rating > 0) {
                data.find(d => d.rating === elem.rating).values.push(getValue(elem))
            }
        })
        data.forEach(function (d) {
            let arr = d.values.sort((a, b) => a - b)
            d.min = arr[0]
            d.q1 = arr[~~(arr.length / 4)]
            d.median = arr[~~(arr.length / 2)]
            d.q3 = arr[~~(arr.length * 3 / 4)]
            d.max = arr[arr.length - 1]
            if (filter) {
                let iqr = d.q3 - d.q1,
                    minLim = d.q1 - 1.5 * iqr,
                    maxLim = d.q3 + 1.5 * iqr
                for (let j = 0; d.min < minLim; d.min = arr[j++]) {
                    d.outliers.push(d.min);
                }
                for (let j = arr.length - 1; d.max > maxLim; d.max = arr[j--]) {
                    d.outliers.push(d.max);
                }
            }
        })
        console.log(data)

        function hover(event, d) {
            tooltip.transition().duration(200).style('opacity', 0.9)
            tooltip.html(
                'Average User Rating: ' + d.rating
                + '<br>--- ' + name + ' Info ---'
                + '<br>Max: ' + d.max
                + '<br>Q3: ' + d.q3
                + '<br>Median: ' + d.median
                + '<br>Q1: ' + d.q1
                + '<br>Min: ' + d.min
            )
                .style('left', (event.pageX + 20) + 'px')
                .style('top', (event.pageY + 5) + 'px')
        }

        function exit(d) {
            tooltip.transition().duration(600).style('opacity', 0)
        }

        svg.selectAll('path')
            .data(data)
            .enter()
            .append('path')
            .attr('d', d => d3.line()([
                [xScale(d.rating) + xScale.bandwidth() / 2, yScale(d.max)],
                [xScale(d.rating) + xScale.bandwidth() / 2, yScale(d.min)]]))
            .attr("stroke", "black")
            .attr('stroke-width', 1.5)
            .on('mouseover', hover)
            .on('mouseout', exit)

        svg.selectAll('box')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', d => xScale(d.rating))
            .attr('y', d => yScale(d.q3))
            .attr('width', xScale.bandwidth())
            .attr('height', d => yScale(d.q1) - yScale(d.q3))
            .attr('fill', color)
            .style('stroke', 'black')
            .attr('stroke-width', 1.5)
            .on('mouseover', hover)
            .on('mouseout', exit)

        svg.selectAll('median')
            .data(data)
            .enter()
            .append('path')
            .attr('d', d => d3.line()([
                [xScale(d.rating), yScale(d.median)],
                [xScale(d.rating) + xScale.bandwidth(), yScale(d.median)]]))
            .attr("stroke", "black")
            .attr('stroke-width', 1.5)
            .on('mouseover', hover)
            .on('mouseout', exit)

        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(0, ' + (height + margin.top) + ')')
            .call(d3.axisBottom(xScale).tickValues(xLabels))
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2 + margin.left)
            .attr('y', margin.bottom * 2 / 3)
            .attr('font-size', 10)
            .text('Average User Rating')

        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + margin.left + ', 0)')
            .call(d3.axisLeft(yScale).ticks(3).tickFormat(d3.format('.2s')))
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', - height / 2 - margin.top)
            .attr('y', - margin.left * 2 / 3)
            .attr('font-size', 10)
            .text(name)
    }
}

main()
